# API Contract

This document defines the target HTTP contract for the Express backend. The
calendar and chat endpoints below are planned and are not implemented yet.
Only `GET /health` currently exists. Update this document whenever an endpoint
or its behavior changes.

The product goal is to manage Google Calendar meetings through natural-language
AI conversations, with streamed responses, persistent chat history, agent
working memory, Google Meet and email invite support, and MCP tools for
external AI clients. These are planned capabilities, not currently available
API behavior. Google Calendar access is intended to use Descope Connections.
Contracts for Google synchronization, conversation persistence, and MCP access
must be documented before those capabilities are implemented.

## Conventions

- JSON request and response bodies use `camelCase`.
- Dates and times are ISO 8601 strings with an explicit UTC offset; responses
  use UTC (`Z`).
- Protected endpoints require `Authorization: Bearer <Descope session JWT>`.
- The backend derives the user identity from the validated JWT. Clients must
  not send an authoritative user ID.
- The error envelope is:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid",
    "details": []
  }
}
```

`details` is optional and may contain safe, field-level validation information.
Never return stack traces, SQL, tokens, or internal exception messages.

## Endpoints

### `GET /health`

Public liveness/readiness check. The current implementation also checks the
PostgreSQL connection.

**Success — `200 OK`**

```json
{
  "status": "ok",
  "database": "healthy",
  "message": "Server is healthy"
}
```

**Database unavailable — target `503 Service Unavailable`**

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "The service is temporarily unavailable"
  }
}
```

The current failure response differs from the target envelope and should be
aligned when the central error handling is implemented.

### `GET /api/events?from=<ISO-8601>&to=<ISO-8601>`

List the authenticated user's events in the half-open interval `[from, to)`.
Both query parameters are required and `from` must be earlier than `to`.

**Success — `200 OK`**

```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Project planning",
      "description": null,
      "startsAt": "2026-11-07T10:00:00.000Z",
      "endsAt": "2026-11-07T11:00:00.000Z",
      "location": null,
      "createdAt": "2026-11-01T12:00:00.000Z",
      "updatedAt": "2026-11-01T12:00:00.000Z"
    }
  ]
}
```

An empty result is `200 OK` with `"events": []`.

### `POST /api/events`

Create an event for the authenticated user.

**Request — `application/json`**

```json
{
  "title": "Project planning",
  "description": "Review the next milestone",
  "startsAt": "2026-11-07T10:00:00.000Z",
  "endsAt": "2026-11-07T11:00:00.000Z",
  "location": "Meeting room"
}
```

`title`, `startsAt`, and `endsAt` are required. `description` and `location`
are optional and may be `null`. `endsAt` must be later than `startsAt`.

**Success — `201 Created`**

```json
{
  "event": {
    "id": "uuid",
    "title": "Project planning",
    "description": "Review the next milestone",
    "startsAt": "2026-11-07T10:00:00.000Z",
    "endsAt": "2026-11-07T11:00:00.000Z",
    "location": "Meeting room",
    "createdAt": "2026-11-01T12:00:00.000Z",
    "updatedAt": "2026-11-01T12:00:00.000Z"
  }
}
```

### `PATCH /api/events/:id`

Update the authenticated user's event. At least one editable field is required.
Fields use the same shapes as event creation; `description` and `location`
accept `null` to clear them. The updated event must still have `endsAt` later
than `startsAt`.

**Request — `application/json`**

```json
{
  "title": "Updated planning",
  "location": null
}
```

**Success — `200 OK`**

```json
{
  "event": {
    "id": "uuid",
    "title": "Updated planning",
    "description": "Review the next milestone",
    "startsAt": "2026-11-07T10:00:00.000Z",
    "endsAt": "2026-11-07T11:00:00.000Z",
    "location": null,
    "createdAt": "2026-11-01T12:00:00.000Z",
    "updatedAt": "2026-11-07T12:00:00.000Z"
  }
}
```

### `DELETE /api/events/:id`

Delete the authenticated user's event.

**Success — `204 No Content`**

No response body.

### `POST /api/chat`

Send a message to the calendar agent. This endpoint is planned; streaming
behavior and confirmation rules must be finalized before implementation.

**Request — `application/json`**

```json
{
  "message": "What do I have on Friday?"
}
```

`message` is required. Conversation persistence and identifiers are not
implemented or decided yet.

**Proposed success — `200 OK`**

The response uses Server-Sent Events (`Content-Type: text/event-stream`). The
frontend sends this POST with `fetch` so it can include the bearer token.

```text
event: delta
data: {"text":"You have a planning meeting"}

event: done
data: {}
```

If a failure occurs after streaming starts, send the standard error envelope
as an `error` event, then close the stream:

```text
event: error
data: {"error":{"code":"INTERNAL_ERROR","message":"The request could not be completed"}}
```

This stream format is proposed and must be confirmed before implementation.

## Error status codes

| Status | Code | Meaning |
| --- | --- | --- |
| `400` | `VALIDATION_ERROR` | Invalid body, query, or path parameter |
| `401` | `UNAUTHENTICATED` | Missing, invalid, or expired session |
| `403` | `FORBIDDEN` | Authenticated user is not allowed to perform the operation |
| `404` | `NOT_FOUND` | Resource does not exist or is not visible to this user |
| `409` | `CONFLICT` | Request conflicts with current resource state |
| `500` | `INTERNAL_ERROR` | Unexpected server failure |
| `503` | `SERVICE_UNAVAILABLE` | Required service is unavailable |

Use the same error envelope for all API failures, including validation and
authentication failures. Do not reveal whether another user owns a resource.
