/**
 * Attempts to load a class dynamically at runtime. Class must be the default export from the given TS module.
 * @param pathToClass Expected to be the string path to the class. e.g. '@/services/MyService'.
 */
export async function loadClass<T>(pathToClass: string): Promise<T> {
  let Class: T;
  try {
    Class = (await import(pathToClass)).default;
  } catch (err) {
    throw new Error(
      `Could not load class. Expected to find class: ${pathToClass}.ts. Failed with: ${err.message}`,
    );
  }
  return Class;
}
