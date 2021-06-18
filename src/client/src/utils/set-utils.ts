export function intersection<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const intersecting = new Set<T>();
  for (const elem of setB) {
    if (setA.has(elem)) {
      intersecting.add(elem);
    }
  }
  return intersecting;
}

export function difference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const diff = new Set(setA);
  for (const elem of setB) {
    diff.delete(elem);
  }
  return diff;
}
