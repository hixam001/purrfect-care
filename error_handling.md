# 🚨 Purrfect Care — Error Handling Reference

All API errors return a consistent JSON structure. This document covers every error code, what triggers it, and how to handle it on the client.

---

## Standard Error Shape

Every error response — validation, auth, not found, server — uses this shape:

```json
{
  "error": true,
  "error_code": "NOT_FOUND",
  "message": "Cat with id 'abc-123' not found",
  "details": null
}
```

| Field        | Type            | Always present | Description                             |
|---|---|---|---|
| `error`      | `boolean`       | ✅             | Always `true` on error responses        |
| `error_code` | `string`        | ✅             | Machine-readable code (see table below) |
| `message`    | `string`        | ✅             | Human-readable description              |
| `details`    | `object\|array` | ❌ optional    | Extra context (e.g. field-level errors) |

---

## Error Codes Reference

### HTTP 400 — Bad Request

#### `VALIDATION_ERROR`
Triggered automatically when the request body fails Pydantic validation.

```json
{
  "error": true,
  "error_code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [
    { "field": "body → email",    "message": "value is not a valid email address", "type": "value_error.email" },
    { "field": "body → password", "message": "ensure this value has at least 8 characters", "type": "value_error.any_str.min_length" }
  ]
}
```

**`details` array items:**

| Field     | Description                           |
|---|---|
| `field`   | Dot-path to the invalid field         |
| `message` | What went wrong                       |
| `type`    | Pydantic error type code              |

**Common triggers:**
- Missing required field
- Field too short/long (`minLength`, `maxLength`)
- Wrong type (e.g. string where number expected)
- Invalid email format
- Enum value not in allowed list

---

#### `BAD_REQUEST`
Thrown manually when business logic rejects the request.

```json
{
  "error": true,
  "error_code": "BAD_REQUEST",
  "message": "Slot end_time must be after start_time"
}
```

**Common triggers:**
- Booking a slot with invalid time range
- Placing order with 0 items
- Review targeting more than one entity (hospital + store simultaneously)
- Invalid promo code

---

### HTTP 401 — Unauthorized

#### `UNAUTHORIZED`
No token, expired token, or invalid JWT signature.

```json
{
  "error": true,
  "error_code": "UNAUTHORIZED",
  "message": "Invalid or expired token: Signature has expired"
}
```

**Common triggers:**
- Missing `Authorization: Bearer <token>` header
- Token expired (Supabase tokens expire after 1 hour by default)
- Token tampered with or signed with wrong secret
- User deleted but token still used

**Client fix:** Call `POST /api/auth/refresh` with the `refresh_token`, or redirect to login.

---

### HTTP 402 — Payment Required

#### `PAYMENT_FAILED`
Stripe payment processing error.

```json
{
  "error": true,
  "error_code": "PAYMENT_FAILED",
  "message": "Payment failed: Your card was declined",
  "details": { "stripe_code": "card_declined" }
}
```

**Common triggers:**
- Card declined
- Insufficient funds
- 3D Secure authentication required
- Expired card
- Stripe webhook signature mismatch

---

### HTTP 403 — Forbidden

#### `FORBIDDEN`
Authenticated but lacking the required role.

```json
{
  "error": true,
  "error_code": "FORBIDDEN",
  "message": "You do not have permission to perform this action"
}
```

**Role matrix — who can do what:**

| Action                          | Required Role                  |
|---|---|
| Register hospital               | `hospital_admin`               |
| Add/edit hospital services      | `hospital_admin`               |
| Create appointment slots        | `vet`                          |
| Write prescriptions             | `vet`                          |
| Register store                  | `store_owner`                  |
| Add/edit products               | `store_owner`                  |
| Update order status             | `store_owner`                  |
| Approve hospital / store        | `admin`                        |
| Verify vet                      | `admin`                        |
| Add medicines                   | `admin`                        |
| View all users                  | `admin`                        |
| Book appointments / place orders| `cat_owner`                    |
| Send chat messages              | `cat_owner` or `vet`           |

---

### HTTP 404 — Not Found

#### `NOT_FOUND`
Resource does not exist or belongs to another user.

```json
{
  "error": true,
  "error_code": "NOT_FOUND",
  "message": "Hospital with id 'xyz-456' not found"
}
```

**Common triggers:**
- Invalid UUID in path parameter
- Resource deleted
- Trying to access another user's private resource (returns 404, not 403, for security)

---

### HTTP 409 — Conflict

#### `CONFLICT`
Business rule violation — resource state conflict.

```json
{
  "error": true,
  "error_code": "CONFLICT",
  "message": "This appointment slot is already booked"
}
```

**Common triggers:**

| Scenario                                | Message                                     |
|---|---|
| Booking an already-booked slot          | `This appointment slot is already booked`   |
| Registering with an existing email      | `A user with this email already exists`     |
| Duplicate chat room creation            | _(idempotent — returns existing room)_      |
| Cat microchip ID already registered     | `Microchip ID already registered`           |
| Vet already linked to a hospital        | `Vet is already assigned to a hospital`     |
| Medicine contraindication detected      | `Contraindication detected` + details array |

