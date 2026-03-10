# API Reference

## Endpoints

### `GET /api/health`

Health check endpoint. No authentication required.

**Response:**
```json
{ "ok": true }
```

---

### `POST /api/push`

Push session data to the dashboard. Requires push token authentication.

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | Must be `application/json` |
| `X-Push-Token` | Yes | Push token from `config.json` |

**Rate Limit:** 1 request per 3 seconds

**Request Body:**
```json
{
  "sessions": [
    {
      "key": "agent:main:discord:my-server",
      "sessionId": "abc123",
      "resolvedName": "MyBot",
      "updatedAt": 1710000000000,
      "model": "claude-sonnet-4-20250514",
      "kind": "group",
      "lastMsg": "Working on it...",
      "lastTool": "exec",
      "totalTokens": 15000,
      "inputTokens": 12000,
      "outputTokens": 3000,
      "contextTokens": 8000,
      "abortedLastRun": false,
      "ageMs": 5000
    }
  ]
}
```

**Session Fields:**

| Field | Type | Required | Max Length | Description |
|-------|------|----------|-----------|-------------|
| `key` | string | Yes | 200 | Unique session identifier |
| `sessionId` | string | No | — | Session UUID |
| `resolvedName` | string | No | 50 | Display name for the session |
| `updatedAt` | number | No | — | Unix timestamp (ms) of last update |
| `model` | string | No | 50 | AI model name |
| `kind` | string | No | — | Chat type: `group`, `dm`, `channel` |
| `lastMsg` | string | No | 200 | Last message content |
| `lastTool` | string | No | 50 | Last tool used |
| `totalTokens` | number | No | — | Total tokens consumed |
| `inputTokens` | number | No | — | Input tokens consumed |
| `outputTokens` | number | No | — | Output tokens consumed |
| `contextTokens` | number | No | — | Context tokens consumed |
| `abortedLastRun` | boolean | No | — | Whether last run was aborted |
| `ageMs` | number | No | — | Fallback age in ms (used if `updatedAt` is missing) |

**Validation:**
- `sessions` must be an array
- Maximum 500 sessions per request
- String fields are truncated to their max length

**Response (success):**
```json
{ "ok": true }
```

**Response (error):**
```json
{ "error": "unauthorized" }     // 401 - Invalid push token
{ "error": "too fast" }         // 429 - Rate limited
{ "error": "invalid" }          // 400 - Missing sessions array
{ "error": "too many" }         // 400 - More than 500 sessions
{ "error": "bad session" }      // 400 - Invalid session object
```

---

### `GET /api/state`

Get the current dashboard state. Requires login authentication (cookie or query token).

**Authentication:** Cookie `lobster_token` or query param `?token=xxx`

**Response:**
```json
{
  "timestamp": 1710000000000,
  "gatewayOk": true,
  "totalSessions": 5,
  "activeSessions": 2,
  "idleSessions": 1,
  "tokenStats": {
    "total": 150000,
    "input": 120000,
    "output": 30000
  },
  "sessions": [
    {
      "key": "agent:main:discord:my-server",
      "sessionId": "abc123",
      "displayName": "MyBot",
      "channel": "discord",
      "chatType": "group",
      "model": "claude-sonnet-4-20250514",
      "status": "active",
      "updatedAt": 1710000000000,
      "ageMs": 5000,
      "lastMsg": "Working on it...",
      "lastTool": "exec",
      "aborted": false,
      "tokens": 15000,
      "contextTokens": 8000,
      "inputTokens": 12000,
      "outputTokens": 3000
    }
  ],
  "activityLog": [
    {
      "time": "14:30:05",
      "agent": "MyBot",
      "action": "active",
      "color": "green",
      "channel": "discord",
      "ts": 1710000000000
    }
  ]
}
```

---

### `POST /login`

Login with password. Sets an HttpOnly cookie on success.

**Content-Type:** `application/x-www-form-urlencoded`

**Body:**
| Field | Required | Description |
|-------|----------|-------------|
| `password` | Yes | Login password |

**Rate Limit:** 5 attempts per minute per IP

**Response:** Redirect to dashboard (success) or login page with `?error=1` (failure)

---

### `GET /login.html`

Serves the login page. No authentication required.

---

## WebSocket

### `ws://host/ws?token=xxx`

Real-time state updates via WebSocket.

**Authentication:** Query param `token` or cookie `lobster_token`

**Messages (server → client):**
```json
{
  "type": "state",
  "data": {
    // Same structure as GET /api/state response
  }
}
```

**Heartbeat:** Server sends ping every 30 seconds. Dead connections are terminated.

**Auto-reconnect:** The client automatically reconnects after 3 seconds on disconnect.

---

## Status Definitions

| Status | Condition | Color |
|--------|-----------|-------|
| `active` | Updated within 60 seconds | 🟢 Green |
| `idle` | Updated 1-5 minutes ago | 🟡 Yellow |
| `offline` | Updated more than 5 minutes ago | ⚫ Gray |
