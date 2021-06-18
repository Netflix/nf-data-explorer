import { isSelectQuery, limitSelectQuery } from '../statement-utils';

describe('statement utils suite', () => {
  it('should correctly identify a SELECT statement', () => {
    expect(isSelectQuery(' seleCt * from abc.def LimiT 100 ')).toBe(true);
    expect(isSelectQuery('insert into abc.def (a, b) values (1, 2) ')).toBe(
      false,
    );
  });

  describe('limit SELECT queries', () => {
    it('should apply a limit to a SELECT query', () => {
      const originalQuery = ' seleCt * from abc.def ';
      const limit = 100;
      expect(limitSelectQuery(originalQuery, limit)).toEqual(
        `${originalQuery} LIMIT ${limit}`,
      );
    });

    it('should replace an existing higher limit', () => {
      const originalBaseQuery = ' seleCt * from abc.def LIMIT';

      const originalLimit = 7000;
      const originalQuery = `${originalBaseQuery} ${originalLimit}`;

      const newLimit = 50;
      const expectedQuery = `${originalBaseQuery} ${newLimit}`;

      expect(limitSelectQuery(originalQuery, newLimit)).toEqual(expectedQuery);
      expect(originalQuery).toEqual(originalQuery);
    });

    it('should preserve an existing lower limit', () => {
      const originalQuery = ' seleCt * from abc.def LIMIT 25';
      expect(limitSelectQuery(originalQuery, 100)).toEqual(originalQuery);
    });

    it('should return the original query if not a SELECT query', () => {
      const originalQuery = 'insert into abc.def (a, b) values (1, 2) ';
      expect(limitSelectQuery(originalQuery, 100)).toEqual(originalQuery);
    });
  });
});
