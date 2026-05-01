# Security Specification: MahaLand Extract

## 1. Data Invariants
- A LandRecord MUST have a `userId` that matches the authenticated user's UID.
- Document IDs must be alphanumeric strings up to 128 characters.
- Boolean flags (ceiling, forest, etc.) must be strictly boolean.
- Village, Taluka, and District are mandatory strings.

## 2. The Dirty Dozen Payloads (Target: DENIED)
1. **Identity Spoofing**: `create` with `userId` of another user.
2. **Identity Takeover**: `update` existing record to change `userId`.
3. **Shadow Update**: `update` with extra field `isVerified: true`.
4. **Altered Timestamp**: `create` with `extractionDate` from the future.
5. **PII Leak**: `list` records without filtering by `userId`.
6. **Large Payload**: `create` with `village` string > 500 characters.
7. **Invalid ID**: `create` with document ID containing script tags.
8. **Unauthorized Read**: `get` another user's land record.
9. **Anonymous Write**: `create` without authentication.
10. **Type Mismatch**: `update` boolean flag `forest` with string "YES".
11. **State Shortcut**: `update` `fileName` (should be immutable).
12. **Missing required fields**: `create` without `village`.

## 3. Test Runner Results
All tests in `firestore.rules.test.ts` pass, ensuring these "Dirty Dozen" are blocked.
