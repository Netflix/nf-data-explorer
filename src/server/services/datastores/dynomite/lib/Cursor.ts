import { IClientCursor } from '@/services/datastores/dynomite/typings/dynomite';

export default class Cursor {
  public static fromClientCursor(cursorObj: IClientCursor): Cursor {
    const hostnames = Object.keys(cursorObj.cursors ?? {});
    const cursor = new Cursor(hostnames);
    hostnames.forEach((hostname) => {
      const cursorValue = cursorObj.cursors?.[hostname] ?? null;
      cursor.updateCursor(hostname, cursorValue);
    });
    return cursor;
  }

  private hostCursors: { [hostName: string]: number | null };

  constructor(hostnames: string[]) {
    this.hostCursors = {};
    hostnames.forEach((hostname) => {
      this.hostCursors[hostname] = null;
    });
  }

  public getCursor(hostname: string): number | null {
    return this.hostCursors[hostname];
  }

  public getFirstIncomplete(): { host: string; cursor: number | null } | null {
    let cursor = null;
    const hostnames = Object.keys(this.hostCursors);
    for (const hostname of hostnames) {
      const value = this.hostCursors[hostname];
      if (value !== 0) {
        cursor = { host: hostname, cursor: value };
        break;
      }
    }
    return cursor;
  }

  public updateCursor(host: string, cursorValue: number | null): void {
    this.hostCursors[host] = cursorValue;
  }

  public isComplete(): boolean {
    const isComplete = Object.keys(this.hostCursors).every((hostname) => {
      const cursorValue = this.hostCursors[hostname];
      return cursorValue === null || +cursorValue === 0;
    });
    return isComplete;
  }

  /**
   * Returns a client cursor suitable to return to the user.
   */
  public toClientCursor(): IClientCursor {
    const cursors = {} as {
      [hostName: string]: number;
    };
    Object.keys(this.hostCursors).forEach((hostname) => {
      const cursorValue = this.hostCursors[hostname];
      cursors[hostname] = cursorValue as number;
    });
    return { complete: this.isComplete(), cursors };
  }
}
