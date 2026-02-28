import { Request, Response, NextFunction } from 'express';
import { CreateInvoiceRequest, InvoiceLine } from '../types/invoice';
import { ValidationError } from './validation';

// ─── B2B invoice type codes (require counterpart VAT, address, etc.) ────────
const B2B_INVOICE_CODES = [
  '1.1', '1.2', '1.3', '1.4', '1.5', '1.6',
  '2.1', '2.2', '2.3', '2.4',
  '3.1', '3.2',
  '5.1', '5.2',
  '6.1', '6.2',
  '7.1',
  '8.1',
];

// ─── B2C / Retail invoice type codes ────────────────────────────────────────
const B2C_INVOICE_CODES = [
  '11.1', '11.2', '11.3', '11.4', '11.5',
];

const ALL_INVOICE_CODES = [
  ...B2B_INVOICE_CODES,
  ...B2C_INVOICE_CODES,
  '8.2', '8.4', '8.5', '8.6',
  '9.3',
  '13.1', '13.2', '13.3', '13.4', '13.30', '13.31',
];

/**
 * Validate CreateInvoice request body.
 * Ensures required fields are present and applies B2B/B2C specific rules.
 */
export function validateCreateInvoice(req: Request, _res: Response, next: NextFunction): void {
  const body = req.body as Partial<CreateInvoiceRequest>;
  const errors: string[] = [];

  // ─── Top-level required fields ──────────────────────────────────────────────
  if (!body.billing_book_id) {
    errors.push('billing_book_id is required');
  }

  if (!body.invoice_type_code) {
    errors.push('invoice_type_code is required');
  } else if (!ALL_INVOICE_CODES.includes(body.invoice_type_code)) {
    errors.push(`invoice_type_code "${body.invoice_type_code}" is not a recognized code`);
  }

  if (body.payment_method_type === undefined || body.payment_method_type === null) {
    errors.push('payment_method_type is required');
  } else if (body.payment_method_type < 0 || body.payment_method_type > 7) {
    errors.push('payment_method_type must be between 0 and 7');
  }

  if (body.net_total_amount === undefined) {
    errors.push('net_total_amount is required');
  }
  if (body.vat_total_amount === undefined) {
    errors.push('vat_total_amount is required');
  }
  if (body.total_amount === undefined) {
    errors.push('total_amount is required');
  }
  if (body.payable_total_amount === undefined) {
    errors.push('payable_total_amount is required');
  }

  // ─── Counterpart validation ─────────────────────────────────────────────────
  if (!body.counterpart) {
    errors.push('counterpart object is required');
  } else {
    if (!body.counterpart.name) {
      errors.push('counterpart.name is required');
    }

    // B2B invoices require full counterpart details
    if (body.invoice_type_code && B2B_INVOICE_CODES.includes(body.invoice_type_code)) {
      if (!body.counterpart.country_code) {
        errors.push('counterpart.country_code is required for B2B invoices');
      }
      if (!body.counterpart.vat) {
        errors.push('counterpart.vat is required for B2B invoices');
      }
      if (!body.counterpart.city) {
        errors.push('counterpart.city is required for B2B invoices');
      }
      if (!body.counterpart.street) {
        errors.push('counterpart.street is required for B2B invoices');
      }
      if (!body.counterpart.number) {
        errors.push('counterpart.number is required for B2B invoices');
      }
      if (!body.counterpart.postal_code) {
        errors.push('counterpart.postal_code is required for B2B invoices');
      }
    }
  }

  // ─── Invoice lines validation ───────────────────────────────────────────────
  if (!body.invoice_lines || !Array.isArray(body.invoice_lines) || body.invoice_lines.length === 0) {
    errors.push('invoice_lines must be a non-empty array');
  } else {
    body.invoice_lines.forEach((line: Partial<InvoiceLine>, idx: number) => {
      const prefix = `invoice_lines[${idx}]`;
      if (line.line_number === undefined) errors.push(`${prefix}.line_number is required`);
      if (!line.name) errors.push(`${prefix}.name is required`);
      if (line.quantity === undefined) errors.push(`${prefix}.quantity is required`);
      if (line.unit_price === undefined) errors.push(`${prefix}.unit_price is required`);
      if (line.net_total_price === undefined) errors.push(`${prefix}.net_total_price is required`);
      if (line.vat_rate === undefined) errors.push(`${prefix}.vat_rate is required`);
      if (line.vat_total === undefined) errors.push(`${prefix}.vat_total is required`);
      if (line.subtotal === undefined) errors.push(`${prefix}.subtotal is required`);
      if (!line.classification_category) errors.push(`${prefix}.classification_category is required`);
      if (!line.classification_type) errors.push(`${prefix}.classification_type is required`);

      // VAT exemption code required when vat_rate is 0
      if (line.vat_rate === 0 && !line.vat_exemption_code) {
        errors.push(`${prefix}.vat_exemption_code is required when vat_rate is 0`);
      }
    });
  }

  // ─── Currency validation ────────────────────────────────────────────────────
  if (body.currency && body.exchange_rate === undefined) {
    errors.push('exchange_rate is required when currency is specified');
  }

  // ─── Delivery note validation ───────────────────────────────────────────────
  if (body.is_delivery_note || body.invoice_type_code === '9.3') {
    if (!body.delivery_detail) {
      errors.push('delivery_detail is required when is_delivery_note is true or invoice_type_code is 9.3');
    } else {
      const dd = body.delivery_detail;
      if (!dd.dispatch_date) errors.push('delivery_detail.dispatch_date is required');
      if (!dd.dispatch_time) errors.push('delivery_detail.dispatch_time is required');
      if (!dd.vehicle_number) errors.push('delivery_detail.vehicle_number is required');
      if (!dd.purpose_of_movement) errors.push('delivery_detail.purpose_of_movement is required');
      if (!dd.issuer_of_movement) errors.push('delivery_detail.issuer_of_movement is required');
      if (!dd.from_address) errors.push('delivery_detail.from_address is required');
      if (!dd.from_number) errors.push('delivery_detail.from_number is required');
      if (!dd.from_city) errors.push('delivery_detail.from_city is required');
      if (!dd.from_zipcode) errors.push('delivery_detail.from_zipcode is required');
      if (!dd.to_address) errors.push('delivery_detail.to_address is required');
      if (!dd.to_number) errors.push('delivery_detail.to_number is required');
      if (!dd.to_city) errors.push('delivery_detail.to_city is required');
      if (!dd.to_zipcode) errors.push('delivery_detail.to_zipcode is required');
    }
  }

  // ─── POS device validation ──────────────────────────────────────────────────
  if (body.payment_method_type === 3 && !body.pos_device_id && !body.draft) {
    // Card payment without POS device is allowed only for drafts
    // This is a soft warning — Wrapp will enforce it
  }

  if (errors.length > 0) {
    return next(new ValidationError(errors));
  }

  next();
}
