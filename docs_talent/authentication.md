# Talent Protocol API - Authentication

**Official Documentation Source:** https://docs.talentprotocol.com/docs/developers/talent-api/authentication

**API Version:** v3  
**Base URL:** `https://api.talentprotocol.com`

---

## Overview

The Talent Protocol API provides programmatic access to builder profiles, credentials, scores, and social data. This document covers authentication methods required to interact with the API.

---

## Authentication Methods

The Talent Protocol API supports two authentication modes:

### 1. API Key Authentication (Recommended for most use cases)

**Header:** `X-API-KEY`  
**Value:** Your API key string

Every API request must include the `X-API-KEY` header with your valid API key.

**Example:**
```bash
curl -X GET 'https://api.talentprotocol.com/api/v3/profiles' \
  -H 'Accept: application/json' \
  -H 'X-API-KEY: your_api_key_here'
```

#### API Key Types

There are two types of API keys with different permission levels:

| Type | Permissions | Use Case |
|------|-------------|----------|
| `read_only` | Only GET requests | Reading data, searching profiles, fetching scores |
| `write` | All HTTP methods (GET, POST, PUT, DELETE) | Full API access including data modifications |

#### How to Obtain an API Key

**Requirements:**
- Builder Score above 100
- Connected GitHub account

**Steps:**
1. Visit the API key management page: https://www.talentprotocol.com/api-keys
2. Generate a new API key
3. Store it securely (treat it like a password)

**Important:** Never commit API keys to version control or expose them in client-side code.

---

### 2. User Authentication Mode (JWT Token)

**Header:** `Authorization`  
**Value:** `Bearer <jwt_token>`

This mode is used for user-specific operations and requires obtaining a JWT token first.

**Step 1: Obtain JWT Token**

```bash
curl -X POST 'https://api.talentprotocol.com/auth/email_password_login' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Step 2: Use JWT Token in Requests**

```bash
curl -X GET 'https://api.talentprotocol.com/api/v3/profiles/me' \
  -H 'Accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

---

## Best Practices

1. **Security:**
   - Store API keys in environment variables
   - Use secrets management systems in production
   - Rotate keys periodically
   - Never log API keys

2. **Error Handling:**
   - Handle 401 (Unauthorized) responses
   - Implement retry logic with exponential backoff
   - Check API key validity before making bulk requests

3. **Rate Limits:**
   - Respect rate limits (see Rate Limits documentation)
   - Implement request throttling
   - Cache responses when appropriate

---

## Common Authentication Errors

| Status Code | Error | Solution |
|-------------|-------|----------|
| 401 | Missing API key | Include `X-API-KEY` header |
| 401 | Invalid API key | Verify key is correct and active |
| 401 | Expired JWT token | Re-authenticate to get new token |
| 403 | Insufficient permissions | Use `write` API key for non-GET requests |

---

## Additional Resources

- **API Reference:** https://docs.talentprotocol.com/docs/developers/talent-api/api-reference
- **Get API Keys:** https://www.talentprotocol.com/api-keys
- **Rate Limits:** https://docs.talentprotocol.com/docs/developers/talent-api/rate-limits
- **Support:** tech@talentprotocol.com