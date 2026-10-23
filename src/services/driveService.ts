const APP_ROOT_FOLDER_NAME = 'My Philippine Travel Map';

export interface DriveUploadResult {
  fileId: string;
  name: string;
  webViewLink?: string;
  thumbnailUrl?: string;
}

/**
 * Searches for or creates the main app folder in the user's Google Drive.
 */
export async function getOrCreateAppFolder(accessToken: string): Promise<string> {
  const query = encodeURIComponent(
    `name = '${APP_ROOT_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id, name)&spaces=drive`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!searchRes.ok) {
    const errorText = await searchRes.text();
    throw new Error(`Failed to query Google Drive folder: ${searchRes.status} ${errorText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: APP_ROOT_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Dedicated travel photo folder for My Philippine Travel Map app',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Drive folder: ${errText}`);
  }

  const createData = await createRes.json();
  return createData.id;
}

/**
 * Searches for or creates a subfolder (e.g. province or destination name) inside the app folder.
 */
export async function getOrCreateSubfolder(
  accessToken: string,
  parentFolderId: string,
  folderName: string
): Promise<string> {
  const safeName = folderName.replace(/'/g, "\\'");
  const query = encodeURIComponent(
    `name = '${safeName}' and '${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id, name)&spaces=drive`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  // Create subfolder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    }),
  });

  if (!createRes.ok) {
    // If creation fails, fall back to using parentFolderId
    console.warn(`Could not create subfolder '${folderName}', using parent folder instead.`);
    return parentFolderId;
  }

  const createData = await createRes.json();
  return createData.id;
}

/**
 * Uploads a photo file directly to Google Drive into the organized folder structure.
 */
export async function uploadPhotoToDrive(
  accessToken: string,
  file: File,
  folderId: string,
  caption?: string
): Promise<DriveUploadResult> {
  const metadata = {
    name: file.name,
    mimeType: file.type || 'image/jpeg',
    parents: [folderId],
    description: caption || 'Travel memory photo from My Philippine Travel Map',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const fileDataPromise = new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });

  const fileData = await fileDataPromise;

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const fileHeaderPart = `${delimiter}Content-Type: ${file.type || 'image/jpeg'}\r\nContent-Transfer-Encoding: binary\r\n\r\n`;

  const encoder = new TextEncoder();
  const metadataBytes = encoder.encode(metadataPart);
  const fileHeaderBytes = encoder.encode(fileHeaderPart);
  const closeBytes = encoder.encode(closeDelimiter);

  const totalLength = metadataBytes.byteLength + fileHeaderBytes.byteLength + fileData.byteLength + closeBytes.byteLength;
  const combined = new Uint8Array(totalLength);

  let offset = 0;
  combined.set(metadataBytes, offset);
  offset += metadataBytes.byteLength;
  combined.set(fileHeaderBytes, offset);
  offset += fileHeaderBytes.byteLength;
  combined.set(new Uint8Array(fileData), offset);
  offset += fileData.byteLength;
  combined.set(closeBytes, offset);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,thumbnailLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: combined,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Failed to upload photo to Google Drive: ${errText}`);
  }

  const result = await uploadRes.json();
  return {
    fileId: result.id,
    name: result.name || file.name,
    webViewLink: result.webViewLink,
    thumbnailUrl: result.thumbnailLink || `https://lh3.googleusercontent.com/d/${result.id}=s800`,
  };
}

/**
 * Permanently deletes a photo from Google Drive.
 * (MANDATORY per Workspace skill: always pair with user confirmation dialog)
 */
export async function deletePhotoFromDrive(accessToken: string, fileId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 404) {
    const errText = await res.text();
    throw new Error(`Failed to delete file from Google Drive: ${errText}`);
  }
}
