import { parseStringPromise } from 'xml2js';
import {
  SendClientRequest,
  UpdateClientRequest,
  ClientCorrelationsRequest,
  ClientServiceType,
  AadeSubmitResponse,
  AadeRequestedDoc,
  AadeResponseItem,
  AadeError,
  StatusCode,
} from '../types/dcl';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Escape XML special characters */
function esc(value: string | number | boolean): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Build a namespaced element: <prefix:tag>value</prefix:tag> */
function el(prefix: string, tag: string, value: string | number | boolean): string {
  return `<${prefix}:${tag}>${esc(value)}</${prefix}:${tag}>`;
}

// ─── XML Builders ───────────────────────────────────────────────────────────

const NS_SEND = 'http://www.aade.gr/myDATA/dcrnew/v1.0';
const NS_UPDATE = 'https://www.aade.gr/myDATA/dcrudt/v1.0';
const NS_CORR = 'http://www.aade.gr/myDATA/dcrudtcor/v1.0';
const NS_XSI = 'http://www.w3.org/2001/XMLSchema-instance';

/**
 * Build XML body for SendClient (Rental)
 */
export function buildSendClientXml(data: SendClientRequest): string {
  const p = 'dcrnew';
  const lines: string[] = [];

  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(
    `<${p}:NewDigitalClientDoc ` +
    `xsi:schemaLocation="${NS_SEND} SendClient-v1.1.xsd" ` +
    `xmlns:${p}="${NS_SEND}" ` +
    `xmlns:xsi="${NS_XSI}">`
  );
  lines.push(`  <${p}:newDigitalClient>`);

  // Elements MUST follow XSD xs:sequence order (newDigitalClientType)
  // 1. idDcl — omitted (filled by service)
  // 2. clientServiceType
  lines.push(`    ${el(p, 'clientServiceType', ClientServiceType.Rental)}`);
  // 3. creationDateTime
  if (data.creationDateTime) lines.push(`    ${el(p, 'creationDateTime', data.creationDateTime)}`);
  // 4. entityVatNumber
  if (data.entityVatNumber) lines.push(`    ${el(p, 'entityVatNumber', data.entityVatNumber)}`);
  // 5. branch
  lines.push(`    ${el(p, 'branch', data.branch)}`);
  // 6. recurringService
  if (data.recurringService !== undefined) lines.push(`    ${el(p, 'recurringService', data.recurringService)}`);
  // 7. continuousService
  if (data.continuousService !== undefined) lines.push(`    ${el(p, 'continuousService', data.continuousService)}`);
  // 8. fromAgreedPeriodDate
  if (data.fromAgreedPeriodDate) lines.push(`    ${el(p, 'fromAgreedPeriodDate', data.fromAgreedPeriodDate)}`);
  // 9. toAgreedPeriodDate
  if (data.toAgreedPeriodDate) lines.push(`    ${el(p, 'toAgreedPeriodDate', data.toAgreedPeriodDate)}`);
  // 10. mixedService
  if (data.mixedService !== undefined) lines.push(`    ${el(p, 'mixedService', data.mixedService)}`);
  // 11. customerVatNumber
  if (data.customerVatNumber) lines.push(`    ${el(p, 'customerVatNumber', data.customerVatNumber)}`);
  // 12. customerCountry
  if (data.customerCountry) lines.push(`    ${el(p, 'customerCountry', data.customerCountry)}`);
  // 13. transmissionFailure
  if (data.transmissionFailure) lines.push(`    ${el(p, 'transmissionFailure', data.transmissionFailure)}`);
  // 14. correlatedDclId
  if (data.correlatedDclId) lines.push(`    ${el(p, 'correlatedDclId', data.correlatedDclId)}`);
  // 15. comments
  if (data.comments) lines.push(`    ${el(p, 'comments', data.comments)}`);

  // 16. useCase > rental
  lines.push(`    <${p}:useCase>`);
  lines.push(`      <${p}:rental>`);

  const r = data.rental;
  if (r.vehicleRegistrationNumber) lines.push(`        ${el(p, 'vehicleRegistrationNumber', r.vehicleRegistrationNumber)}`);
  if (r.foreignVehicleRegistrationNumber) lines.push(`        ${el(p, 'foreignVehicleRegistrationNumber', r.foreignVehicleRegistrationNumber)}`);
  if (r.vehicleCategory) lines.push(`        ${el(p, 'vehicleCategory', r.vehicleCategory)}`);
  if (r.vehicleFactory) lines.push(`        ${el(p, 'vehicleFactory', r.vehicleFactory)}`);
  if (r.vehicleMovementPurpose !== undefined) lines.push(`        ${el(p, 'vehicleMovementPurpose', r.vehicleMovementPurpose)}`);
  if (r.isDiffVehPickupLocation !== undefined) lines.push(`        ${el(p, 'isDiffVehPickupLocation', r.isDiffVehPickupLocation)}`);
  if (r.vehiclePickupLocation) lines.push(`        ${el(p, 'vehiclePickupLocation', r.vehiclePickupLocation)}`);

  lines.push(`      </${p}:rental>`);
  lines.push(`    </${p}:useCase>`);

  // 17. periodicity (after useCase per XSD)
  if (data.periodicity) lines.push(`    ${el(p, 'periodicity', data.periodicity)}`);
  // 18. continuousLeaseService (after useCase per XSD)
  if (data.continuousLeaseService !== undefined) lines.push(`    ${el(p, 'continuousLeaseService', data.continuousLeaseService)}`);
  // 19. periodicityOther
  if (data.periodicityOther) lines.push(`    ${el(p, 'periodicityOther', data.periodicityOther)}`);

  lines.push(`  </${p}:newDigitalClient>`);
  lines.push(`</${p}:NewDigitalClientDoc>`);

  return lines.join('\n');
}

