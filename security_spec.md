# Security Specification - FloraWild

## 1. Data Invariants
- A `Plant` must belong to an authenticated user (`userId`).
- A `SavedSearch` must belong to an authenticated user (`userId`).
- A `User` profile must exist for every registered user.
- Only users with the `admin` role can manage other users or see all collections.
- Timestamps must be valid and immutable where appropriate.

## 2. The "Dirty Dozen" Payloads (Denial Tests)

1. **Identity Spoofing (Plant)**: Create a plant document where `userId` is not the current user.
2. **Identity Spoofing (Search)**: Create a search document where `userId` is not the current user.
3. **Role Escalation**: Update own user profile to set `role: 'admin'`.
4. **Shadow Field Injection**: Create a plant with an extra `isVerified: true` field not in the schema.
5. **ID Poisoning**: Create a document using a 1MB string as the document ID.
6. **Relational Sync Bypass**: Create a plant referencing a non-existent user (actually handled by auth).
7. **Timestamp Spoofing**: Provide a future `createdAt` timestamp from the client.
8. **PII Leak**: A non-admin user trying to `get` another user's profile.
9. **Blanket Read Attack**: Trying to `list` all plants without a `userId` filter (if rules didn't enforce it).
10. **Terminal State Lock Bypass**: (If we had terminal states, but we don't yet).
11. **Resource Exhaustion**: Sending a 2MB string in the `scientificName` field.
12. **Delete Attack**: A normal user trying to delete another user's plant.

## 3. Test Runner Strategy
We will use the Firestore emulator/test environment to ensure all the above actions result in `PERMISSION_DENIED`.
