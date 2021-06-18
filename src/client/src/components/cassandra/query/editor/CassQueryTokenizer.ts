const TOKEN_KEYWORD = 'keyword';
const TOKEN_KEYSPACE = 'entity.name.keyspace';
const TOKEN_TABLE = 'entity.name.table';

interface IToken {
  type: string;
  value: string;
  index?: number;
  start?: number;
}

export default class QueryTokenizer {
  private actionOptionsMap = {};

  constructor(readonly editor: any) {
    this.actionOptionsMap = {
      select: ['WHERE', 'ORDER BY', 'LIMIT', 'ALLOW FILTERING'],
      insert: ['VALUES', 'USING TTL', 'TIMESTAMP'],
      update: [
        'SET',
        'USING TTL',
        'USING TIMESTAMP',
        'IF',
        'IF EXISTS',
        'IF NOT EXISTS',
      ],
    };
  }

  public getKeyspace(): string | null {
    return this.getTokenValue(TOKEN_KEYSPACE);
  }

  public getTable(): string | null {
    return this.getTokenValue(TOKEN_TABLE);
  }

  public isSelectStatement(): boolean {
    return !!this.findTokenWithValue(TOKEN_KEYWORD, 'select');
  }

  public isInsertStatement(): boolean {
    return !!this.findTokenWithValue(TOKEN_KEYWORD, 'insert');
  }

  public isUpdateStatement(): boolean {
    return !!this.findTokenWithValue(TOKEN_KEYWORD, 'update');
  }

  /**
   * Finds the first instance of a matching token from the list of all tokens in the editor.
   * @parma {String|Function} test    The function to test for a match. The function is called with a single `token` parameter.
   *                                  Expected to return true if token is a match.
   * @returns The matching token or null if not found.
   */
  public findToken(test: string | ((token: IToken) => boolean)): IToken | null {
    const rowCount = this.editor.session.getLength();
    for (let i = 0; i <= rowCount; i++) {
      const lineTokens = this.editor.session.getTokens(i) as IToken[];
      const token =
        typeof test === 'string'
          ? lineTokens.find((tok) => tok.type === test)
          : lineTokens.find(test); // eslint-disable-line no-loop-func
      if (token) {
        return token;
      }
    }
    return null;
  }

  /**
   * Helper method for checking if the editor contains a token with a given value.
   * Will search all lines of the editor looking for a token with the given name and value.
   * @param   tokenType   The type of token.
   * @param   tokenValue  The value to search for (case-insensitive).
   * @returns Returns the token if found, null otherwise.
   */
  public findTokenWithValue(
    tokenType: string,
    tokenValue: string,
  ): IToken | null {
    return this.findToken(
      (tok: IToken) =>
        tok.type === tokenType &&
        tok.value.toLowerCase() === tokenValue.toLowerCase(),
    );
  }

  /**
   * Filters all of the current tokens in the editor.
   * @parma {String|Function} test   If a string is provided, then the tokens will be filtered by token type.
   *                                 If a function is provided, it will be used to test for a match. The function
   *                                 is called with a single `token` parameter. Expected to return true if token is a match.
   * @returns The matching tokens.
   */
  public filterTokens(test: string): IToken[] {
    let allTokens = new Array<IToken>();
    const rowCount = this.editor.session.getLength();
    for (let i = 0; i <= rowCount; i++) {
      const lineTokens = this.editor.session.getTokens(i) as IToken[];
      allTokens = allTokens.concat(lineTokens);
    }
    return typeof test === 'string'
      ? allTokens.filter((tok) => tok.type === test)
      : allTokens.filter(test);
  }

  public getOptionsForKeyword(keywordToken: string) {
    return this.actionOptionsMap[keywordToken.toLowerCase()];
  }

  /**
   * Gets the current action token from the editor. Examples of action tokens are SELECT, INSERT, etc.
   * @returns Returns the current action token or null if not found.
   */
  public getActionToken(): IToken | null {
    const actionTokenSet = new Set(Object.keys(this.actionOptionsMap));
    return this.findToken(
      (tok) =>
        tok.type === 'keyword' && actionTokenSet.has(tok.value.toLowerCase()),
    );
  }

  /**
   * Checks the list of tokens in the editor to see if it contains an action (e.g. SELECT, INSERT, etc.).
   */
  public containsActionToken(): boolean {
    return !!this.getActionToken();
  }

  /**
   * Fetches all the tokens upto and including the given row. E.g. `getTokensUpToRow(2)` will return tokens
   * from row 0, row 1, and row 2.
   * @param   row     The row index.
   * @returns Returns an array of tokens from each row.
   */
  public getTokensUpToRow(row: number): IToken[] {
    let allPriorTokens = new Array<IToken>();
    for (let i = 0; i <= row; i++) {
      const lineTokens = this.editor.session.getTokens(i);
      allPriorTokens = allPriorTokens.concat(lineTokens);
    }
    return allPriorTokens;
  }

  public getPreviousToken(
    previousTokens: IToken[],
    currentToken: IToken,
  ): IToken | null {
    if (!previousTokens || previousTokens.length === 0) {
      return null;
    }
    const currentIndex = previousTokens.indexOf(currentToken);
    if (currentIndex > 0) {
      return previousTokens[currentIndex - 1];
    }
    return null;
  }

  public getPreviousNonTextToken(
    previousTokens: IToken[],
    currentToken: IToken,
  ): IToken | null {
    let prev: IToken | null = currentToken;
    while ((prev = this.getPreviousToken(previousTokens, prev)) !== null) {
      if (prev.type !== 'text' && prev.type !== 'empty') {
        return prev;
      }
    }
    return null;
  }

  /**
   * Helper method for getting the value of a token from any line in the editor.
   * @param   tokenName  The name of the token to search for.
   * @returns Returns the value of the token or null if not found.
   */
  private getTokenValue(tokenName: string) {
    const token = this.findToken(tokenName);
    return token ? token.value : null;
  }
}