---

### HTTP 500 — Internal Server Error

#### `INTERNAL_ERROR`
Unhandled exception. Should never happen in production.

```json
{
  "error": true,
  "error_code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred"
}
```

> [!NOTE]
> In `development` mode (`APP_ENV=development`), the actual exception message is returned.
> In `production` mode, a generic message is returned and the full traceback is written to logs only.

---

### HTTP 502 — Bad Gateway

#### `EXTERNAL_SERVICE_ERROR`
A third-party service (Stripe, OpenAI, SendGrid, Firebase) returned an error.

```json
{
  "error": true,
  "error_code": "EXTERNAL_SERVICE_ERROR",
  "message": "External service error (Stripe): connection timeout",
  "details": { "service": "Stripe" }
}
```

**Possible services:**

| Service   | When triggered                                       |
|---|---|
| `Stripe`  | Payment intent creation fails, webhook unreachable   |
| `OpenAI`  | AI companion embedding or chat completion fails      |
| `SendGrid`| Email delivery failure (password reset, receipts)    |
| `Firebase`| Push notification dispatch fails                    |
| `Supabase`| Database connection or auth service unreachable      |

---

## Rate Limiting

When rate limits are exceeded the API returns **HTTP 429**:

```json
{
  "error": true,
  "error_code": "RATE_LIMITED",
  "message": "Too many requests. Please slow down."
}
```

**Headers returned:**

| Header                  | Value example | Meaning                     |
|---|---|---|
| `X-RateLimit-Limit`     | `100`         | Max requests per window     |
| `X-RateLimit-Remaining` | `0`           | Requests remaining          |
| `Retry-After`           | `30`          | Seconds until reset         |

---

## Error Handling in Code

### Source files

| File | Purpose |
|---|---|
| [exceptions.py](file:///home/hixam/purrfect-care/backend/app/utils/exceptions.py) | All custom exception classes |
| [error_handler.py](file:///home/hixam/purrfect-care/backend/app/middleware/error_handler.py) | Global FastAPI exception handlers |

### Exception class hierarchy

```
AppException (base)
├── NotFoundException        → 404  NOT_FOUND
├── BadRequestException      → 400  BAD_REQUEST
├── UnauthorizedException    → 401  UNAUTHORIZED
├── ForbiddenException       → 403  FORBIDDEN
├── ConflictException        → 409  CONFLICT
├── PaymentException         → 402  PAYMENT_FAILED
└── ExternalServiceException → 502  EXTERNAL_SERVICE_ERROR

(Auto-handled by FastAPI)
├── RequestValidationError   → 400  VALIDATION_ERROR
└── Exception (catch-all)   → 500  INTERNAL_ERROR
```

### How to throw errors in controllers

```python
from app.utils.exceptions import (
    NotFoundException,
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
    ConflictException,
    PaymentException,
    ExternalServiceException,
)

# 404 — resource missing
raise NotFoundException("Cat", cat_id)

# 400 — bad business logic
raise BadRequestException("Slot end_time must be after start_time")

# 400 — with field details
raise BadRequestException(
    "Invalid input",
    details={"field": "weight_kg", "issue": "must be greater than 0"}
)

# 401 — not logged in
raise UnauthorizedException("Token expired")

# 403 — wrong role
raise ForbiddenException("Only vets can write prescriptions")

# 409 — conflict
raise ConflictException("This appointment slot is already booked")

# 402 — payment
raise PaymentException("Card declined", details={"stripe_code": "card_declined"})

# 502 — external service
raise ExternalServiceException("OpenAI", "rate limit exceeded")
```

---

## Client-Side Handling Checklist

```
✅ Always check response.ok or status code before using data
✅ Parse error_code, not just status code (multiple causes per status)
✅ On 401 UNAUTHORIZED → refresh token → retry once → redirect to login
✅ On 400 VALIDATION_ERROR → show details[] field errors in form UI
✅ On 409 CONFLICT (slot booked) → refresh slots list, prompt re-select
✅ On 429 RATE_LIMITED → wait Retry-After seconds before retry
✅ On 500 INTERNAL_ERROR → show generic error, report to Sentry/logs
✅ On 502 EXTERNAL_SERVICE_ERROR → retry after a delay, notify user
```

---

## Testing Errors in Postman

Use the [`postman_collection.json`](file:///home/hixam/purrfect-care/postman_collection.json) to trigger errors intentionally:

| Scenario to test             | How to trigger                                        |
|---|---|
| `VALIDATION_ERROR`           | Send empty body to `POST /api/auth/register`          |
| `UNAUTHORIZED`               | Remove `Authorization` header on any protected route  |
| `FORBIDDEN`                  | Call `POST /api/admin/medicines` with `cat_owner` role|
| `NOT_FOUND`                  | Use a random UUID as `cat_id`                         |
| `CONFLICT` (slot booked)     | Book same slot twice                                  |
| `VALIDATION_ERROR` (email)   | Use `"email": "not-an-email"` in register             |
| `INTERNAL_ERROR` (simulated) | Disconnect Supabase (clear `.env`) and call any route |
