/* eslint-disable no-console */
// tslint:disable:no-console
const DEFAULT = 'Base';
const CUSTOM = 'Nflx';

/**
 * Provides a mechanism for dynamically loading a service class. The class to be loaded must be the default
 * export from the file.
 * @param classDir The directory containing the class to load. Assumed to be relative to the root and
 *                 should not contain a leading slash (e.g. `user/providers`).
 * @param className The name of the class to load (e.g. `UserServiceProvider`).
 */
export async function loadServiceClass<T>(
  classDir: string,
  className: string,
): Promise<new () => T> {
  console.log('loading class...');
  let classObj: any;
  try {
    classObj = await import(
      /* webpackChunkName: 'dynamic-services' */ `../services/${classDir}/${CUSTOM}${className}`
    );
  } catch (err) {
    console.log(err.message);
    try {
      classObj = await import(
        /* webpackChunkName: 'base-services' */ `../services/${classDir}/${DEFAULT}${className}`
      );
    } catch (err) {
      console.log(err.message);
      console.error(`Failed to load class ${className} in dir ${classDir}`);
    }
  }
  return classObj.default;
}
