// ─── Enums ───────────────────────────────────────────────────────────────────

/** Τύπος Πελατολογίου */
export enum ClientServiceType {
  /** Ενοικίαση */
  Rental = 1,
  /** Πάρκινγκ / Πλυντήρια */
  ParkingCarWash = 2,
  /** Συνεργεία */
  Garage = 3,
}

/** Σκοπός Κίνησης Οχήματος (Rental) */
export enum VehicleMovementPurpose {
  /** Ενοικίαση */
  Rental = 1,
  /** Ιδιόχρηση */
  OwnUse = 2,
  /** Δωρεάν Υπηρεσία */
  FreeService = 3,
}

/** Είδος Παραστατικού */
export enum InvoiceKind {
  /** ΑΛΠ/ΑΠΥ */
  ALP_APY = 1,
  /** ΤΙΜΟΛΟΓΙΟ */
  Invoice = 2,
  /** ΑΛΠ/ΑΠΥ-ΦΗΜ */
  ALP_APY_FIM = 3,
}

/** Αιτιολογία Μη έκδοσης Παραστατικού */
export enum ReasonNonIssueType {
  /** Δωρεάν Υπηρεσία */
  FreeService = 1,
  /** Ιδιόχρηση */
  OwnUse = 2,
  /** Αποζημίωση Παροχής Εγγύησης (only Garage) */
  WarrantyCompensation = 3,
}

/** Status codes from AADE response */
export enum StatusCode {
  Success = 'Success',
  ValidationError = 'ValidationError',
  TechnicalError = 'TechnicalError',
  XMLSyntaxError = 'XMLSyntaxError',
}

// ─── SendClient Types (Rental) ──────────────────────────────────────────────

/** Rental use case details - RentalType */
export interface RentalUseCase {
  /** Αριθμός Κυκλοφορίας Οχήματος */
  vehicleRegistrationNumber?: string;
  /** Αριθμός Κυκλοφορίας Οχήματος Αλλοδαπής */
  foreignVehicleRegistrationNumber?: string;
  /** Κατηγορία Οχήματος (required with foreign reg) */
  vehicleCategory?: string;
  /** Εργοστάσιο Οχήματος (required with foreign reg) */
  vehicleFactory?: string;
  /** Σκοπός Κίνησης Οχήματος */
  vehicleMovementPurpose: VehicleMovementPurpose;
  /** Διαφορετικός Τόπος Παραλαβής Οχήματος */
  isDiffVehPickupLocation?: boolean;
  /** Τόπος Παραλαβής Οχήματος */
  vehiclePickupLocation?: string;
}

/**
 * Request body for creating a new client entry (SendClient)
 * Focused on Rental (clientServiceType = 1)
 */
export interface SendClientRequest {
  /** Αρ. Εγκατάστασης */
  branch: number;
  /** Επαναλαμβανόμενη Υπηρεσία — recurring B2B service with periodic invoicing */
  recurringService?: boolean;
  /** Διαρκής/Λήψη Δικαιώματος — right-of-use service, invoice before service starts */
  continuousService?: boolean;
  /** Διαρκής Μίσθωση/Υπηρεσία — ongoing lease with periodic partial invoicing */
  continuousLeaseService?: boolean;
  /** Από Συμφωνημένη Περίοδο (required for continuousService or continuousLeaseService) */
  fromAgreedPeriodDate?: string;
  /** Έως Συμφωνημένη Περίοδο (required for continuousService or continuousLeaseService) */
  toAgreedPeriodDate?: string;
  /** Μεικτή Υπηρεσία (only for ParkingCarWash) */
  mixedService?: boolean;
  /** ΑΦΜ Πελάτη (required for recurring service) */
  customerVatNumber?: string;
  /** Χώρα Πελάτη (required for recurring service) */
  customerCountry?: string;
  /** Απώλεια διασύνδεσης: 1 */
  transmissionFailure?: 1;
  /** Ημερομηνία δημιουργίας (required when transmissionFailure = 1, UTC format) */
  creationDateTime?: string;
  /** Συσχετιζόμενα DC ID */
  correlatedDclId?: number;
  /** Σχόλια / Παρατηρήσεις */
  comments?: string;
  /** ΑΦΜ Οντότητας Αναφοράς (when called by third party) */
  entityVatNumber?: string;
  /** Περιοδικότητα Διαρκούς Μίσθωσης σε μήνες (required for continuousLeaseService) */
  periodicity?: number;
  /** Περιοδικότητα Λοιπές — free text when periodicity list doesn't cover the case */
  periodicityOther?: string;
  /** Rental use case details */
  rental: RentalUseCase;
}

