export class Version {
  constructor(readonly versionString: string) {}

  public isV2x(): boolean {
    return this.versionString.startsWith('2');
  }

  public isV3x(): boolean {
    return this.versionString.startsWith('3');
  }

  public toString(): string {
    return this.versionString;
  }
}

/**
 * Exposes some convenience properties for version checking.
 */
export const Versions = {
  v2x: new Version('2'),
  v3x: new Version('3'),
};