/**
 * Build XML body for UpdateClient (Rental)
 */
export function buildUpdateClientXml(data: UpdateClientRequest): string {
  const p = 'dcrudt';
  const lines: string[] = [];

  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(
    `<${p}:UpdateClientDoc ` +
    `xsi:schemaLocation="${NS_UPDATE} updateClient-v1.1.xsd" ` +
    `xmlns:xsi="${NS_XSI}" ` +
    `xmlns:${p}="${NS_UPDATE}">`
  );
  lines.push(`  <${p}:updateClient>`);

  // Required fields
  lines.push(`    ${el(p, 'initialDclId', data.initialDclId)}`);
  lines.push(`    ${el(p, 'clientServiceType', ClientServiceType.Rental)}`);

  // Optional fields
  if (data.entryCompletion !== undefined) lines.push(`    ${el(p, 'entryCompletion', data.entryCompletion)}`);
  if (data.nonIssueInvoice !== undefined) lines.push(`    ${el(p, 'nonIssueInvoice', data.nonIssueInvoice)}`);
  if (data.amount !== undefined) lines.push(`    ${el(p, 'amount', data.amount)}`);
  if (data.isDiffVehReturnLocation !== undefined) lines.push(`    ${el(p, 'isDiffVehReturnLocation', data.isDiffVehReturnLocation)}`);
  if (data.vehicleReturnLocation) lines.push(`    ${el(p, 'vehicleReturnLocation', data.vehicleReturnLocation)}`);
  if (data.invoiceKind) lines.push(`    ${el(p, 'invoiceKind', data.invoiceKind)}`);
  if (data.entityVatNumber) lines.push(`    ${el(p, 'entityVatNumber', data.entityVatNumber)}`);
  if (data.reasonNonIssueType) lines.push(`    ${el(p, 'reasonNonIssueType', data.reasonNonIssueType)}`);
  if (data.comments) lines.push(`    ${el(p, 'comments', data.comments)}`);
  if (data.invoiceCounterparty) lines.push(`    ${el(p, 'invoiceCounterparty', data.invoiceCounterparty)}`);
  if (data.invoiceCounterpartyCountry) lines.push(`    ${el(p, 'invoiceCounterpartyCountry', data.invoiceCounterpartyCountry)}`);

  lines.push(`  </${p}:updateClient>`);
  lines.push(`</${p}:UpdateClientDoc>`);

  return lines.join('\n');
}

/**
 * Build XML body for ClientCorrelations
 */
