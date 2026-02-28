// ─── Wrapp Invoice Types ────────────────────────────────────────────────────
// Based on Wrapp API v1.10 documentation
// Supports B2B and B2C invoice creation via Wrapp third-party provider

// ─── Enums ──────────────────────────────────────────────────────────────────

/** Payment method type codes as defined by Wrapp / myDATA */
export enum PaymentMethodType {
  Cash = 0,
  Credit = 1,
  LocalBankAccount = 2,
  Card = 3,
  Cheque = 4,
  OverseasBankAccount = 5,
  WebBankingTransfer = 6,
  IrisPayment = 7,
}

// ─── Counterpart (Customer) ─────────────────────────────────────────────────

/** Customer information attached to the invoice */
export interface InvoiceCounterpart {
  /** Name of the company (B2B) or first & last name (B2C) */
  name: string;
  /** Country code, e.g. "GR" (required for B2B) */
  country_code?: string;
  /** Tax ID / VAT number (required for B2B) */
  vat?: string;
  /** City (required for B2B) */
  city?: string;
  /** Street address (required for B2B) */
  street?: string;
  /** Street number (required for B2B) */
  number?: string;
  /** Postal code (required for B2B) */
  postal_code?: string;
  /** Client email */
  email?: string;
}

// ─── Invoice Line Deduction ─────────────────────────────────────────────────

export interface InvoiceLineDeduction {
  /** Deduction title */
  title?: string;
  /** Deduction amount (required), max 2 decimals */
  amount: number;
  /** Whether this deduction is informational only */
  informational?: boolean;
}

// ─── Classification ─────────────────────────────────────────────────────────

export interface InvoiceLineClassification {
  /** Classification category (required) */
  category: string;
  /** Classification type (required) */
  type: string;
  /** Amount (required) */
  amount: number;
}

// ─── Invoice Line ───────────────────────────────────────────────────────────

export interface InvoiceLine {
  /** Index number of the invoice line (required) */
  line_number: number;
  /** Product / service name (required) */
  name: string;
  /** Product / service description */
  description?: string;
  /** Quantity (required) */
  quantity: number;
  /** Quantity type code per myDATA spec */
  quantity_type?: number;
  /** Price per unit, max 2 decimals (required) */
  unit_price: number;
  /** Net total price of the line (required) */
  net_total_price: number;
  /** VAT rate per myDATA spec (required) */
  vat_rate: number;
  /** Total VAT for this line, max 2 decimals (required) */
  vat_total: number;
  /** Subtotal of this line, max 2 decimals (required) */
  subtotal: number;
  /** VAT exemption code (required when vat_rate is 0) */
  vat_exemption_code?: string;
  /** Classification category per myDATA (required) */
  classification_category: string;
  /** Classification type per myDATA (required) */
  classification_type: string;
  /** Other taxes amount (for invoice type 8.2) */
  other_taxes_amount?: number;
  /** Accommodation tax (for invoice type 8.2) */
  accommodation_tax?: number;
  /** Other taxes percent category (for invoice type 8.2) */
  other_taxes_percent_category?: string;
  /** Withhold tax rate (e.g. 20 for 20%) */
  withhold_tax_rate?: number;
  /** myDATA withhold category code */
  withhold_tax_code?: string;
  /** Withholding total, max 2 decimals */
  withholding_total?: number;
  /** myDATA stamp duty code (1-4) */
  stamp_duty_tax_code?: string;
  /** Stamp duty amount, max 2 decimals */
  stamp_duty_amount?: number;
  /** CPV code (required for B2G) */
  cpv_code?: string;
  /** Deductions amount, max 2 decimals */
  deductions_amount?: number;
  /** Array of deductions */
  deductions?: InvoiceLineDeduction[];
  /** Expense VAT classification (required when self_pricing is true) */
  expenses_vat_classification?: string;
  /** Multiple classification types & categories (overrides classification_type/category) */
  classifications?: InvoiceLineClassification[];
  /** Invoice detail type identifier */
  invoice_detail_type?: number;
  /** Whether line is an expense */
  expense?: boolean;
  /** Fees type — for Τέλη the valid value is 2 */
  rec_type?: number;
  /** Fees category */
  fees_category?: number;
}

// ─── Delivery Detail ────────────────────────────────────────────────────────

