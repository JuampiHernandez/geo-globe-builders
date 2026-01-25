# Talent Protocol API - Advanced Profile Search

**Official Documentation Source:** https://docs.talentprotocol.com/docs/developers/talent-api/api-reference/search-for-profiles

**API Version:** v3  
**Base URL:** `https://api.talentprotocol.com`  
**Endpoint:** `GET /search/advanced/profiles`

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Search Criteria](#search-criteria)
4. [Search Examples](#search-examples)
5. [Pagination](#pagination)
6. [Sorting](#sorting)
7. [Advanced Features](#advanced-features)
8. [Response Format](#response-format)
9. [Best Practices](#best-practices)

---

## Overview

The `/search/advanced/profiles` endpoint allows you to search and filter Talent Protocol builder profiles using multiple criteria. This is a powerful GET endpoint that supports complex queries, pagination, sorting, and aggregations.

### Key Capabilities

- **Multi-criteria filtering:** Combine multiple search parameters
- **Flexible pagination:** Page-based or Point-in-Time for consistency
- **Custom sorting:** Sort by score, ID, or other fields
- **Aggregations:** Get statistics without returning all documents
- **Custom queries:** Use OpenSearch Query DSL (paying customers only)

### Authentication

All requests require the `X-API-KEY` header. See [authentication.md](./authentication.md) for details.

---

## Quick Start

### Basic Search Example

```bash
curl -G -X GET 'https://api.talentprotocol.com/search/advanced/profiles' \
  -H 'Accept: application/json' \
  -H 'X-API-KEY: your_api_key_here' \
  --data-urlencode 'query={}' \
  --data-urlencode 'sort={"score": {"order": "desc"}, "id": {"order": "desc"}}' \
  --data-urlencode 'page=1' \
  --data-urlencode 'per_page=25'
```

### JavaScript/TypeScript Example (Browser)

```javascript
const data = {
  query: {
    score: { min: 100, max: 500 },
    humanCheckmark: true
  },
  sort: {
    score: { order: "desc" },
    id: { order: "desc" }
  },
  page: 1,
  per_page: 25
};

const queryString = Object.keys(data)
  .map(key => `${key}=${encodeURIComponent(JSON.stringify(data[key]))}`)
  .join("&");

const response = await fetch(
  `https://api.talentprotocol.com/search/advanced/profiles?${queryString}`,
  {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "X-API-Key": process.env.TALENT_API_KEY
    }
  }
);

const result = await response.json();
console.log(`Found ${result.pagination.total} profiles`);
```

---

## Search Criteria

The `query` parameter accepts an object with the following search criteria. **All criteria can be combined** to create complex filters.

### 1. Search by Profile IDs

Find profiles by their UUID identifiers.

```json
{
  "query": {
    "profileIds": [
      "ab0bbf06-1234-5678-9abc-3a83c8e14",
      "34ec610-5678-1234-abcd-38482bfb1"
    ]
  }
}
```

**Features:**
- Partial matching supported (returns profiles whose UUID includes the given terms)
- **Exact match:** Add `"exactMatch": true` to query object for case-insensitive exact matching

**Use Cases:**
- Fetching specific known profiles
- Batch profile retrieval
- Profile verification

---

### 2. Search by Wallet Addresses

Find profiles by associated blockchain wallet addresses.

```json
{
  "query": {
    "walletAddresses": [
      "0x324e9e13d...7e94462",
      "0xec4a...eae7ca"
    ]
  }
}
```

**Features:**
- Partial matching supported
- **Exact match:** Add `"exactMatch": true` for case-insensitive exact matching

**Use Cases:**
- Finding profiles by on-chain identity
- Wallet-based lookups
- Cross-referencing blockchain data

---

### 3. Search by Tags

Find profiles that have **ALL** specified tags.

```json
{
  "query": {
    "tags": ["web3", "developer", "solidity"]
  }
}
```

**Important:** This is an AND operation - profiles must have all tags listed.

**Use Cases:**
- Finding builders with specific skill combinations
- Community-based filtering
- Niche talent discovery

---

### 4. Search by Main Role

Find profiles with **ANY** of the specified main roles.

```json
{
  "query": {
    "mainRole": ["engineering", "design", "founder_ceo"]
  }
}
```

**Available Roles:**
- `community`
- `creator`
- `data_research`
- `design`
- `engineering`
- `founder_ceo`
- `growth_sales`
- `investor`
- `operations`
- `other`
- `product`
- `unknown`

**Note:** Each profile has exactly ONE main role.

**Use Cases:**
- Role-based hiring
- Team composition analysis
- Skill-specific searches

---

### 5. Search by "Open To"

Find profiles based on their availability status.

```json
{
  "query": {
    "openTo": ["full_time_roles", "freelance_contract_work"]
  }
}
```

**Available Options:**
- `full_time_roles`
- `freelance_contract_work`
- `co_founders_collaborators`
- `investment_funding`
- `not_open_to`

**Note:** Each profile has exactly ONE "open to" value.

**Use Cases:**
- Finding available talent
- Recruiting pipelines
- Co-founder matching

---

### 6. Search by Identity (Free Text)

Flexible search across multiple identity-related fields.

```json
{
  "query": {
    "identity": "vitalik"
  }
}
```

**Searches across:**

**Top-Level Fields:**
- Display Name
- Email
- ENS
- Main Wallet
- Name
- Talent Protocol ID
- User Display Name
- Username
- User UUID
- UUID

**Nested Fields:**
- Account identifiers and usernames
- Social account names, display names, external IDs
- On-chain identifiers (Basename, ENS, CyberID, etc.)

**Features:**
- **Exact match:** Add `"exactMatch": true` for case-insensitive exact matching
- **Scope-limited search:** Use prefixes like `ens:vitalik` or `twitter:username`

#### Scope Prefixes

```json
{
  "query": {
    "identity": "ens:panagiotismatsinopoulos.eth"
  }
}
```

**Available Prefixes:**
- `basename` - Base network names
- `displayName` - Profile display names
- `email` - Email addresses
- `ens` - Ethereum Name Service
- `farcaster` - Farcaster usernames
- `github` - GitHub usernames
- `lens` - Lens Protocol handles
- `linkedin` - LinkedIn profiles
- `mainWallet` - Primary wallet address
- `name` - Profile names
- `profileId` - Profile identifiers
- `social` - General social accounts
- `talentProtocol` - Talent Protocol IDs
- `twitter` / `x` - Twitter/X handles
- `userDisplayName` - User display names
- `username` - Usernames
- `userUuid` - User UUIDs
- `uuid` - Profile UUIDs
- `wallet` - Wallet addresses

**Important:** The following scopes ALWAYS use exact match and are case-sensitive:
- `uuid`
- `userUuid`
- `profileId`
- `talentProtocol`

**Use Cases:**
- Name-based searches
- Social media handle lookups
- ENS resolution
- Multi-platform identity matching

---

### 7. Search by Score Range

Filter profiles by their Builder Score or other scorer metrics.

```json
{
  "query": {
    "score": {
      "min": 100,
      "max": 500,
      "scorer": "Builder Score"
    }
  }
}
```

**Parameters:**
- `min` - Minimum score (inclusive)
- `max` - Maximum score (inclusive)
- `scorer` - Optional: Specific scorer name (defaults to "Builder Score")

**Use Cases:**
- Finding top builders
- Filtering by reputation
- Quality-based searches

---

### 8. Search by Credentials

Filter by specific credentials and their value ranges.

```json
{
  "query": {
    "credentials": [
      {
        "slug": "base_basecamp",
        "valueRange": { "min": 10, "max": 30 }
      },
      {
        "slug": "arbitrum_out_transactions",
        "valueRange": { "min": 10, "max": 32 }
      }
    ]
  }
}
```

**Credential Object Properties:**

| Property | Required | Description |
|----------|----------|-------------|
| `slug` | Optional* | Unique credential identifier (exact match) |
| `category` | Optional* | Credential category (exact match) |
| `valueRange` | Optional | Min/max value filter |
| `valueRange.min` | Optional | Minimum value (default: 1) |
| `valueRange.max` | Optional | Maximum value (default: 2^256-1) |
| `readableValue` | Optional | Text search in readable value field |

*At least one of `slug` or `category` must be specified.

**Important:** 
- ALL credentials in the array must match (AND operation)
- ALL conditions within a credential must be satisfied
- Get available credential slugs from `GET /data_issuers_meta`

**Use Cases:**
- On-chain activity filtering
- Credential-based verification
- Achievement-based searches

---

### 9. Search by Human Checkmark

Filter profiles by human verification status.

```json
{
  "query": {
    "humanCheckmark": true
  }
}
```

**Values:**
- `true` - Only verified humans
- `false` - Only non-verified profiles
- Omit parameter - Return both

**Use Cases:**
- Bot filtering
- Verified talent pools
- Quality assurance

---

### 10. Custom Query (Paying Customers Only)

Use OpenSearch Query DSL for advanced queries.

```json
{
  "query": {
    "customQuery": {
      "bool": {
        "must": [
          {
            "regexp": {
              "location": {
                "value": ".*london.*"
              }
            }
          }
        ]
      }
    }
  }
}
```

**Get Available Fields:**

```bash
curl -X GET 'https://api.talentprotocol.com/search/advanced/metadata/fields/profiles/default' \
  -H 'Accept: application/json' \
  -H 'X-API-KEY: your_paying_api_key'
```

**Response Format:**

```json
[
  {
    "name": "bio",
    "label": "Bio",
    "inputType": "text",
    "valueEditorType": "text"
  },
  {
    "name": "location",
    "label": "Location",
    "inputType": "text",
    "valueEditorType": "text"
  }
]
```

**Field Properties:**
- `name` - Field name for queries (use this in customQuery)
- `label` - Human-readable label
- `inputType` - Data type: `text`, `number`, `datetime-local`
- `valueEditorType` - UI element type: `text`, `select`, `multi-select`, `checkbox`
- `values` - Available values for select fields

**Use Cases:**
- Complex location-based searches
- Regular expression matching
- Advanced filtering logic
- Custom business logic

---

## Search Examples

### Example 1: Top Verified Builders with Base Credentials

```bash
curl -G -X GET 'https://api.talentprotocol.com/search/advanced/profiles' \
  -H 'Accept: application/json' \
  -H 'X-API-KEY: your_api_key' \
  --data-urlencode 'query={"score": {"max": 12345, "min": 100}, "humanCheckmark": true, "credentials": [{"slug": "base_basename", "valueRange": {"min": 1}}]}' \
  --data-urlencode 'sort={"score": {"order": "desc"}, "id": {"order": "desc"}}' \
  --data-urlencode 'page=1' \
  --data-urlencode 'per_page=25'
```

### Example 2: Engineers Open to Full-Time Roles

```json
{
  "query": {
    "mainRole": ["engineering"],
    "openTo": ["full_time_roles"],
    "score": { "min": 200 }
  },
  "sort": {
    "score": { "order": "desc" },
    "id": { "order": "desc" }
  },
  "page": 1,
  "per_page": 25
}
```

### Example 3: Find Profile by ENS Name

```json
{
  "query": {
    "identity": "ens:vitalik.eth",
    "exactMatch": true
  },
  "page": 1,
  "per_page": 1
}
```

### Example 4: Multi-Tag Skilled Developers

```json
{
  "query": {
    "tags": ["solidity", "smart-contracts", "defi"],
    "humanCheckmark": true,
    "mainRole": ["engineering"]
  },
  "sort": {
    "score": { "order": "desc" },
    "id": { "order": "desc" }
  },
  "page": 1,
  "per_page": 50
}
```

---

## Pagination

### Overview

Pagination requires sorting for consistent results. Always include the `sort` parameter and use the same sort conditions across pages.

### Per Page Limits

| Customer Type | Max `per_page` |
|---------------|----------------|
| Free | 25 |
| Paying | 250 |

### Method 1: Page-Based Pagination (Default)

**Best for:** UI applications, browsing small result sets

**Limitations:**
- Results may shift between pages if data changes
- Cannot access more than 10,000 total profiles (`page × per_page ≤ 10,000`)
- Less consistent for large-scale data processing

**Example:**

```json
{
  "query": { "humanCheckmark": true },
  "sort": { "score": { "order": "desc" }, "id": { "order": "desc" } },
  "page": 1,
  "per_page": 25
}
```

**Response:**

```json
{
  "profiles": [ /* ... */ ],
  "pagination": {
    "current_page": 1,
    "last_page": 400,
    "total": 10000,
    "total_for_page": 25,
    "point_in_time_id": null,
    "search_after": null
  }
}
```

---

### Method 2: Point-in-Time Pagination (Paying Customers Only)

**Best for:** Scripts, data exports, consistent page-to-page results

**Advantages:**
- Consistent results across pages (snapshot-based)
- Can access ALL profiles (no 10,000 limit)
- Higher `per_page` limit (250)

**Disadvantages:**
- More resource-intensive
- Requires managing `point_in_time_id` and `search_after`

#### How It Works

**Step 1: First Page Request**

```json
{
  "query": { "humanCheckmark": true },
  "sort": { "score": { "order": "desc" }, "id": { "order": "desc" } },
  "per_page": 250,
  "keep_alive_minutes": 30
}
```

**Important:** 
- Do NOT include `page` parameter
- Do NOT include `point_in_time_id` or `search_after`
- `keep_alive_minutes` must be ≤ 60

**Step 1: Response**

```json
{
  "profiles": [ /* ... */ ],
  "pagination": {
    "current_page": 1,
    "last_page": null,
    "total": 50000,
    "total_for_page": 250,
    "point_in_time_id": "abc123xyz",
    "search_after": [100, "profile_id_here"]
  }
}
```

**Step 2: Subsequent Page Requests**

```json
{
  "query": { "humanCheckmark": true },
  "sort": { "score": { "order": "desc" }, "id": { "order": "desc" } },
  "per_page": 250,
  "keep_alive_minutes": 30,
  "point_in_time_id": "abc123xyz",
  "search_after": [100, "profile_id_here"]
}
```

**Important:**
- Use `point_in_time_id` and `search_after` from previous response
- Keep the same `query` and `sort` parameters
- Process pages within `keep_alive_minutes` window

**Step 3: Continue Until Complete**

Repeat Step 2 until `pagination.total_for_page` is less than `per_page`, indicating the last page.

---

## Sorting

### Overview

Sorting ensures consistent pagination and result ordering. Always sort by multiple fields to handle ties.

### Recommended Sort Pattern

```json
{
  "sort": {
    "score": {
      "order": "desc",
      "scorer": "Builder Score"
    },
    "id": {
      "order": "desc"
    }
  }
}
```

### Sort Options

| Field | Description | Values |
|-------|-------------|--------|
| `score` | Profile score | `"asc"` or `"desc"` |
| `score.scorer` | Specific scorer name | String (e.g., "Builder Score") |
| `id` | Internal database ID | `"asc"` or `"desc"` |

**Note:** The `id` field refers to an internal database ID, not the profile UUID.

### Best Practices

1. **Always include `id` as secondary sort** - Ensures deterministic ordering when scores are equal
2. **Use consistent sort across pages** - Required for pagination to work correctly
3. **Specify scorer for score-based sorts** - Clarifies which score to use

---

## Advanced Features

### 1. Aggregations (Statistics Without Documents)

Get statistics without returning matching profiles.

**Example: Get Maximum Builder Score**

```bash
curl -G -X GET 'https://api.talentprotocol.com/search/advanced/profiles' \
  -H 'Accept: application/json' \
  -H 'X-API-KEY: your_api_key' \
  --data-urlencode 'query={"score": {"max": 200, "min": 100}}' \
  --data-urlencode 'returnItems=false' \
  --data-urlencode 'aggregations={"scores_nested": {"nested": {"path": "scores"}, "aggs": {"filtered_scores": {"filter": {"bool": {"must": [{"term": {"scores.scorer_slug": "builder_score"}}, {"range": {"scores.points": {"gte": 100, "lte": 200}}}]}}, "aggs": {"maximum_score": {"max": {"field": "scores.points"}}}}}}}'
```

**Aggregation JSON Structure:**

```json
{
  "scores_nested": {
    "nested": {
      "path": "scores"
    },
    "aggs": {
      "filtered_scores": {
        "filter": {
          "bool": {
            "must": [
              { "term": { "scores.scorer_slug": "builder_score" } },
              {
                "range": {
                  "scores.points": {
                    "gte": 100,
                    "lte": 200
                  }
                }
              }
            ]
          }
        },
        "aggs": {
          "maximum_score": {
            "max": {
              "field": "scores.points"
            }
          }
        }
      }
    }
  }
}
```

**Use Cases:**
- Getting count of matching profiles
- Finding min/max/avg scores
- Statistical analysis
- Dashboard metrics

---

### 2. Return Items Control

Control whether matching documents are returned.

**Parameters:**
- `returnItems=true` (default) - Return matching profiles
- `returnItems=false` - Only return pagination and aggregations

**Example:**

```bash
curl -G -X GET 'https://api.talentprotocol.com/search/advanced/profiles' \
  -H 'Accept: application/json' \
  -H 'X-API-KEY: your_api_key' \
  --data-urlencode 'query={"humanCheckmark": true}' \
  --data-urlencode 'returnItems=false' \
  --data-urlencode 'page=1' \
  --data-urlencode 'per_page=1'
```

**Use Cases:**
- Getting total count without data
- Aggregation-only queries
- Existence checks

---

### 3. View Modes

Control the level of detail in responses.

**Available Views:**
- `normal` (default) - Full profile data
- `minimal` - Reduced data set
- `scores_minimal` - Only scores and minimal profile info

**Example:**

```bash
curl -G -X GET 'https://api.talentprotocol.com/search/advanced/profiles' \
  -H 'Accept: application/json' \
  -H 'X-API-KEY: your_api_key' \
  --data-urlencode 'query={}' \
  --data-urlencode 'view=minimal' \
  --data-urlencode 'page=1' \
  --data-urlencode 'per_page=25'
```

**Use Cases:**
- Reducing bandwidth
- Faster responses
- List views vs detail views

---

### 4. Debug Mode

Enable debug information in responses.

**Example:**

```bash
curl -G -X GET 'https://api.talentprotocol.com/search/advanced/profiles' \
  -H 'Accept: application/json' \
  -H 'X-API-KEY: your_api_key' \
  --data-urlencode 'query={}' \
  --data-urlencode 'debug=true' \
  --data-urlencode 'page=1' \
  --data-urlencode 'per_page=25'
```

---

## Response Format

### Successful Response (200 OK)

```json
{
  "profiles": [
    {
      "id": "abc123-uuid-here",
      "bio": "Full-stack developer passionate about Web3",
      "created_at": "2024-07-29T15:51:28.071Z",
      "display_name": "Alice Builder",
      "human_checkmark": true,
      "image_url": "https://...",
      "location": "San Francisco, CA",
      "name": "Alice",
      "relative_path": "/alice",
      "profile_refreshed_at": "2024-07-29T15:51:28.071Z",
      "refreshing_profile_enqueued_at": "2024-07-29T15:51:28.071Z",
      "calculating_score": false,
      "tags": ["web3", "solidity", "react"],
      "verified_nationality": true,
      "builder_score": {
        "points": 450,
        "last_calculated_at": "2024-07-29T15:51:28.071Z"
      },
      "scores": [
        {
          "slug": "builder_score",
          "points": 450,
          "last_calculated_at": "2024-07-29T15:51:28.071Z"
        }
      ]
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 400,
    "total": 10000,
    "total_for_page": 25,
    "point_in_time_id": null,
    "search_after": null
  }
}
```

### Profile Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Profile UUID |
| `bio` | string | Profile biography |
| `created_at` | datetime | Profile creation timestamp |
| `display_name` | string | Display name |
| `human_checkmark` | boolean | Human verification status |
| `image_url` | string | Profile image URL |
| `location` | string | Geographic location |
| `name` | string | Profile name |
| `relative_path` | string | Profile URL path |
| `profile_refreshed_at` | datetime | Last refresh timestamp |
| `refreshing_profile_enqueued_at` | datetime | Refresh queue timestamp |
| `calculating_score` | boolean | Score calculation in progress |
| `tags` | array | Skill/interest tags |
| `verified_nationality` | boolean | Nationality verification status |
| `builder_score` | object | Builder Score details |
| `scores` | array | All scorer scores |

### Pagination Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `current_page` | number | Current page number |
| `last_page` | number | Total number of pages |
| `total` | number | Total matching profiles |
| `total_for_page` | number | Profiles in current page |
| `point_in_time_id` | string | PIT pagination ID (null for page-based) |
| `search_after` | array | PIT pagination cursor (null for page-based) |

---

### Error Responses

#### 400 Bad Request

```json
{
  "error": "Invalid query parameter",
  "message": "The 'score.min' value must be a number"
}
```

**Common Causes:**
- Invalid JSON in query parameters
- Missing required fields
- Invalid field values
- Malformed URL encoding

---

#### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

**Common Causes:**
- Missing `X-API-KEY` header
- Invalid API key
- Expired API key

---

## Best Practices

### 1. Query Construction

✅ **DO:**
- Combine multiple criteria for precise results
- Use exact match when searching for specific identifiers
- Include both `score` and `id` in sort for deterministic ordering
- URL-encode all query parameters

❌ **DON'T:**
- Make overly broad queries without filters
- Forget to URL-encode JSON parameters
- Use page-based pagination for large data exports
- Omit sorting when paginating

---

### 2. Performance Optimization

✅ **DO:**
- Use `returnItems=false` when only counting
- Use `minimal` view for list displays
- Cache results when appropriate
- Use Point-in-Time pagination for consistency

❌ **DON'T:**
- Fetch all profiles in one request
- Make redundant API calls
- Ignore rate limits
- Use high `per_page` values unnecessarily

---

### 3. Error Handling

```javascript
async function searchProfiles(query) {
  try {
    const response = await fetch(/* ... */);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key');
      } else if (response.status === 400) {
        const error = await response.json();
        throw new Error(`Bad request: ${error.message}`);
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Search failed:', error);
    // Implement retry logic with exponential backoff
    throw error;
  }
}
```

---

### 4. Pagination Best Practices

**For UI Applications:**
```javascript
// Use page-based pagination
const fetchPage = async (pageNumber) => {
  const data = {
    query: { humanCheckmark: true },
    sort: { score: { order: "desc" }, id: { order: "desc" } },
    page: pageNumber,
    per_page: 25
  };
  // ... fetch logic
};
```

**For Data Exports:**
```javascript
// Use Point-in-Time pagination
const exportAllProfiles = async () => {
  let allProfiles = [];
  let pointInTimeId = null;
  let searchAfter = null;
  let hasMore = true;
  
  while (hasMore) {
    const data = {
      query: { humanCheckmark: true },
      sort: { score: { order: "desc" }, id: { order: "desc" } },
      per_page: 250,
      keep_alive_minutes: 30
    };
    
    if (pointInTimeId) {
      data.point_in_time_id = pointInTimeId;
      data.search_after = searchAfter;
    }
    
    const result = await fetch(/* ... */);
    const json = await result.json();
    
    allProfiles.push(...json.profiles);
    
    pointInTimeId = json.pagination.point_in_time_id;
    searchAfter = json.pagination.search_after;
    hasMore = json.pagination.total_for_page === 250;
  }
  
  return allProfiles;
};
```

---

### 5. Rate Limiting

**Free Tier:**
- Cached data (may be stale)
- Lower rate limits
- Max 25 results per page

**Paying Tier:**
- Real-time data
- Higher rate limits
- Max 250 results per page
- Point-in-Time pagination
- Custom queries

**Implementation:**
```javascript
class RateLimiter {
  constructor(requestsPerSecond) {
    this.delay = 1000 / requestsPerSecond;
    this.lastRequest = 0;
  }
  
  async throttle() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.delay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.delay - timeSinceLastRequest)
      );
    }
    
    this.lastRequest = Date.now();
  }
}

const limiter = new RateLimiter(5); // 5 requests per second

async function searchWithRateLimit(query) {
  await limiter.throttle();
  return await searchProfiles(query);
}
```

---

## Complete Request Parameters Reference

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | object | Yes | Search criteria object |
| `sort` | object | Recommended | Sort specification |
| `page` | number | No | Page number (page-based pagination) |
| `per_page` | number | No | Results per page (max: 25 free, 250 paying) |
| `keep_alive_minutes` | number | No | PIT pagination keep-alive (1-60, paying only) |
| `point_in_time_id` | string | No | PIT pagination ID (paying only) |
| `search_after` | array | No | PIT pagination cursor (paying only) |
| `returnItems` | boolean | No | Return matching documents (default: true) |
| `aggregations` | object | No | Aggregation specification |
| `view` | string | No | Response detail level: `normal`, `minimal`, `scores_minimal` |
| `debug` | boolean | No | Enable debug mode |

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `X-API-KEY` | Yes | Your Talent Protocol API key |
| `Authorization` | No | JWT token for user-specific operations |
| `Accept` | Recommended | Set to `application/json` |

---

## Additional Resources

- **Authentication Guide:** [authentication.md](./authentication.md)
- **Official Docs:** https://docs.talentprotocol.com/docs/developers/talent-api/api-reference/search-for-profiles
- **API Reference:** https://docs.talentprotocol.com/docs/developers/talent-api/api-reference
- **Get API Keys:** https://www.talentprotocol.com/api-keys
- **Rate Limits:** https://docs.talentprotocol.com/docs/developers/talent-api/rate-limits
- **Pagination Guide:** https://docs.talentprotocol.com/docs/developers/talent-api/pagination
- **Data Issuers Meta:** https://docs.talentprotocol.com/docs/developers/talent-api/api-reference/data-issuers-meta
- **Support:** tech@talentprotocol.com

---

## Changelog

- **2024-07-29:** Initial documentation
- **2026-01-23:** Enhanced documentation with AI-agent-friendly structure and comprehensive examples

---

## Quick Reference Cheat Sheet

```bash
# Basic search
curl -G 'https://api.talentprotocol.com/search/advanced/profiles' \
  -H 'X-API-KEY: key' \
  --data-urlencode 'query={}' \
  --data-urlencode 'page=1' \
  --data-urlencode 'per_page=25'

# Search by score
--data-urlencode 'query={"score": {"min": 100, "max": 500}}'

# Search verified humans
--data-urlencode 'query={"humanCheckmark": true}'

# Search by role
--data-urlencode 'query={"mainRole": ["engineering"]}'

# Search by tags (AND)
--data-urlencode 'query={"tags": ["web3", "solidity"]}'

# Search by identity
--data-urlencode 'query={"identity": "vitalik"}'

# Search by ENS (exact)
--data-urlencode 'query={"identity": "ens:vitalik.eth", "exactMatch": true}'

# Sort by score
--data-urlencode 'sort={"score": {"order": "desc"}, "id": {"order": "desc"}}'

# Get count only
--data-urlencode 'returnItems=false'
```