export function buildClientCorrelationsXml(data: ClientCorrelationsRequest): string {
  const p = 'dcrudtcor';
  const lines: string[] = [];

  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(
    `<${p}:ClientCorrelationDoc ` +
    `xsi:schemaLocation="${NS_CORR} clientCorrelations-v1.1.xsd" ` +
    `xmlns:xsi="${NS_XSI}" ` +
    `xmlns:${p}="${NS_CORR}">`
  );
  lines.push(`  <${p}:clientCorrelation>`);

  if (data.entityVatNumber) lines.push(`    ${el(p, 'entityVatNumber', data.entityVatNumber)}`);

  if (data.mark !== undefined) {
    lines.push(`    ${el(p, 'mark', data.mark)}`);
  } else if (data.fim) {
    lines.push(`    <${p}:FIM>`);
    lines.push(`      ${el(p, 'FIMNumber', data.fim.FIMNumber)}`);
    lines.push(`      ${el(p, 'FIMAA', data.fim.FIMAA)}`);
    lines.push(`      ${el(p, 'FIMIssueDate', data.fim.FIMIssueDate)}`);
    lines.push(`      ${el(p, 'FIMIssueTime', data.fim.FIMIssueTime)}`);
    lines.push(`    </${p}:FIM>`);
  }

  for (const id of data.correlatedDCLIds) {
    lines.push(`    ${el(p, 'correlatedDCLids', id)}`);
  }

  lines.push(`  </${p}:clientCorrelation>`);
  lines.push(`</${p}:ClientCorrelationDoc>`);

  return lines.join('\n');
}

// ─── XML Parsers ────────────────────────────────────────────────────────────

/** xml2js options that strip namespace prefixes so we get clean keys */
const PARSE_OPTS = {
  explicitArray: false,
  trim: true,
  tagNameProcessors: [(name: string) => name.replace(/^[^:]+:/, '')],
  attrNameProcessors: [(name: string) => name.replace(/^[^:]+:/, '')],
};

/**
 * Parse AADE submit response XML (SendClient, UpdateClient, CancelClient, ClientCorrelations)
 */
export async function parseSubmitResponseXml(xml: string): Promise<AadeSubmitResponse> {
  const parsed = await parseStringPromise(xml, PARSE_OPTS);

  const doc = parsed.ResponseDoc || parsed;
  let responses = doc.response;

  if (!responses) {
    return { response: [] };
  }

  if (!Array.isArray(responses)) {
    responses = [responses];
  }

  return {
    response: responses.map((r: any) => {
      const item: AadeResponseItem = {
        statusCode: r.statusCode as StatusCode,
      };

      if (r.index) item.index = parseInt(r.index, 10);
      if (r.newClientDclID) item.newClientDclID = parseInt(r.newClientDclID, 10);
      if (r.updatedClientDclID) item.updatedClientDclID = parseInt(r.updatedClientDclID, 10);
      if (r.cancellationID) item.cancellationID = parseInt(r.cancellationID, 10);
      if (r.correlateId) item.correlateId = parseInt(r.correlateId, 10);

      if (r.errors) {
        let errors = r.errors.error || r.errors;
        if (!Array.isArray(errors)) errors = [errors];
        item.errors = errors.map((e: any): AadeError => ({
          message: e.message || '',
          code: e.code || '',
        }));
      }

      return item;
    }),
  };
}

/**
 * Parse AADE RequestClients response XML
 */
export async function parseRequestClientsXml(xml: string): Promise<AadeRequestedDoc> {
  const parsed = await parseStringPromise(xml, PARSE_OPTS);
  const doc = parsed.RequestedDoc || parsed;

  const result: AadeRequestedDoc = {};

  if (doc.entityVatNumber) result.entityVatNumber = doc.entityVatNumber;
  if (doc.continuationToken) result.continuationToken = doc.continuationToken;

  if (doc.clientsDoc) {
    const clients = doc.clientsDoc.client || doc.clientsDoc;
    result.clientsDoc = Array.isArray(clients) ? clients : [clients];
  }

  if (doc.updateclientRequestsDoc) {
    const updates = doc.updateclientRequestsDoc.updateClient || doc.updateclientRequestsDoc;
    result.updateclientRequestsDoc = Array.isArray(updates) ? updates : [updates];
  }

  if (doc.clientcorrelationsRequestsDoc) {
    const corrs = doc.clientcorrelationsRequestsDoc.clientCorrelation || doc.clientcorrelationsRequestsDoc;
    result.clientcorrelationsRequestsDoc = Array.isArray(corrs) ? corrs : [corrs];
  }

  if (doc.cancelClientRequestsDoc) {
    const cancels = doc.cancelClientRequestsDoc.cancelClient || doc.cancelClientRequestsDoc;
    result.cancelClientRequestsDoc = Array.isArray(cancels) ? cancels : [cancels];
  }

  return result;
}
