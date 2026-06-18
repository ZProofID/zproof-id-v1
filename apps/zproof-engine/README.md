# Humanity Backend — Express + TypeScript

Backend for the PixiJS proof-of-humanity game MVP.

It provides:

- Challenge creation
- Challenge expiry
- Attempt replay protection
- Backend score recomputation
- Bot-risk analytics
- Ed25519 signed humanity attestations
- Public key endpoint for frontend/Soroban-style verification later

No zk yet. This is the backend attestation phase.

## Install

```bash
npm install
cp .env.example .env
npm run dev
```

Server runs on:

```txt
http://localhost:4300
```

## Routes

### Health

```http
GET /health
```

### Create challenge

```http
POST /api/humanity/challenges
Content-Type: application/json

{
  "wallet": "G...optional",
  "sessionId": "optional-session-id"
}
```

Returns:

```json
{
  "challengeId": "...",
  "expiresAt": "...",
  "games": [...],
  "publicKey": "..."
}
```

### Verify attempt

```http
POST /api/humanity/verify
Content-Type: application/json

{
  "challengeId": "...",
  "wallet": "optional-wallet",
  "results": [...]
}
```

Returns:

```json
{
  "passed": true,
  "attestation": {
    "message": {...},
    "signature": "...",
    "publicKey": "..."
  }
}
```

## Frontend integration

1. Call `POST /api/humanity/challenges` before starting the game.
2. Use the returned `challengeId` as the base challenge ID.
3. After all games complete, submit `finalPayload.results` to `POST /api/humanity/verify`.
4. Use the signed attestation as the pass token.

For production, replace the in-memory store with Redis/Postgres.
