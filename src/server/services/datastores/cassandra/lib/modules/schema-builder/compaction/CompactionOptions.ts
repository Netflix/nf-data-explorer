export default abstract class CompactionOptions {
  constructor(readonly strategy: string) {}

  public abstract buildSpecificOptions(): string[];

  public build() {
    const options = [
      ...this._buildCommonOptions(),
      ...this.buildSpecificOptions(),
    ];
    return `{ ${options.join(', ')} }`;
  }

  private _buildCommonOptions() {
    const options = [];
    options.push(`'class': '${this.strategy}'`);
    return options;
  }
}
