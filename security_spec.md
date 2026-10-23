# Security Specification & Payload TDD

## Data Invariants
1. A travel memory cannot exist without belonging to an authenticated user whose `request.auth.uid` matches the document's `userId`.
2. A user can only read, create, update, and delete their own travel memories in `/users/{userId}/travel_memories/{memoryId}`.
3. Path variables like `{userId}` and `{memoryId}` must be valid identifiers matching `^[a-zA-Z0-9_\-]+$`.
4. Coordinates `latitude` and `longitude` must be valid numeric ranges (-90 to 90 and -180 to 180).
5. Photos list must be bounded to maximum 20 photos per memory.
6. Public share entries in `/public_shares/{shareId}` can be read by anyone, but only created, updated, or deleted by the authenticated `ownerId`.
7. `createdAt` must be server-timestamped at creation, and immutable on update.

## The Dirty Dozen Payloads (Security Attack Vectors)
1. **Identity Spoofing**: Attempting to write a travel memory with `userId: "attacker_id"` into another user's subcollection.
2. **Path Traversal / Poisoned ID**: Attempting to create a travel memory with a 2KB poisoned ID containing forbidden characters.
3. **Ghost Field Injection**: Attempting an update with an unauthorized field like `{ isAdmin: true }` or `{ verifiedByGov: true }`.
4. **Rating Boundary Violation**: Setting a rating of `99` or `-5` instead of `0..5`.
5. **Coordinate Poisoning**: Setting `latitude: 9999` and `longitude: -9999`.
6. **Denial of Wallet (Unbounded Array)**: Attempting to save an array of 5,000 photos into a document.
7. **Note Size Attack**: Attempting to inject a 10MB string into `notes` to exceed Firestore document limits.
8. **Unauthorized Cross-User Read**: User B attempting to read user A's private `/users/UserA/travel_memories/mem1`.
9. **Tampering with Public Shares**: User B attempting to update or delete User A's `/public_shares/share1`.
10. **Spoofing Ownership on Public Share**: User B setting `ownerId: UserA` when creating a public share.
11. **Client Timestamp Forgery**: Attempting to supply client timestamp instead of `request.time`.
12. **Unauthenticated Access**: Anonymous/unauthenticated user attempting to write to `/users/{userId}/travel_memories`.
