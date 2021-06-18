export interface IVueTablesQuery {
  query: {
    [columnName: string]: string;
  };
  limit: number;
  ascending: number;
  page: number;
  byColumn: number;
  orderBy: string;
}
