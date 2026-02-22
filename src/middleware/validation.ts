import { Request, Response, NextFunction } from 'express';
import { SendClientRequest, UpdateClientRequest, ClientCorrelationsRequest } from '../types/dcl';

export class ValidationError extends Error {
  public statusCode = 400;
  public details: string[];

  constructor(details: string[]) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Validate SendClient request body for Rental use case
 */
export function validateSendClient(req: Request, _res: Response, next: NextFunction): void {
  const body = req.body as Partial<SendClientRequest>;
  const errors: string[] = [];

  if (body.branch === undefined || body.branch === null) {
    errors.push('branch is required');
  }

  if (!body.rental) {
    errors.push('rental object is required');
  } else {
    if (body.rental.vehicleMovementPurpose === undefined) {
      errors.push('rental.vehicleMovementPurpose is required (1=Rental, 2=OwnUse, 3=FreeService)');
    }

    // If foreign vehicle registration is provided, category and factory are required
    if (body.rental.foreignVehicleRegistrationNumber) {
      if (!body.rental.vehicleCategory) {
        errors.push('rental.vehicleCategory is required when foreignVehicleRegistrationNumber is provided');
      }
      if (!body.rental.vehicleFactory) {
        errors.push('rental.vehicleFactory is required when foreignVehicleRegistrationNumber is provided');
      }
    }
  }

  // transmissionFailure = 1 requires creationDateTime
  if (body.transmissionFailure === 1 && !body.creationDateTime) {
    errors.push('creationDateTime is required when transmissionFailure is 1 (UTC format)');
  }

  // Service type mutual exclusivity
  const serviceFlags = [body.recurringService, body.continuousService, body.continuousLeaseService].filter(Boolean);
  if (serviceFlags.length > 1) {
    errors.push('Only one service type allowed: recurringService, continuousService, or continuousLeaseService');
  }

  // Recurring requires customerVatNumber and customerCountry
  if (body.recurringService) {
    if (!body.customerVatNumber) errors.push('customerVatNumber is required for recurring service');
    if (!body.customerCountry) errors.push('customerCountry is required for recurring service');
  }

  // Continuous and lease require date range
  if (body.continuousService || body.continuousLeaseService) {
    if (!body.fromAgreedPeriodDate) errors.push('fromAgreedPeriodDate is required for continuous/lease service');
    if (!body.toAgreedPeriodDate) errors.push('toAgreedPeriodDate is required for continuous/lease service');
  }

  // Lease additionally requires periodicity
  if (body.continuousLeaseService) {
    if (!body.periodicity && !body.periodicityOther) {
      errors.push('periodicity or periodicityOther is required for continuous lease service');
    }
  }

  // Recurring service restricts vehicleMovementPurpose — cannot be OwnUse(2) or FreeService(3)
  if (body.recurringService && body.rental?.vehicleMovementPurpose !== undefined) {
    if (body.rental.vehicleMovementPurpose === 2 || body.rental.vehicleMovementPurpose === 3) {
      errors.push('vehicleMovementPurpose cannot be 2 (OwnUse) or 3 (FreeService) when recurringService is true');
    }
  }

  if (errors.length > 0) {
    return next(new ValidationError(errors));
  }

  next();
}

/**
 * Validate UpdateClient request body for Rental use case
 */
export function validateUpdateClient(req: Request, _res: Response, next: NextFunction): void {
  const body = req.body as Partial<UpdateClientRequest>;
  const errors: string[] = [];

  if (!body.initialDclId) {
    errors.push('initialDclId is required');
  }

  // nonIssueInvoice == true → invoiceCounterparty and invoiceCounterpartyCountry must NOT be sent
  if (body.nonIssueInvoice && (body.invoiceCounterparty || body.invoiceCounterpartyCountry)) {
    errors.push('invoiceCounterparty and invoiceCounterpartyCountry must not be sent when nonIssueInvoice is true');
  }

  if (errors.length > 0) {
    return next(new ValidationError(errors));
  }

  next();
}

/**
 * Validate ClientCorrelations request body
 */
export function validateClientCorrelations(req: Request, _res: Response, next: NextFunction): void {
  const body = req.body as Partial<ClientCorrelationsRequest>;
  const errors: string[] = [];

  // Either mark or fim must be provided
  if (body.mark === undefined && !body.fim) {
    errors.push('Either mark or fim must be provided');
  }

  if (body.mark !== undefined && body.fim) {
    errors.push('Only one of mark or fim should be provided, not both');
  }

  // FIM validation
  if (body.fim) {
    if (!body.fim.FIMNumber) errors.push('fim.FIMNumber is required');
    if (body.fim.FIMAA === undefined) errors.push('fim.FIMAA is required');
    if (!body.fim.FIMIssueDate) errors.push('fim.FIMIssueDate is required');
    if (!body.fim.FIMIssueTime) errors.push('fim.FIMIssueTime is required');
  }

  if (!body.correlatedDCLIds || !Array.isArray(body.correlatedDCLIds) || body.correlatedDCLIds.length === 0) {
    errors.push('correlatedDCLIds must be a non-empty array');
  } else if (body.correlatedDCLIds.length > 50) {
    errors.push('correlatedDCLIds cannot contain more than 50 elements');
  }

  if (errors.length > 0) {
    return next(new ValidationError(errors));
  }

  next();
}

/**
 * Validate RequestClients query params
 */
export function validateRequestClients(req: Request, _res: Response, next: NextFunction): void {
  const errors: string[] = [];

  if (!req.query.dclId) {
    errors.push('dclId query parameter is required');
  } else if (isNaN(Number(req.query.dclId))) {
    errors.push('dclId must be a number');
  }

  if (req.query.maxDclId && isNaN(Number(req.query.maxDclId))) {
    errors.push('maxDclId must be a number');
  }

  if (errors.length > 0) {
    return next(new ValidationError(errors));
  }

  next();
}

/**
 * Validate CancelClient params
 */
export function validateCancelClient(req: Request, _res: Response, next: NextFunction): void {
  const errors: string[] = [];

  if (!req.params.dclId) {
    errors.push('dclId URL parameter is required');
  } else if (isNaN(Number(req.params.dclId))) {
    errors.push('dclId must be a number');
  }

  if (errors.length > 0) {
    return next(new ValidationError(errors));
  }

  next();
}
