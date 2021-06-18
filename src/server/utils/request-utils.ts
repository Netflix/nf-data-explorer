import { Request } from 'express';
import { IVueTablesQuery } from '@/typings/vue-tables-pagination';

export function getReqProtocolAndHost(req: Request): string {
  return `${req.protocol}://${req.get('host')}`;
}

export function getReqUrl(req: Request): string {
  return `${req.protocol}://${req.get('host')}${req.baseUrl}`;
}

export function getVueTablesQuery(params: {
  [key: string]: any;
}): IVueTablesQuery {
  return {
    ascending: parseInt(params['ascending'] ?? 1, 10),
    byColumn: parseInt(params['byColumn'] ?? 1, 10),
    limit: parseInt(params['limit'] ?? 100, 10),
    orderBy: params['orderBy'],
    page: parseInt(params['page'] ?? 1, 10),
    query: JSON.parse(params['query'] ?? '{}'),
  };
}

/**
 * Provides a type-safe way to fetch numerical query param values from the Request object.
 * @param req
 * @param param
 */
export function getQueryAsNumber(
  req: Request,
  param: string,
): number | undefined;
/**
 * Provides a type-safe way to fetch numerical query param values from the Request object with support for a default value.
 * @param req
 * @param param
 * @param defaultValue
 */
export function getQueryAsNumber(
  req: Request,
  param: string,
  defaultValue: number,
): number;
export function getQueryAsNumber(
  req: Request,
  param: string,
  defaultValue = undefined as number | undefined,
): number | undefined {
  const value = req.query[param];
  if (value !== undefined && typeof value === 'string' && value.length > 0) {
    return Number(value);
  }
  return defaultValue;
}

/**
 * Provides a type-safe way to fetch string query param values from the Request object.
 * @param req
 * @param param
 */
export function getQueryAsString(
  req: Request,
  param: string,
): string | undefined;
export function getQueryAsString<T>(req: Request, param: string): T | undefined;
/**
 * Provides a type-safe way to fetch string query param values from the Request object with support for a default value.
 * @param req
 * @param param
 * @param defaultValue
 */
export function getQueryAsString(
  req: Request,
  param: string,
  defaultValue: string,
): string;
export function getQueryAsString<T>(
  req: Request,
  param: string,
  defaultValue: T,
): T;
export function getQueryAsString(
  req: Request,
  param: string,
  defaultValue?: string,
): string | undefined {
  const value = req.query[param];
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return defaultValue;
}

export function getQueryAsStringArray(
  req: Request,
  param: string,
  defaultValue = new Array<string>(),
): string[] {
  const value = req.query[param];
  return Array.isArray(value) ? (value as string[]) : defaultValue;
}
