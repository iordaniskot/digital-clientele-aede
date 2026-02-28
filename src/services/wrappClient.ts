import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config';
import {
  CreateInvoiceRequest,
  WrappLoginResponse,
  WrappInvoiceResponse,
} from '../types/invoice';
import { BillingBook, CreateBillingBookRequest } from '../types/billingBook';

export class WrappApiError extends Error {
  public statusCode: number;
  public responseBody?: unknown;

  constructor(message: string, statusCode: number, responseBody?: unknown) {
    super(message);
    this.name = 'WrappApiError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

/**
 * Wrapp API Client
 * Handles authentication (JWT) and invoice creation via Wrapp third-party service.
 */
export class WrappClient {
  private http: AxiosInstance;
  private jwt: string | null = null;
  private jwtExpiresAt: number = 0;

  constructor() {
    this.http = axios.create({
      baseURL: config.wrapp.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000,
    });
  }

  // ─── Authentication ─────────────────────────────────────────────────────────

  /**
   * Login to Wrapp API and obtain a JWT token.
   * Tokens expire after 24 hours; this method caches and reuses them.
   */
  private async authenticate(): Promise<string> {
    // Return cached token if still valid (with 5-min buffer)
    if (this.jwt && Date.now() < this.jwtExpiresAt - 5 * 60 * 1000) {
      return this.jwt;
    }

    const payload: Record<string, string> = {
      api_key: config.wrapp.apiKey,
    };

    // Use email or wrapp_user_id for authentication
    if (config.wrapp.email) {
      payload.email = config.wrapp.email;
    } else if (config.wrapp.wrappUserId) {
      payload.wrapp_user_id = config.wrapp.wrappUserId;
    } else {
      throw new WrappApiError(
        'Wrapp authentication requires either WRAPP_EMAIL or WRAPP_USER_ID',
        500,
      );
    }

    try {
      const response = await this.http.post<WrappLoginResponse>('/login', payload);
      this.jwt = response.data.data.attributes.jwt;
      // JWT expires after 24 hours
      this.jwtExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
      return this.jwt;
    } catch (error) {
      throw this.handleError(error, 'Authentication failed');
    }
  }

  /**
   * Get authorization headers with a valid JWT.
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.authenticate();
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  // ─── Invoice Operations ─────────────────────────────────────────────────────

  /**
   * POST /invoices — Create and issue a new invoice
   * Supports B2B (with counterpart VAT, address details) and B2C (retail) invoices.
   */
  async createInvoice(data: CreateInvoiceRequest): Promise<WrappInvoiceResponse> {
    const headers = await this.getAuthHeaders();

    try {
      const response = await this.http.post<WrappInvoiceResponse>(
        '/invoices',
        data,
        { headers },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Invoice creation failed');
    }
  }

  // ─── Billing Books ──────────────────────────────────────────────────────────

  /**
   * Resolve the billing book UUID for a given invoice_type_code.
   * Wrapp uses umbrella codes (1.1 covers 1.x, 2.1 covers 2.x, etc.),
   * so we match the exact code first, then fall back to the umbrella.
   */
  async resolveBillingBookId(invoiceTypeCode: string): Promise<string> {
    const books = await this.getBillingBooks();

    // 1. Exact match
    const exact = books.find(b => b.invoice_type_code === invoiceTypeCode);
    if (exact) return exact.id;

    // 2. Umbrella match — e.g. "1.3" falls back to "1.1", "2.4" to "2.1"
    const major = invoiceTypeCode.split('.')[0];
    const umbrella = books.find(b => b.invoice_type_code === `${major}.1`);
    if (umbrella) return umbrella.id;

    throw new WrappApiError(
      `No billing book found for invoice_type_code "${invoiceTypeCode}"`,
      404,
    );
  }

  /**
   * Create an invoice by invoice_type_code.
   * Automatically resolves the billing_book_id from the tenant's billing books.
   * If billing_book_id is already provided, it is used as-is.
   */
  async createInvoiceByTypeCode(
    data: Omit<CreateInvoiceRequest, 'billing_book_id'> & { billing_book_id?: string },
  ): Promise<WrappInvoiceResponse> {
    const billingBookId = data.billing_book_id
      ?? await this.resolveBillingBookId(data.invoice_type_code);

    return this.createInvoice({
      ...data,
      billing_book_id: billingBookId,
    } as CreateInvoiceRequest);
  }

  /**
   * GET /billing_books — Retrieve all billing books for the tenant.
   */
  async getBillingBooks(): Promise<BillingBook[]> {
    const headers = await this.getAuthHeaders();

    try {
      const response = await this.http.get<BillingBook[]>(
        '/billing_books',
        { headers },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to retrieve billing books');
    }
  }

  /**
   * POST /billing_books — Create a new billing book.
   */
  async createBillingBook(data: CreateBillingBookRequest): Promise<BillingBook> {
    const headers = await this.getAuthHeaders();

    try {
      const response = await this.http.post<BillingBook>(
        '/billing_books',
        data,
        { headers },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create billing book');
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private handleError(error: unknown, context: string): WrappApiError {
    if (error instanceof AxiosError) {
      const status = error.response?.status || 500;
      const body = error.response?.data;
      return new WrappApiError(
        `Wrapp API error (${context}): ${error.message}`,
        status,
        body,
      );
    }
    if (error instanceof Error) {
      return new WrappApiError(`${context}: ${error.message}`, 500);
    }
    return new WrappApiError(`${context}: Unknown error`, 500);
  }
}

/** Singleton instance */
export const wrappClient = new WrappClient();
