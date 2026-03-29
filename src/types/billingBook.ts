/**
 * Wrapp Billing Book — represents a billing series for a specific invoice type.
 *
 * Billing books with invoice_type_code 1.1 cover all 1.x types,
 * billing books with invoice_type_code 2.1 cover all 2.x types, etc.
 */
export interface BillingBook {
  /** UUID of the billing book */
  id: string;
  /** Human-readable name (e.g. "Απ Παροχης") */
  name: string;
  /** Serial identifier (e.g. "ΕΑΠΑΡ") */
  series: string;
  /** myDATA invoice type code (e.g. "11.2") */
  invoice_type_code: string;
  /** Next sequential invoice number */
  number: number;
  /** Whether invoices are automatically marked as paid */
  mark_as_paid?: boolean;
}

/** Request body for creating a new billing book */
export interface CreateBillingBookRequest {
  /** Name of the billing book (required) */
  name: string;
  /** Serial identifier e.g. "ΕΑΠΑΡ" (required) */
  series: string;
  /** Starting invoice number (required) */
  number: number;
  /** Invoice type code e.g. "11.2", "1.1", "2.1" (required) */
  invoice_type_code: string;
  /** Whether invoices are automatically marked as paid */
  mark_as_paid?: boolean;
}

/** Request body for updating an existing billing book (all fields optional) */
export interface UpdateBillingBookRequest {
  name?: string;
  series?: string;
  number?: number;
  invoice_type_code?: string;
  mark_as_paid?: boolean;
}
