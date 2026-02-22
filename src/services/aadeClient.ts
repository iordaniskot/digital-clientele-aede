import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config';
import {
  SendClientRequest,
  UpdateClientRequest,
  CancelClientParams,
  RequestClientsParams,
  ClientCorrelationsRequest,
  AadeSubmitResponse,
  AadeRequestedDoc,
} from '../types/dcl';
import {
  buildSendClientXml,
  buildUpdateClientXml,
  buildClientCorrelationsXml,
  parseSubmitResponseXml,
  parseRequestClientsXml,
} from '../utils/xml';

export class AadeApiError extends Error {
  public statusCode: number;
  public responseBody?: string;

  constructor(message: string, statusCode: number, responseBody?: string) {
    super(message);
    this.name = 'AadeApiError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

/**
 * AADE Digital Clientele (DCL) API Client
 * Acts as a service layer between our REST API and the AADE XML API
 */
export class AadeClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: config.aade.baseUrl,
      headers: {
        'Content-Type': 'application/xml',
        'aade-user-id': config.aade.userId,
        'ocp-apim-subscription-key': config.aade.subscriptionKey,
      },
      timeout: 30000,
    });
  }

  /**
   * POST /SendClient — Create a new rental client entry
   */
  async sendClient(data: SendClientRequest): Promise<AadeSubmitResponse> {
    const xmlBody = buildSendClientXml(data);
    console.log('Sending SendClient XML:', xmlBody); // Debug log
    return this.postXml('/SendClient', xmlBody);
  }

  /**
   * POST /UpdateClient — Update an existing rental client entry
   */
  async updateClient(data: UpdateClientRequest): Promise<AadeSubmitResponse> {
    const xmlBody = buildUpdateClientXml(data);
    return this.postXml('/UpdateClient', xmlBody);
  }

  /**
   * POST /CancelClient — Cancel a client entry (no body required)
   */
  async cancelClient(params: CancelClientParams): Promise<AadeSubmitResponse> {
    const queryParams: Record<string, string | number> = {
      DCLID: params.dclId,
    };
    if (params.entityVatNumber) {
      queryParams.entityVatNumber = params.entityVatNumber;
    }

    try {
      const response = await this.http.post('/CancelClient', null, {
        params: queryParams,
      });
      return parseSubmitResponseXml(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * GET /RequestClients — Fetch one or more client entries
   */
  async requestClients(params: RequestClientsParams): Promise<AadeRequestedDoc> {
    const queryParams: Record<string, string | number> = {
      DCLID: params.dclId,
    };
    if (params.maxDclId !== undefined) {
      queryParams.maxdclid = params.maxDclId;
    }
    if (params.entityVatNumber) {
      queryParams.entityVatNumber = params.entityVatNumber;
    }
    if (params.continuationToken) {
      queryParams.continuationToken = params.continuationToken;
    }

    try {
      const response = await this.http.get('/RequestClients', {
        params: queryParams,
      });
      return parseRequestClientsXml(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * POST /ClientCorrelations — Correlate entries with MARK or FIM
   */
  async clientCorrelations(data: ClientCorrelationsRequest): Promise<AadeSubmitResponse> {
    const xmlBody = buildClientCorrelationsXml(data);
    return this.postXml('/ClientCorrelations', xmlBody);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async postXml(path: string, xmlBody: string): Promise<AadeSubmitResponse> {
    try {
      const response = await this.http.post(path, xmlBody);
      return parseSubmitResponseXml(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): AadeApiError {
    if (error instanceof AxiosError) {
      const status = error.response?.status || 500;
      const body = typeof error.response?.data === 'string'
        ? error.response.data
        : JSON.stringify(error.response?.data);
      return new AadeApiError(
        `AADE API error: ${error.message}`,
        status,
        body,
      );
    }
    if (error instanceof Error) {
      return new AadeApiError(error.message, 500);
    }
    return new AadeApiError('Unknown error communicating with AADE API', 500);
  }
}

/** Singleton instance */
export const aadeClient = new AadeClient();
