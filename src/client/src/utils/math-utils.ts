export function movingAverage(
  data: number[],
  windowBefore: number,
  windowAfter = 0,
): number[] {
  const result = new Array<number>();
  for (let i = 0; i < data.length; i++) {
    const min = Math.max(0, i - windowBefore);
    const max = Math.min(data.length, i + windowAfter);
    const items = data.slice(min, max).filter((value) => value !== null);
    const count = items.length;
    result.push(
      count === 0 ? 0 : items.reduce((prev, curr) => prev + curr, 0) / count,
    );
  }
  return result;
}
