/**
 * Represents an abstract Schema statement.
 */
export default class SchemaStatement {
  get STATEMENT_START(): string {
    return '\n\t';
  }

  get COLUMN_FORMAT(): string {
    return '\n\t\t';
  }

  public getQueryString(): string {
    throw new Error('Subclasses must override getQueryString()');
  }
}