// ─── UpdateClient Types (Rental) ────────────────────────────────────────────

/**
 * Request body for updating an existing client entry (UpdateClient)
 * Focused on Rental (clientServiceType = 1)
 */
export interface UpdateClientRequest {
  /** Αρχική Εγγραφή Ψηφιακού Πελατολογίου */
  initialDclId: number;
  /** Ολοκλήρωση Εγγραφής */
  entryCompletion?: boolean;
  /** Μη έκδοση παραστατικού */
  nonIssueInvoice?: boolean;
  /** Συμφωνηθέν Ποσό */
  amount?: number;
  /** Διαφορετικός Τόπος Επιστροφής Οχήματος */
  isDiffVehReturnLocation?: boolean;
  /** Τόπος Επιστροφής Οχήματος */
  vehicleReturnLocation?: string;
  /** Είδος Παραστατικού */
  invoiceKind?: InvoiceKind;
  /** ΑΦΜ Οντότητας Αναφοράς (when called by third party) */
  entityVatNumber?: string;
  /** Αιτιολογία Μη έκδοσης Παραστατικού */
  reasonNonIssueType?: ReasonNonIssueType;
  /** Σχόλια / Παρατηρήσεις */
  comments?: string;
  /** ΑΦΜ Αντισυμβαλλόμενου */
  invoiceCounterparty?: string;
  /** Χώρα Αντισυμβαλλόμενου */
  invoiceCounterpartyCountry?: string;
}

// ─── CancelClient Types ─────────────────────────────────────────────────────

/** Query params for cancelling a client entry */
export interface CancelClientParams {
  /** Μοναδικός αριθμός εγγραφής Ψηφιακού Πελατολογίου */
  dclId: number;
  /** ΑΦΜ Οντότητας (when called by third party) */
  entityVatNumber?: string;
}

// ─── RequestClients Types ───────────────────────────────────────────────────

/** Query params for fetching client entries */
export interface RequestClientsParams {
  /** Αναγνωριστικό Εγγραφής Ψηφιακού Πελατολογίου */
  dclId: number;
  /** Μέγιστος Αριθμός Αναγνώρισης */
  maxDclId?: number;
  /** ΑΦΜ Οντότητας */
  entityVatNumber?: string;
  /** Παράμετρος τμηματικής λήψης */
  continuationToken?: string;
}

// ─── ClientCorrelations Types ───────────────────────────────────────────────

/** FIM details for fiscal receipt correlation */
export interface FIMDetail {
  /** Αριθμός Μητρώου ΦΗΜ */
  FIMNumber: string;
  /** Αύξων Αριθμός Παραστατικού ΦΗΜ */
  FIMAA: number;
  /** Ημερομηνία Έκδοσης */
  FIMIssueDate: string;
  /** Ώρα Έκδοσης */
  FIMIssueTime: string;
}

/** Request body for correlating client entries with MARK or FIM */
export interface ClientCorrelationsRequest {
  /** ΑΦΜ Οντότητας Αναφοράς (when called by third party) */
  entityVatNumber?: string;
  /** MARK Παραστατικού (choice: mark OR fim) */
  mark?: number;
  /** Στοιχεία Απόδειξης ΦΗΜ (choice: mark OR fim) */
  fim?: FIMDetail;
  /** Συσχετιζόμενα IDs εγγραφών Ψηφιακού Πελατολογίου */
  correlatedDCLIds: number[];
}

// ─── AADE Response Types ────────────────────────────────────────────────────

export interface AadeError {
  message: string;
  code: string;
}

export interface AadeResponseItem {
  index?: number;
  statusCode: StatusCode;
  newClientDclID?: number;
  updatedClientDclID?: number;
  cancellationID?: number;
  correlateId?: number;
  errors?: AadeError[];
}

export interface AadeSubmitResponse {
  response: AadeResponseItem[];
}

export interface AadeRequestedDoc {
  entityVatNumber?: string;
  clientsDoc?: any[];
  updateclientRequestsDoc?: any[];
  clientcorrelationsRequestsDoc?: any[];
  cancelClientRequestsDoc?: any[];
  continuationToken?: string;
}
