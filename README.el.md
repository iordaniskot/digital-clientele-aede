# Digital Clientele — AADE DCL Middleware για Ενοικίαση Οχημάτων

Ένα Node.js + Express + TypeScript REST API που λειτουργεί ως middleware μεταξύ της εφαρμογής σας και του API **Ψηφιακό Πελατολόγιο** της ΑΑΔΕ (Ανεξάρτητη Αρχή Δημοσίων Εσόδων).

Αυτό το middleware εστιάζει **αποκλειστικά στον κλάδο Ενοικίασης Οχημάτων** (`clientServiceType = 1`). Δέχεται απλά JSON αιτήματα, τα μετατρέπει στη μορφή XML με namespaces που απαιτεί η ΑΑΔΕ, και επιστρέφει τις απαντήσεις σε JSON.

> Βασισμένο στην **Τεχνική Τεκμηρίωση DCL API v1.1** — Ιούνιος 2025

---

## Πίνακας Περιεχομένων

- [Αρχιτεκτονική](#αρχιτεκτονική)
- [Προαπαιτούμενα](#προαπαιτούμενα)
- [Εγκατάσταση](#εγκατάσταση)
- [Ρυθμίσεις](#ρυθμίσεις)
- [Εκκίνηση Εξυπηρετητή](#εκκίνηση-εξυπηρετητή)
- [Αναφορά API](#αναφορά-api)
  - [Υγεία & Πληροφορίες](#υγεία--πληροφορίες)
  - [SendClient — Δημιουργία Εγγραφής](#sendclient--δημιουργία-εγγραφής-βήμα-1)
  - [UpdateClient — Ενημέρωση/Ολοκλήρωση Εγγραφής](#updateclient--ενημέρωσηολοκλήρωση-εγγραφής-βήματα-2--3)
  - [CancelClient — Ακύρωση Εγγραφής](#cancelclient--ακύρωση-εγγραφής)
  - [RequestClients — Αναζήτηση Εγγραφών](#requestclients--αναζήτηση-εγγραφών)
  - [ClientCorrelations — Συσχέτιση με Παραστατικό](#clientcorrelations--συσχέτιση-με-παραστατικό-βήμα-4)
- [Ροή Ενοικίασης — Τα 4 Βήματα](#ροή-ενοικίασης--τα-4-βήματα)
  - [Βήμα 1 — SendClient](#βήμα-1--sendclient)
  - [Βήμα 2 — UpdateClient (Προσθήκη Ποσού)](#βήμα-2--updateclient-προσθήκη-ποσού)
  - [Βήμα 3 — UpdateClient (Ολοκλήρωση Εγγραφής)](#βήμα-3--updateclient-ολοκλήρωση-εγγραφής)
  - [Βήμα 4 — ClientCorrelations](#βήμα-4--clientcorrelations)
- [Τύποι Υπηρεσιών (Προχωρημένα)](#τύποι-υπηρεσιών-προχωρημένα)
  - [Επαναλαμβανόμενη Υπηρεσία](#επαναλαμβανόμενη-υπηρεσία)
  - [Διαρκής/Λήψη Δικαιώματος](#διαρκήςλήψη-δικαιώματος)
  - [Διαρκής Μίσθωση/Υπηρεσία](#διαρκής-μίσθωσηυπηρεσία)
- [Αποδεκτές Τιμές & Enums](#αποδεκτές-τιμές--enums)
- [Διαχείριση Σφαλμάτων](#διαχείριση-σφαλμάτων)
- [Postman Collection](#postman-collection)
- [Δομή Έργου](#δομή-έργου)
- [Εγγραφή στην ΑΑΔΕ](#εγγραφή-στην-ααδε)

---

## Αρχιτεκτονική

```
┌──────────────┐       JSON        ┌────────────────────┐       XML        ┌──────────────┐
│  Εφαρμογή /  │  ──────────────►  │  Digital Clientele │  ──────────────►  │   AADE DCL   │
│   Postman    │  ◄──────────────  │    Middleware       │  ◄──────────────  │   REST API   │
└──────────────┘       JSON        └────────────────────┘       XML        └──────────────┘
```

**Τι κάνει το middleware:**

1. Δέχεται αιτήματα JSON από την εφαρμογή σας
2. Επικυρώνει τα δεδομένα (παρουσία πεδίων, επιχειρησιακοί κανόνες)
3. Μετατρέπει τα JSON σε XML με namespaces (σύμφωνα με τα XSD σχήματα v1.1 της ΑΑΔΕ)
4. Αποστέλλει το XML στην ΑΑΔΕ μέσω HTTPS
5. Αναλύει την XML απάντηση σε JSON
6. Επιστρέφει καθαρό JSON στην εφαρμογή σας

---

## Προαπαιτούμενα

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Διαπιστευτήρια ΑΑΔΕ** — `aade-user-id` και `ocp-apim-subscription-key` (ίδια με τα myDATA)

---

## Εγκατάσταση

```bash
git clone <your-repo-url>
cd digital-clientele
npm install
```

---

## Ρυθμίσεις

Αντιγράψτε το αρχείο ρυθμίσεων και συμπληρώστε τα διαπιστευτήριά σας:

```bash
cp .env.example .env
```

Επεξεργαστείτε το `.env`:

```dotenv
# Θύρα εξυπηρετητή
PORT=3000

# URL ΑΑΔΕ API
# Ανάπτυξη/Δοκιμές:
AADE_BASE_URL=https://mydataapidev.aade.gr/DCL
# Παραγωγή:
# AADE_BASE_URL=https://mydatapi.aade.gr/DCL

# Διαπιστευτήρια ΑΑΔΕ (ίδια με τα myDATA)
AADE_USER_ID=your_aade_user_id
AADE_SUBSCRIPTION_KEY=your_subscription_key
```

| Μεταβλητή | Περιγραφή |
|---|---|
| `PORT` | Θύρα τοπικού εξυπηρετητή (προεπιλογή: `3000`) |
| `AADE_BASE_URL` | Endpoint ΑΑΔΕ. Χρησιμοποιήστε `mydataapidev` για δοκιμές, `mydatapi` για παραγωγή |
| `AADE_USER_ID` | Το user ID σας στην ΑΑΔΕ |
| `AADE_SUBSCRIPTION_KEY` | Το subscription key σας στην ΑΑΔΕ |

---

## Εκκίνηση Εξυπηρετητή

**Ανάπτυξη** (αυτόματη επαναφόρτωση):

```bash
npm run dev
```

**Παραγωγή**:

```bash
npm run build
npm start
```

Επαληθεύστε ότι ο εξυπηρετητής τρέχει:

```bash
curl http://localhost:3000/health
# → { "status": "ok" }
```

---

## Αναφορά API

### Υγεία & Πληροφορίες

| Μέθοδος | Διαδρομή | Περιγραφή |
|---------|----------|-----------|
| `GET` | `/` | Πληροφορίες API και διαθέσιμα endpoints |
| `GET` | `/health` | Έλεγχος υγείας |

---

### SendClient — Δημιουργία Εγγραφής (Βήμα 1)

**`POST /api/clients`**

Δημιουργεί νέα εγγραφή Ψηφιακού Πελατολογίου για ενοικίαση οχήματος.

**Σώμα Αιτήματος:**

```json
{
  "branch": 0,
  "rental": {
    "vehicleRegistrationNumber": "ΑΒΓ1234",
    "vehicleMovementPurpose": 1
  }
}
```

**Όλα τα Πεδία:**

| Πεδίο | Τύπος | Υποχρεωτικό | Περιγραφή |
|-------|-------|-------------|-----------|
| `branch` | `number` | ✅ | Αρ. Εγκατάστασης (0 = Έδρα) |
| `rental` | `object` | ✅ | Στοιχεία ενοικίασης (βλ. παρακάτω) |
| `recurringService` | `boolean` | | Επαναλαμβανόμενη Υπηρεσία B2B |
| `continuousService` | `boolean` | | Διαρκής/Λήψη Δικαιώματος |
| `continuousLeaseService` | `boolean` | | Διαρκής Μίσθωση/Υπηρεσία |
| `fromAgreedPeriodDate` | `string` | Όταν Διαρκής/Μίσθωση | Από Συμφωνημένη Περίοδο (`YYYY-MM-DD`) |
| `toAgreedPeriodDate` | `string` | Όταν Διαρκής/Μίσθωση | Έως Συμφωνημένη Περίοδο (`YYYY-MM-DD`) |
| `periodicity` | `number` | Όταν Μίσθωση | Περιοδικότητα σε μήνες (1–12) |
| `periodicityOther` | `string` | Όταν Μίσθωση | Ελεύθερο κείμενο περιοδικότητας |
| `customerVatNumber` | `string` | Όταν Επαναλαμβανόμενη | ΑΦΜ Πελάτη |
| `customerCountry` | `string` | Όταν Επαναλαμβανόμενη | Χώρα Πελάτη (ISO 2 ψηφία) |
| `transmissionFailure` | `1` | | Απώλεια διασύνδεσης |
| `creationDateTime` | `string` | Όταν transmissionFailure=1 | Ημερομηνία UTC (`yyyy-MM-ddTHH:mm:ssZ`) |
| `correlatedDclId` | `number` | | Συσχετιζόμενο DC ID |
| `comments` | `string` | | Σχόλια/Παρατηρήσεις (max 150 χαρ.) |
| `entityVatNumber` | `string` | | ΑΦΜ Οντότητας (κλήσεις από τρίτους) |

**Αντικείμενο Ενοικίασης (`rental`):**

| Πεδίο | Τύπος | Υποχρεωτικό | Περιγραφή |
|-------|-------|-------------|-----------|
| `vehicleRegistrationNumber` | `string` | Επιλογή¹ | Αρ. Κυκλοφορίας Ελλάδας (max 50 χαρ.) |
| `foreignVehicleRegistrationNumber` | `string` | Επιλογή¹ | Αρ. Κυκλοφορίας Αλλοδαπής (max 50 χαρ.) |
| `vehicleCategory` | `string` | Όταν αλλοδαπή | Κατηγορία Οχήματος (max 100 χαρ.) |
| `vehicleFactory` | `string` | Όταν αλλοδαπή | Εργοστάσιο Οχήματος (max 100 χαρ.) |
| `vehicleMovementPurpose` | `number` | ✅ | `1`=Ενοικίαση, `2`=Ιδιόχρηση, `3`=Δωρεάν |
| `isDiffVehPickupLocation` | `boolean` | | Διαφορετικός Τόπος Παραλαβής |
| `vehiclePickupLocation` | `string` | | Τόπος Παραλαβής (max 250 χαρ.) |

> ¹ Δηλώστε είτε `vehicleRegistrationNumber` (Ελλάδα) είτε `foreignVehicleRegistrationNumber` (αλλοδαπή). Στην περίπτωση αλλοδαπής, τα `vehicleCategory` και `vehicleFactory` είναι υποχρεωτικά.

**Επιτυχής Απάντηση** (`201`):

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

Το `newClientDclID` είναι ο μοναδικός αριθμός που θα χρησιμοποιήσετε σε όλες τις επόμενες λειτουργίες.

---

### UpdateClient — Ενημέρωση/Ολοκλήρωση Εγγραφής (Βήματα 2 & 3)

**`PUT /api/clients/:dclId`**

Ενημερώνει ή ολοκληρώνει μια υπάρχουσα εγγραφή. Μπορεί να κληθεί πολλές φορές για το ίδιο `dclId`.

**Σώμα Αιτήματος:**

```json
{
  "entryCompletion": true,
  "invoiceKind": 1,
  "isDiffVehReturnLocation": false
}
```

> Η παράμετρος `:dclId` στο URL χρησιμοποιείται αυτόματα ως `initialDclId`.

**Όλα τα Πεδία:**

| Πεδίο | Τύπος | Υποχρεωτικό | Περιγραφή |
|-------|-------|-------------|-----------|
| `entryCompletion` | `boolean` | | Ολοκλήρωση εγγραφής (`true` = τελική) |
| `nonIssueInvoice` | `boolean` | | `true` = δεν εκδίδεται παραστατικό |
| `amount` | `number` | | Συμφωνηθέν Ποσό (δεκαδικό, max 15 ψηφία) |
| `isDiffVehReturnLocation` | `boolean` | | Διαφορετικός Τόπος Επιστροφής |
| `vehicleReturnLocation` | `string` | | Τόπος Επιστροφής (max 250 χαρ.) |
| `invoiceKind` | `number` | | `1`=ΑΛΠ/ΑΠΥ, `2`=ΤΙΜΟΛΟΓΙΟ, `3`=ΑΛΠ/ΑΠΥ-ΦΗΜ |
| `reasonNonIssueType` | `number` | Όταν nonIssueInvoice | `1`=Δωρεάν, `2`=Ιδιόχρηση |
| `invoiceCounterparty` | `string` | B2B υποχρ. | ΑΦΜ Αντισυμβαλλόμενου |
| `invoiceCounterpartyCountry` | `string` | B2B υποχρ. | Χώρα Αντισυμβαλλόμενου (ISO 2 ψηφία) |
| `comments` | `string` | | Σχόλια/Παρατηρήσεις (max 150 χαρ.) |
| `entityVatNumber` | `string` | | ΑΦΜ Οντότητας (κλήσεις από τρίτους) |

**Επιχειρησιακοί Κανόνες (v1.1):**

- `isDiffVehReturnLocation` και `vehicleReturnLocation` επιτρέπονται **μόνο στην Ενοικίαση**
- Όταν `nonIssueInvoice = true`: τα `invoiceCounterparty` και `invoiceCounterpartyCountry` **ΔΕΝ** πρέπει να αποστέλλονται
- Χονδρικές συναλλαγές (B2B) απαιτούν `invoiceCounterparty` και `invoiceCounterpartyCountry`

**Επιτυχής Απάντηση** (`200`):

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

### CancelClient — Ακύρωση Εγγραφής

**`DELETE /api/clients/:dclId`**

Ακυρώνει μια εγγραφή πελάτη. Δεν απαιτείται σώμα αιτήματος.

**Παράμετροι Query:**

| Παράμετρος | Υποχρεωτικό | Περιγραφή |
|------------|-------------|-----------|
| `entityVatNumber` | | ΑΦΜ Οντότητας (κλήσεις από τρίτους) |

```bash
curl -X DELETE http://localhost:3000/api/clients/123456
```

**Επιτυχής Απάντηση** (`200`):

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

### RequestClients — Αναζήτηση Εγγραφών

**`GET /api/clients`**

Λήψη μίας ή περισσότερων εγγραφών πελατών, ενημερώσεων, συσχετίσεων ή ακυρώσεων.

**Παράμετροι Query:**

| Παράμετρος | Υποχρεωτικό | Περιγραφή |
|------------|-------------|-----------|
| `dclId` | ✅ | Αρχικό DCL ID (επιστρέφει εγγραφές με ID ≥ αυτής της τιμής) |
| `maxDclId` | | Μέγιστο DCL ID |
| `entityVatNumber` | | Αναζήτηση για συγκεκριμένο ΑΦΜ |
| `continuationToken` | | Token σελιδοποίησης από προηγούμενη απάντηση |

```bash
curl "http://localhost:3000/api/clients?dclId=1"
```

**Απάντηση:**

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

Αν υπάρχει `continuationToken`, χρησιμοποιήστε το στο επόμενο αίτημα για λήψη περισσότερων αποτελεσμάτων.

---

### ClientCorrelations — Συσχέτιση με Παραστατικό (Βήμα 4)

**`POST /api/clients/correlations`**

Συνδέει ολοκληρωμένες εγγραφές DCL με παραστατικό (MARK ή ΦΗΜ).

**Με MARK:**

```json
{
  "mark": 400001234567890,
  "correlatedDCLIds": [123456]
}
```

**Με ΦΗΜ (απόδειξη ΦΗΜ):**

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

**Όλα τα Πεδία:**

| Πεδίο | Τύπος | Υποχρεωτικό | Περιγραφή |
|-------|-------|-------------|-----------|
| `mark` | `number` | Επιλογή | MARK Παραστατικού (είτε mark ΕΊΤΕ fim) |
| `fim` | `object` | Επιλογή | Στοιχεία ΦΗΜ (είτε mark ΕΊΤΕ fim) |
| `fim.FIMNumber` | `string` | Όταν ΦΗΜ | Αριθμός Μητρώου ΦΗΜ |
| `fim.FIMAA` | `number` | Όταν ΦΗΜ | Αύξων Αριθμός Παραστατικού |
| `fim.FIMIssueDate` | `string` | Όταν ΦΗΜ | Ημερομηνία Έκδοσης (`YYYY-MM-DD`) |
| `fim.FIMIssueTime` | `string` | Όταν ΦΗΜ | Ώρα Έκδοσης (`HH:mm:ss`) |
| `correlatedDCLIds` | `number[]` | ✅ | Συσχετιζόμενα DCL IDs (max 50) |
| `entityVatNumber` | `string` | | ΑΦΜ Οντότητας (κλήσεις από τρίτους) |

**Επιτυχής Απάντηση** (`201`):

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

## Ροή Ενοικίασης — Τα 4 Βήματα

Κάθε συναλλαγή ενοικίασης οχήματος ακολουθεί έναν **κύκλο ζωής 4 βημάτων**. Ακολουθεί η πλήρης ροή με πραγματικά παραδείγματα:

```
Βήμα 1              Βήμα 2              Βήμα 3              Βήμα 4
SendClient    →    UpdateClient    →    UpdateClient    →    ClientCorrelations
(Δημιουργία)       (Ποσό)              (Ολοκλήρωση)         (Συσχέτιση)
```

### Βήμα 1 — SendClient

**Πότε:** Στην αρχή της ενοικίασης — όταν ο πελάτης έρχεται και παραλαμβάνει το όχημα.

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

**Απάντηση:**

```json
{
  "response": [{
    "statusCode": "Success",
    "newClientDclID": 100001
  }]
}
```

> **Αποθηκεύστε το `newClientDclID` (100001)** — το χρειάζεστε σε όλα τα επόμενα βήματα.

---

### Βήμα 2 — UpdateClient (Προσθήκη Ποσού)

**Πότε:** Όταν είναι γνωστή η συμφωνηθείσα τιμή ενοικίασης.

```bash
curl -X PUT http://localhost:3000/api/clients/100001 \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150.00
  }'
```

**Απάντηση:**

```json
{
  "response": [{
    "statusCode": "Success",
    "updatedClientDclID": 200001
  }]
}
```

---

### Βήμα 3 — UpdateClient (Ολοκλήρωση Εγγραφής)

**Πότε:** Όταν επιστρέφεται το όχημα και είναι έτοιμο το παραστατικό.

**Επιλογή Α — B2C (λιανικός πελάτης, ΑΛΠ/ΑΠΥ):**

```bash
curl -X PUT http://localhost:3000/api/clients/100001 \
  -H "Content-Type: application/json" \
  -d '{
    "entryCompletion": true,
    "invoiceKind": 1,
    "isDiffVehReturnLocation": false
  }'
```

**Επιλογή Β — B2B (επιχείρηση, τιμολόγιο):**

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

**Επιλογή Γ — Χωρίς παραστατικό (δωρεάν υπηρεσία ή ιδιόχρηση):**

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

**Επιλογή Δ — Με διαφορετικό τόπο επιστροφής:**

```bash
curl -X PUT http://localhost:3000/api/clients/100001 \
  -H "Content-Type: application/json" \
  -d '{
    "entryCompletion": true,
    "invoiceKind": 1,
    "isDiffVehReturnLocation": true,
    "vehicleReturnLocation": "Αεροδρόμιο Θεσσαλονίκης"
  }'
```

---

### Βήμα 4 — ClientCorrelations

**Πότε:** Μετά την έκδοση του παραστατικού — σύνδεση με την εγγραφή DCL.

**Με MARK (αριθμός myDATA):**

```bash
curl -X POST http://localhost:3000/api/clients/correlations \
  -H "Content-Type: application/json" \
  -d '{
    "mark": 400001234567890,
    "correlatedDCLIds": [100001]
  }'
```

**Με ΦΗΜ (απόδειξη ΦΗΜ):**

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

> Μπορείτε να συσχετίσετε έως **50** εγγραφές DCL με ένα παραστατικό.

---

## Τύποι Υπηρεσιών (Προχωρημένα)

Πέρα από τη βασική εφάπαξ ενοικίαση, η ΑΑΔΕ υποστηρίζει τρεις ειδικούς τύπους υπηρεσιών. **Μόνο ένας** μπορεί να οριστεί ανά εγγραφή.

### Επαναλαμβανόμενη Υπηρεσία

Για συμβόλαια B2B με περιοδική τιμολόγηση (π.χ. μηνιαία ενοικίαση στόλου).

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

**Κανόνες:**
- Απαιτεί `customerVatNumber` και `customerCountry`
- Ο σκοπός κίνησης δεν μπορεί να είναι `2` (Ιδιόχρηση) ή `3` (Δωρεάν Υπηρεσία)

---

### Διαρκής/Λήψη Δικαιώματος

Υπηρεσία λήψης δικαιώματος χρήσης — το παραστατικό εκδίδεται πριν την έναρξη.

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

**Κανόνες:**
- Απαιτεί `fromAgreedPeriodDate` και `toAgreedPeriodDate`

---

### Διαρκής Μίσθωση/Υπηρεσία

Μακροχρόνια μίσθωση με περιοδική τμηματική τιμολόγηση.

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

**Κανόνες:**
- Απαιτεί `fromAgreedPeriodDate` και `toAgreedPeriodDate`
- Απαιτεί είτε `periodicity` (1–12 μήνες) είτε `periodicityOther` (ελεύθερο κείμενο π.χ. "Κάθε 45 ημέρες")

---

## Αποδεκτές Τιμές & Enums

### `vehicleMovementPurpose` (Σκοπός Κίνησης Οχήματος)

| Τιμή | Όνομα | Περιγραφή |
|------|-------|-----------|
| `1` | Ενοικίαση | Rental |
| `2` | Ιδιόχρηση | OwnUse |
| `3` | Δωρεάν Υπηρεσία | FreeService |

### `invoiceKind` (Είδος Παραστατικού)

| Τιμή | Όνομα | Χρήση |
|------|-------|-------|
| `1` | ΑΛΠ/ΑΠΥ | Λιανική απόδειξη (B2C) |
| `2` | ΤΙΜΟΛΟΓΙΟ | Τιμολόγιο (B2B) |
| `3` | ΑΛΠ/ΑΠΥ-ΦΗΜ | Απόδειξη από ΦΗΜ |

### `reasonNonIssueType` (Αιτιολογία Μη Έκδοσης)

| Τιμή | Όνομα | Περιγραφή |
|------|-------|-----------|
| `1` | Δωρεάν Υπηρεσία | FreeService |
| `2` | Ιδιόχρηση | OwnUse |

### `customerCountry` / `invoiceCounterpartyCountry`

Κωδικοί χωρών ISO 3166-1 alpha-2: `GR`, `DE`, `FR`, `IT`, `US`, κ.λπ.

### `transmissionFailure`

| Τιμή | Περιγραφή |
|------|-----------|
| `1` | Απώλεια διασύνδεσης — εκπρόθεσμη υποβολή (απαιτεί `creationDateTime` σε UTC) |

---

## Διαχείριση Σφαλμάτων

### Σφάλματα Επικύρωσης (από το middleware)

**HTTP 400** — Το αίτημα απέτυχε στην τοπική επικύρωση πριν φτάσει στην ΑΑΔΕ.

```json
{
  "error": "Validation failed",
  "details": [
    "branch is required",
    "rental.vehicleMovementPurpose is required (1=Rental, 2=OwnUse, 3=FreeService)"
  ]
}
```

### Επιχειρησιακά Σφάλματα ΑΑΔΕ

**HTTP 200** από ΑΑΔΕ αλλά `statusCode` δείχνει αποτυχία:

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

**Συνήθεις κωδικοί σφαλμάτων ΑΑΔΕ:**

| Κωδικός | Περιγραφή |
|---------|-----------|
| `101` | Σφάλμα Σύνταξης XML |
| `201` | Μη εξουσιοδοτημένος χρήστης |
| `202` | Μη έγκυρος Ελληνικός ΑΦΜ |
| `203` | Το πεδίο `{Field}` είναι υποχρεωτικό |
| `204` | Το `{Element}` δεν μπορεί να σταλεί μαζί με `{Element}` |
| `205` | Το `{Field}` επιτρέπεται μόνο... |
| `206` | Δεν βρέθηκε εγγραφή με idDcl |
| `207` | Η εγγραφή έχει ήδη ακυρωθεί |
| `209` | Η εγγραφή έχει ήδη ολοκληρωθεί |
| `210` | Οι συσχετίσεις έχουν ήδη σταλεί |
| `211` | Μέγιστο 50 correlatedDCLids |
| `214` | Η τιμή δεν επιτρέπεται για αυτόν τον τύπο πελατολογίου |
| `216` | Στην Ενοικίαση, η recurringService δεν μπορεί με vehicleMovementPurpose=2 |

### HTTP Σφάλματα από ΑΑΔΕ

| HTTP Κωδικός | Περιγραφή |
|-------------|-----------|
| `401` | Μη έγκυρα διαπιστευτήρια (ελέγξτε `AADE_USER_ID` / `AADE_SUBSCRIPTION_KEY`) |
| `400` | Εσφαλμένο αίτημα (ελαττωματικές παράμετροι) |

---

## Postman Collection

Περιλαμβάνεται ολοκληρωμένο Postman collection με **31 αιτήματα**:

```
File → Import → επιλέξτε postman_collection.json
```

**Φάκελοι:**

| Φάκελος | Αιτήματα | Περιγραφή |
|---------|----------|-----------|
| Health & Info | 2 | Πληροφορίες + έλεγχος υγείας |
| SendClient (Βήμα 1) | 11 | Όλα τα σενάρια δημιουργίας |
| UpdateClient (Βήματα 2 & 3) | 8 | Ποσό, ολοκλήρωση, B2B/B2C, χωρίς παραστατικό |
| CancelClient | 2 | Κανονική + από τρίτο |
| RequestClients | 4 | Αναζήτηση κατά ID, εύρος, σελιδοποίηση |
| ClientCorrelations (Βήμα 4) | 4 | MARK, ΦΗΜ, πολλαπλές εγγραφές |
| Validation Error Examples | 6 | Δοκιμές κανόνων επικύρωσης |

**Ρύθμιση:**
1. Κάντε import το `postman_collection.json`
2. Ορίστε τη μεταβλητή `baseUrl` (προεπιλογή: `http://localhost:3000`)
3. Εκτελέστε πρώτα το "1a. Basic Rental" — αποθηκεύει αυτόματα το `dclId`
4. Συνεχίστε με τα Βήματα 2–4 χρησιμοποιώντας το αποθηκευμένο `dclId`

---

## Δομή Έργου

```
digital-clientele/
├── src/
│   ├── index.ts                    # Σημείο εισόδου Express
│   ├── config/
│   │   └── index.ts                # Ρυθμίσεις περιβάλλοντος
│   ├── types/
│   │   └── dcl.ts                  # TypeScript interfaces & enums
│   ├── utils/
│   │   └── xml.ts                  # XML builders & parsers (namespaced)
│   ├── services/
│   │   └── aadeClient.ts           # HTTP client για ΑΑΔΕ API
│   ├── middleware/
│   │   ├── validation.ts           # Επικύρωση αιτημάτων
│   │   └── errorHandler.ts         # Καθολική διαχείριση σφαλμάτων
│   └── routes/
│       ├── health.ts               # Endpoint ελέγχου υγείας
│       └── clients.ts              # Όλα τα routes πελατών
├── DCL_v1_1_0/                     # Επίσημα XSD σχήματα ΑΑΔΕ (v1.1)
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
├── postman_collection.json          # Postman collection (31 αιτήματα)
├── .env.example                     # Πρότυπο ρυθμίσεων
├── package.json
└── tsconfig.json
```

---

## Εγγραφή στην ΑΑΔΕ

Για χρήση του AADE DCL API χρειάζεστε διαπιστευτήρια από το myDATA.

**Ανάπτυξη/Δοκιμές:**
1. Εγγραφείτε στο https://mydata-dev-register.azurewebsites.net
2. Λάβετε το `aade-user-id` και `ocp-apim-subscription-key`
3. Χρησιμοποιήστε το dev URL: `https://mydataapidev.aade.gr/DCL`

**Παραγωγή:**
1. Χρησιμοποιήστε τα credentials παραγωγής myDATA
2. Αλλάξτε το base URL σε: `https://mydatapi.aade.gr/DCL`

---

## Άδεια Χρήσης

ISC
