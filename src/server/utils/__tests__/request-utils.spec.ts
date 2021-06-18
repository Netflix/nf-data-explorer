import {
  getQueryAsNumber,
  getQueryAsString,
  getQueryAsStringArray,
} from '../request-utils';
import { parse } from 'querystring';
import { Request } from 'express';

function mockQuery(search: string): Request {
  // express uses 'querystring' as it's native parser
  return ({
    query: parse(search),
  } as unknown) as Request;
}

describe('request utils test suite', () => {
  // numbers
  describe('get number query params', () => {
    it('should get number request param', async () => {
      const req = mockQuery('count=10');
      expect(getQueryAsNumber(req, 'count')).toEqual(10);
    });

    it('should get undefined for a missing number value', async () => {
      const req = mockQuery('count=');
      expect(getQueryAsNumber(req, 'count')).toEqual(undefined);
    });

    it('should get NaN for a string value', async () => {
      const req = mockQuery('count=cat');
      expect(getQueryAsNumber(req, 'count')).toBeNaN();
    });
  });

  // strings
  describe('get string query params', () => {
    it('should get a string request param', async () => {
      const req = mockQuery('name=jack');
      expect(getQueryAsString(req, 'name')).toEqual('jack');
    });

    it('should get undefined for empty query param', async () => {
      const req = mockQuery('name=');
      expect(getQueryAsString(req, 'name')).toBeUndefined();
    });

    it('empty strings should return the default value', async () => {
      const req = mockQuery('name=');
      expect(getQueryAsString(req, 'name', 'John Doe')).toEqual('John Doe');
    });
  });

  // arrays
  describe('get string array query params', () => {
    it('should get a string array', async () => {
      const req = mockQuery('names=jack&names=jill');
      expect(getQueryAsStringArray(req, 'names')).toEqual(['jack', 'jill']);
    });
  });
});
