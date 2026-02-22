# Digital Clientele — AADE DCL Middleware for Car Rental

A Node.js + Express + TypeScript REST API that acts as middleware between your application and the AADE (Ανεξάρτητη Αρχή Δημοσίων Εσόδων) **Ψηφιακό Πελατολόγιο** (Digital Clientele) API.

This middleware is **focused exclusively on the Rental sector** (Ενοικίαση Οχημάτων / `clientServiceType = 1`). It accepts simple JSON requests, converts them to the AADE-required namespaced XML format, and returns parsed JSON responses.

> Based on **DCL API Documentation v1.1** — June 2025

---

## Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Reference](#api-reference)
  - [Health & Info](#health--info)
  - [SendClient — Create Entry](#sendclient--create-entry-step-1)
  - [UpdateClient — Update/Complete Entry](#updateclient--updatecomplete-entry-steps-2--3)
  - [CancelClient — Cancel Entry](#cancelclient--cancel-entry)
  - [RequestClients — Query Entries](#requestclients--query-entries)
  - [ClientCorrelations — Correlate with Invoice](#clientcorrelations--correlate-with-invoice-step-4)
- [Rental Workflow — The 4 Steps](#rental-workflow--the-4-steps)
  - [Step 1 — SendClient](#step-1--sendclient)
  - [Step 2 — UpdateClient (Add Amount)](#step-2--updateclient-add-amount)
  - [Step 3 — UpdateClient (Complete Entry)](#step-3--updateclient-complete-entry)
  - [Step 4 — ClientCorrelations](#step-4--clientcorrelations)
- [Service Types (Advanced)](#service-types-advanced)
  - [Recurring Service](#recurring-service-επαναλαμβανόμενη-υπηρεσία)
  - [Continuous Service](#continuous-service-διαρκήςλήψη-δικαιώματος)
  - [Continuous Lease](#continuous-lease-service-διαρκής-μίσθωσηυπηρεσία)
- [Enums & Accepted Values](#enums--accepted-values)
- [Error Handling](#error-handling)
- [Postman Collection](#postman-collection)
- [Project Structure](#project-structure)
- [AADE Registration](#aade-registration)

---

## Architecture

```
┌──────────────┐       JSON        ┌────────────────────┐       XML        ┌──────────────┐
│  Your App /  │  ──────────────►  │  Digital Clientele │  ──────────────►  │   AADE DCL   │
│   Postman    │  ◄──────────────  │    Middleware       │  ◄──────────────  │   REST API   │
└──────────────┘       JSON        └────────────────────┘       XML        └──────────────┘
```

**What the middleware does:**

1. Accepts JSON requests from your app
2. Validates the input (field presence, business rules)
3. Converts JSON to namespaced XML (per AADE XSD schemas v1.1)
4. Sends the XML to AADE via HTTPS
5. Parses the XML response back to JSON
6. Returns clean JSON to your app

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **AADE credentials** — `aade-user-id` and `ocp-apim-subscription-key` (same as myDATA)

---

## Installation

```bash
git clone <your-repo-url>
cd digital-clientele
npm install
```

---

## Configuration

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```dotenv
# Server port
PORT=3000

# AADE API Base URL
# Development/Testing:
AADE_BASE_URL=https://mydataapidev.aade.gr/DCL
# Production:
# AADE_BASE_URL=https://mydatapi.aade.gr/DCL

# Your AADE credentials (same as myDATA)
AADE_USER_ID=your_aade_user_id
AADE_SUBSCRIPTION_KEY=your_subscription_key
```

| Variable | Description |
|---|---|
| `PORT` | Local server port (default: `3000`) |
| `AADE_BASE_URL` | AADE endpoint. Use `mydataapidev` for testing, `mydatapi` for production |
| `AADE_USER_ID` | Your AADE user ID |
| `AADE_SUBSCRIPTION_KEY` | Your AADE subscription key |

---

## Running the Server

**Development** (auto-reload on changes):

```bash
npm run dev
```

**Production**:

```bash
npm run build
npm start
```

Verify the server is running:

```bash
curl http://localhost:3000/health
# → { "status": "ok" }
```

---

## API Reference

### Health & Info

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | API info and available endpoints |
| `GET` | `/health` | Health check |

---

### SendClient — Create Entry (Step 1)

**`POST /api/clients`**

Creates a new Digital Clientele entry for a vehicle rental.

**Request Body:**

```json
{
  "branch": 0,
  "rental": {
    "vehicleRegistrationNumber": "ΑΒΓ1234",
    "vehicleMovementPurpose": 1
  }
}
```

**All Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `branch` | `number` | ✅ | Installation number (0 = HQ) |
| `rental` | `object` | ✅ | Rental use case details (see below) |
| `recurringService` | `boolean` | | Recurring B2B service |
| `continuousService` | `boolean` | | Right-of-use / continuous service |
| `continuousLeaseService` | `boolean` | | Ongoing lease with periodic invoicing |
| `fromAgreedPeriodDate` | `string` | When continuous/lease | Agreed period start (`YYYY-MM-DD`) |
| `toAgreedPeriodDate` | `string` | When continuous/lease | Agreed period end (`YYYY-MM-DD`) |
| `periodicity` | `number` | When lease | Periodicity in months (1–12) |
| `periodicityOther` | `string` | When lease | Free-text periodicity |
| `customerVatNumber` | `string` | When recurring | Customer VAT number |
| `customerCountry` | `string` | When recurring | Customer country (ISO 2-letter) |
| `transmissionFailure` | `1` | | Set to `1` for late submission |
| `creationDateTime` | `string` | When transmissionFailure=1 | UTC datetime (`yyyy-MM-ddTHH:mm:ssZ`) |
| `correlatedDclId` | `number` | | Related DCL ID |
| `comments` | `string` | | Notes (max 150 chars) |
| `entityVatNumber` | `string` | | Obligated entity VAT (third-party calls) |

**Rental Object (`rental`):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vehicleRegistrationNumber` | `string` | Choice¹ | Greek plate number (max 50 chars) |
| `foreignVehicleRegistrationNumber` | `string` | Choice¹ | Foreign plate number (max 50 chars) |
| `vehicleCategory` | `string` | When foreign | Vehicle category (max 100 chars) |
| `vehicleFactory` | `string` | When foreign | Vehicle manufacturer (max 100 chars) |
| `vehicleMovementPurpose` | `number` | ✅ | `1`=Rental, `2`=OwnUse, `3`=FreeService |
| `isDiffVehPickupLocation` | `boolean` | | Different pickup location flag |
| `vehiclePickupLocation` | `string` | | Pickup location text (max 250 chars) |

> ¹ Provide either `vehicleRegistrationNumber` (Greek) or `foreignVehicleRegistrationNumber` (foreign). When using foreign registration, `vehicleCategory` and `vehicleFactory` are required.

**Success Response** (`201`):

```json
{
  "response": [
    {
      "statusCode": "Success",
      "newClientDclID": 123456
    }
  ]
}
```

The `newClientDclID` is the unique identifier you'll use for all subsequent operations on this entry.

---

### UpdateClient — Update/Complete Entry (Steps 2 & 3)

**`PUT /api/clients/:dclId`**

Updates or completes an existing entry. Can be called multiple times on the same `dclId`.

**Request Body:**

```json
{
  "entryCompletion": true,
  "invoiceKind": 1,
  "isDiffVehReturnLocation": false
}
```

> The `:dclId` URL parameter is used as `initialDclId` automatically.

**All Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entryCompletion` | `boolean` | | Set `true` to mark entry as completed |
| `nonIssueInvoice` | `boolean` | | `true` = no invoice will be issued |
| `amount` | `number` | | Agreed amount (decimal, max 15 digits) |
| `isDiffVehReturnLocation` | `boolean` | | Different return location flag |
| `vehicleReturnLocation` | `string` | | Return location (max 250 chars) |
| `invoiceKind` | `number` | | `1`=ΑΛΠ/ΑΠΥ, `2`=ΤΙΜΟΛΟΓΙΟ, `3`=ΑΛΠ/ΑΠΥ-ΦΗΜ |
| `reasonNonIssueType` | `number` | When nonIssueInvoice | `1`=FreeService, `2`=OwnUse |
| `invoiceCounterparty` | `string` | B2B required | Counterparty VAT number |
| `invoiceCounterpartyCountry` | `string` | B2B required | Counterparty country (ISO 2-letter) |
| `comments` | `string` | | Notes (max 150 chars) |
| `entityVatNumber` | `string` | | Obligated entity VAT (third-party calls) |

**Business Rules (v1.1):**

- `isDiffVehReturnLocation` and `vehicleReturnLocation` are **only allowed for Rental**
- When `nonIssueInvoice = true`: `invoiceCounterparty` and `invoiceCounterpartyCountry` must **NOT** be sent
- B2B transactions require `invoiceCounterparty` and `invoiceCounterpartyCountry`

**Success Response** (`200`):

```json
{
  "response": [
    {
      "statusCode": "Success",
      "updatedClientDclID": 789012
    }
  ]
}
```

---

### CancelClient — Cancel Entry

**`DELETE /api/clients/:dclId`**

Cancels a client entry. No request body needed.

**Query Parameters:**

| Param | Required | Description |
|-------|----------|-------------|
| `entityVatNumber` | | Obligated entity VAT (third-party calls) |

```bash
curl -X DELETE http://localhost:3000/api/clients/123456
```

**Success Response** (`200`):

```json
{
  "response": [
    {
      "statusCode": "Success",
      "cancellationID": 234567
    }
  ]
}
```

---

### RequestClients — Query Entries

**`GET /api/clients`**

Fetch one or more client entries, updates, correlations, or cancellations.

**Query Parameters:**

| Param | Required | Description |
|-------|----------|-------------|
| `dclId` | ✅ | Starting DCL ID (returns entries with ID ≥ this value) |
| `maxDclId` | | Maximum DCL ID filter |
| `entityVatNumber` | | Search for a specific entity |
| `continuationToken` | | Pagination token from previous response |

```bash
curl "http://localhost:3000/api/clients?dclId=1"
```

**Response:**

```json
{
  "entityVatNumber": "123456789",
  "clientsDoc": [ ... ],
  "updateclientRequestsDoc": [ ... ],
  "clientcorrelationsRequestsDoc": [ ... ],
  "cancelClientRequestsDoc": [ ... ],
  "continuationToken": "abc123"
}
```

If `continuationToken` is present, use it in the next request to fetch more results.

---

### ClientCorrelations — Correlate with Invoice (Step 4)

**`POST /api/clients/correlations`**

Links completed DCL entries with an invoice (MARK or FIM fiscal receipt).

**With MARK:**

```json
{
  "mark": 400001234567890,
  "correlatedDCLIds": [123456]
}
```

**With FIM (fiscal receipt):**

```json
{
  "fim": {
    "FIMNumber": "ABC123456",
    "FIMAA": 42,
    "FIMIssueDate": "2026-02-22",
    "FIMIssueTime": "14:30:00"
  },
  "correlatedDCLIds": [123456]
}
```

**All Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mark` | `number` | Choice | MARK number (either mark OR fim) |
| `fim` | `object` | Choice | FIM details (either mark OR fim) |
| `fim.FIMNumber` | `string` | When FIM | ΦΗΜ registration number |
| `fim.FIMAA` | `number` | When FIM | Sequential receipt number |
| `fim.FIMIssueDate` | `string` | When FIM | Issue date (`YYYY-MM-DD`) |
| `fim.FIMIssueTime` | `string` | When FIM | Issue time (`HH:mm:ss`) |
| `correlatedDCLIds` | `number[]` | ✅ | DCL IDs to correlate (max 50) |
| `entityVatNumber` | `string` | | Obligated entity VAT (third-party calls) |

**Success Response** (`201`):

```json
{
  "response": [
    {
      "statusCode": "Success",
      "correlateId": 345678
    }
  ]
}
```

---

## Rental Workflow — The 4 Steps

Every car rental transaction follows a **4-step lifecycle**. Here's the complete flow with real examples:

```
Step 1              Step 2              Step 3              Step 4
SendClient    →    UpdateClient    →    UpdateClient    →    ClientCorrelations
(Create entry)     (Add amount)        (Complete entry)     (Link invoice)
```

### Step 1 — SendClient

**When:** At the start of a rental — when the customer arrives and picks up the vehicle.

```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "branch": 0,
    "rental": {
      "vehicleRegistrationNumber": "ΑΒΓ1234",
      "vehicleMovementPurpose": 1
    }
  }'
```

**Response:**

```json
{
  "response": [{
    "statusCode": "Success",
    "newClientDclID": 100001
  }]
}
```

> **Save `newClientDclID` (100001)** — you need it for all subsequent steps.

---

### Step 2 — UpdateClient (Add Amount)

**When:** When the agreed rental price is known.

```bash
curl -X PUT http://localhost:3000/api/clients/100001 \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150.00
  }'
```

**Response:**

```json
{
  "response": [{
    "statusCode": "Success",
    "updatedClientDclID": 200001
  }]
}
```

---

### Step 3 — UpdateClient (Complete Entry)

**When:** When the vehicle is returned and the invoice is ready.

**Option A — B2C (retail customer, ΑΛΠ/ΑΠΥ receipt):**

```bash
curl -X PUT http://localhost:3000/api/clients/100001 \
  -H "Content-Type: application/json" \
  -d '{
    "entryCompletion": true,
    "invoiceKind": 1,
    "isDiffVehReturnLocation": false
  }'
```

**Option B — B2B (business customer, invoice/τιμολόγιο):**

```bash
curl -X PUT http://localhost:3000/api/clients/100001 \
  -H "Content-Type: application/json" \
  -d '{
    "entryCompletion": true,
    "invoiceKind": 2,
    "invoiceCounterparty": "987654321",
    "invoiceCounterpartyCountry": "GR",
    "isDiffVehReturnLocation": false
  }'
```

**Option C — No invoice (free service or own use):**

```bash
curl -X PUT http://localhost:3000/api/clients/100001 \
  -H "Content-Type: application/json" \
  -d '{
    "entryCompletion": true,
    "nonIssueInvoice": true,
    "reasonNonIssueType": 1,
    "isDiffVehReturnLocation": false
  }'
```

**Option D — With different return location:**

```bash
curl -X PUT http://localhost:3000/api/clients/100001 \
  -H "Content-Type: application/json" \
  -d '{
    "entryCompletion": true,
    "invoiceKind": 1,
    "isDiffVehReturnLocation": true,
    "vehicleReturnLocation": "Thessaloniki Airport"
  }'
```

---

### Step 4 — ClientCorrelations

**When:** After the invoice is issued — link it to the DCL entry.

**With MARK (myDATA invoice number):**

```bash
curl -X POST http://localhost:3000/api/clients/correlations \
  -H "Content-Type: application/json" \
  -d '{
    "mark": 400001234567890,
    "correlatedDCLIds": [100001]
  }'
```

**With FIM (fiscal receipt from ΦΗΜ device):**

```bash
curl -X POST http://localhost:3000/api/clients/correlations \
  -H "Content-Type: application/json" \
  -d '{
    "fim": {
      "FIMNumber": "ABC123456",
      "FIMAA": 42,
      "FIMIssueDate": "2026-02-22",
      "FIMIssueTime": "14:30:00"
    },
    "correlatedDCLIds": [100001]
  }'
```

> You can correlate up to **50** DCL entries with a single invoice.

---

## Service Types (Advanced)

Beyond a standard one-time rental, AADE supports three special service types. **Only one** can be set per entry.

### Recurring Service (Επαναλαμβανόμενη Υπηρεσία)

For B2B contracts with periodic invoicing (e.g., monthly fleet rental).

```json
{
  "branch": 0,
  "recurringService": true,
  "customerVatNumber": "123456789",
  "customerCountry": "GR",
  "rental": {
    "vehicleRegistrationNumber": "ΑΒΓ1234",
    "vehicleMovementPurpose": 1
  }
}
```

**Rules:**
- Requires `customerVatNumber` and `customerCountry`
- `vehicleMovementPurpose` cannot be `2` (OwnUse) or `3` (FreeService)

---

### Continuous Service (Διαρκής/Λήψη Δικαιώματος)

Right-of-use service where the invoice is issued before the service starts.

```json
{
  "branch": 0,
  "continuousService": true,
  "fromAgreedPeriodDate": "2026-03-01",
  "toAgreedPeriodDate": "2026-06-30",
  "rental": {
    "vehicleRegistrationNumber": "ΑΒΓ1234",
    "vehicleMovementPurpose": 1
  }
}
```

**Rules:**
- Requires `fromAgreedPeriodDate` and `toAgreedPeriodDate`

---

### Continuous Lease Service (Διαρκής Μίσθωση/Υπηρεσία)

Long-term lease with periodic partial invoicing.

```json
{
  "branch": 0,
  "continuousLeaseService": true,
  "fromAgreedPeriodDate": "2026-01-01",
  "toAgreedPeriodDate": "2026-12-31",
  "periodicity": 3,
  "rental": {
    "vehicleRegistrationNumber": "ΑΒΓ1234",
    "vehicleMovementPurpose": 1
  }
}
```

**Rules:**
- Requires `fromAgreedPeriodDate` and `toAgreedPeriodDate`
- Requires either `periodicity` (1–12 months) or `periodicityOther` (free text like "Κάθε 45 ημέρες")

---

## Enums & Accepted Values

### `vehicleMovementPurpose` (Σκοπός Κίνησης Οχήματος)

| Value | Name | Description |
|-------|------|-------------|
| `1` | Rental | Ενοικίαση |
| `2` | OwnUse | Ιδιόχρηση |
| `3` | FreeService | Δωρεάν Υπηρεσία |

### `invoiceKind` (Είδος Παραστατικού)

| Value | Name | Use Case |
|-------|------|----------|
| `1` | ΑΛΠ/ΑΠΥ | Retail receipt (B2C) |
| `2` | ΤΙΜΟΛΟΓΙΟ | Invoice (B2B) |
| `3` | ΑΛΠ/ΑΠΥ-ΦΗΜ | Fiscal receipt from ΦΗΜ device |

### `reasonNonIssueType` (Αιτιολογία Μη Έκδοσης)

| Value | Name | Description |
|-------|------|-------------|
| `1` | FreeService | Δωρεάν Υπηρεσία |
| `2` | OwnUse | Ιδιόχρηση |

### `customerCountry` / `invoiceCounterpartyCountry`

ISO 3166-1 alpha-2 country codes: `GR`, `DE`, `FR`, `IT`, `US`, etc.

### `transmissionFailure`

| Value | Description |
|-------|-------------|
| `1` | Connection loss — late submission (requires `creationDateTime` in UTC) |

---

## Error Handling

### Validation Errors (from middleware)

**HTTP 400** — Your request failed local validation before reaching AADE.

```json
{
  "error": "Validation failed",
  "details": [
    "branch is required",
    "rental.vehicleMovementPurpose is required (1=Rental, 2=OwnUse, 3=FreeService)"
  ]
}
```

### AADE Business Errors

**HTTP 200** from AADE but `statusCode` indicates failure:

```json
{
  "response": [{
    "statusCode": "ValidationError",
    "errors": [
      { "message": "{Field} is mandatory", "code": "203" }
    ]
  }]
}
```

**Common AADE error codes:**

| Code | Description |
|------|-------------|
| `101` | XML Syntax Validation Error |
| `201` | User not authorized |
| `202` | Invalid Greek VAT number |
| `203` | `{Field}` is mandatory |
| `204` | `{Element}` cannot be sent with `{Element}` |
| `205` | `{Field}` is allowed only... |
| `206` | Client with idDcl not found |
| `207` | Client already cancelled |
| `209` | Client already completed |
| `210` | Correlations already sent |
| `211` | Max 50 correlatedDCLids |
| `214` | Value not allowed for this clientServiceType |
| `216` | Rental recurringService cannot have vehicleMovementPurpose=2 |

### HTTP Errors from AADE

| HTTP Code | Description |
|-----------|-------------|
| `401` | Invalid credentials (check `AADE_USER_ID` / `AADE_SUBSCRIPTION_KEY`) |
| `400` | Bad request (malformed parameters) |

---

## Postman Collection

A comprehensive Postman collection with **31 requests** is included:

```
File → Import → select postman_collection.json
```

**Folders:**

| Folder | Requests | Description |
|--------|----------|-------------|
| Health & Info | 2 | Root info + health check |
| SendClient (Step 1) | 11 | All rental creation scenarios |
| UpdateClient (Steps 2 & 3) | 8 | Amount, completion, B2B/B2C, no-invoice |
| CancelClient | 2 | Standard + third-party |
| RequestClients | 4 | By ID, range, pagination |
| ClientCorrelations (Step 4) | 4 | MARK, FIM, multi-entry |
| Validation Error Examples | 6 | Tests for validation rules |

**Setup:**
1. Import `postman_collection.json`
2. Set the `baseUrl` variable to your server (default: `http://localhost:3000`)
3. Run "1a. Basic Rental" first — it auto-saves the `dclId` variable
4. Continue with Steps 2–4 using the saved `dclId`

---

## Project Structure

```
digital-clientele/
├── src/
│   ├── index.ts                    # Express app entry point
│   ├── config/
│   │   └── index.ts                # Environment configuration
│   ├── types/
│   │   └── dcl.ts                  # TypeScript interfaces & enums
│   ├── utils/
│   │   └── xml.ts                  # XML builders & parsers (namespaced)
│   ├── services/
│   │   └── aadeClient.ts           # AADE API HTTP client
│   ├── middleware/
│   │   ├── validation.ts           # Request validation
│   │   └── errorHandler.ts         # Global error handler
│   └── routes/
│       ├── health.ts               # Health check route
│       └── clients.ts              # All client routes
├── DCL_v1_1_0/                     # Official AADE XSD schemas (v1.1)
│   ├── SendClient-v1.1.xsd
│   ├── newDigitalClient-v1.1.xsd
│   ├── updateClient-v1.1.xsd
│   ├── updateClientType-v1.1.xsd
│   ├── clientCorrelations-v1.1.xsd
│   ├── clientCorrelationType-v1.1.xsd
│   ├── rental-v1.1.xsd
│   ├── SimpleTypes-v1.1.xsd
│   ├── response-v1.1.xsd
│   └── ...
├── postman_collection.json          # Postman collection (31 requests)
├── .env.example                     # Environment template
├── package.json
└── tsconfig.json
```

---

## AADE Registration

To use the AADE DCL API, you need credentials from the myDATA portal.

**Development/Testing:**
1. Register at https://mydata-dev-register.azurewebsites.net
2. Get your `aade-user-id` and `ocp-apim-subscription-key`
3. Use the dev URL: `https://mydataapidev.aade.gr/DCL`

**Production:**
1. Use your production myDATA credentials
2. Switch base URL to: `https://mydatapi.aade.gr/DCL`

---

## License

ISC