export interface DeliveryDetail {
  /** Dispatch date, format "DD-MMM-YYYY" */
  dispatch_date: string;
  /** Dispatch time, format "HH:MM" */
  dispatch_time: string;
  /** Vehicle registration number */
  vehicle_number: string;
  /** Purpose of movement code (1-20, excl 6,15,16,17,18) */
  purpose_of_movement: string;
  /** Name / identifier of the movement issuer */
  issuer_of_movement: string;
  /** Origin street address */
  from_address: string;
  /** Origin street number */
  from_number: string;
  /** Origin city */
  from_city: string;
  /** Origin postal code */
  from_zipcode: string;
  /** Origin branch ID */
  from_branch?: number;
  /** Destination street address */
  to_address: string;
  /** Destination street number */
  to_number: string;
  /** Destination city */
  to_city: string;
  /** Destination postal code */
  to_zipcode: string;
  /** Destination branch ID */
  to_branch?: number;
  /** Whether this is a reverse delivery note */
  reverse_delivery_note?: boolean;
  /** Purpose of the reverse delivery note (required when reverse_delivery_note is true) */
  reverse_delivery_note_purpose?: number;
}

// ─── Taxes Totals ───────────────────────────────────────────────────────────

export interface TaxesTotal {
  /** Tax type (1-5) */
  tax_type: number;
  /** Tax category */
  tax_category: number;
  /** Tax amount */
  tax_amount: number;
  /** Underlying value for tax calculation */
  underlying_value?: number;
}

// ─── Create Invoice Request ─────────────────────────────────────────────────

export interface CreateInvoiceRequest {
  /** Branch id */
  branch?: string;
  /** Customer information (required) */
  counterpart: InvoiceCounterpart;
  /** Billing book ID (required) */
  billing_book_id: string;
  /** Invoice type code per myDATA e.g. "1.1", "2.1", "11.1" (required) */
  invoice_type_code: string;
  /** Payment method type (required) */
  payment_method_type: PaymentMethodType;
  /** Payment details text */
  payment_details?: string;
  /** Currency code e.g. "USD", "NOK" */
  currency?: string;
  /** Exchange rate, max 2 decimals (required if currency is set) */
  exchange_rate?: number;
  /** Other taxes amount (required for invoice type 8.2) */
  other_taxes_amount?: number;
  /** Total net amount, max 2 decimals (required) */
  net_total_amount: number;
  /** Total VAT amount, max 2 decimals (required) */
  vat_total_amount: number;
  /** Total invoice amount, max 2 decimals (required) */
  total_amount: number;
  /** Total payable amount, max 2 decimals (required) */
  payable_total_amount: number;
  /** Invoice notes */
  notes?: string;
  /** myDATA marks of correlated invoices */
  correlated_invoices?: string[];
  /** Whether the invoice is a delivery note */
  is_delivery_note?: boolean;
  /** Delivery details (requires is_delivery_note true) */
  delivery_detail?: DeliveryDetail;
  /** Invoice line items (required) */
  invoice_lines: InvoiceLine[];
  /** Withholding total amount, max 2 decimals */
  withholding_total_amount?: number;
  /** Total stamp duty amount, max 2 decimals */
  total_stamp_duty_amount?: number;
  /** B2G invoice flag */
  b2g?: boolean;
  /** Customer emails for notification */
  customer_emails?: string[];
  /** Email locale: "el" (Greek, default) or "en" (English) */
  email_locale?: string;
  /** Deductions total amount, max 2 decimals */
  deductions_total_amount?: number;
  /** Specific invoice number */
  num?: number;
  /** Self pricing mode */
  self_pricing?: boolean;
  /** POS device ID (required when pos payments are made) */
  pos_device_id?: string;
  /** AADE preloaded flag */
  aade_preloaded?: string;
  /** Refund invoice ID (for POS credit invoices) */
  refund_invoice_id?: string;
  /** Generate PDF and send via webhook */
  generate_pdf?: boolean;
  /** Save as draft without submitting to myDATA */
  draft?: boolean;
  /** Enable installments (VIVA terminals only) */
  installments?: boolean;
  /** Invoice-level taxes (overrides line-level taxes) */
  taxes_totals?: TaxesTotal[];
  /** Fees amount, max 2 decimals */
  fees_amount?: number;
  /** Stamp duty amount, max 2 decimals */
  stamp_duty_amount?: number;
  /** Catering table ID */
  catering_table_id?: string;
  /** Catering table name (for creating new table) */
  catering_table_name?: string;
}

// ─── Wrapp API Responses ────────────────────────────────────────────────────

export interface WrappInvoiceSuccessResponse {
  id: string;
  my_data_mark: string;
  my_data_uid: string;
  my_data_qr_url: string;
  series: string;
  num: number;
  cancelled_by_mark: string | null;
  wrapp_invoice_url: string;
  wrapp_invoice_url_en: string;
}

export interface WrappPendingResponse {
  status: 'pending';
  invoice_id: string;
}

export interface WrappErrorDetail {
  title?: string;
  code?: string;
  message?: string;
}

export interface WrappErrorResponse {
  status?: string;
  errors: WrappErrorDetail[];
}

export interface WrappLoginResponse {
  data: {
    type: string;
    attributes: {
      jwt: string;
    };
  };
}

export type WrappInvoiceResponse =
  | WrappInvoiceSuccessResponse
  | WrappPendingResponse
  | WrappErrorResponse;
