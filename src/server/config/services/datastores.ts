import setupLogger from '@/config/logger';
import { IDatastoreService } from '@/services/datastores/base/datastore';
import { loadClass } from '@/utils/class-loader-utils';

const logger = setupLogger(module);

async function loadDatastore(
  datastoreName: string,
): Promise<IDatastoreService<any>> {
  const DatastoreServiceClass = await loadClass<
    new () => IDatastoreService<any>
  >(`@/services/datastores/${datastoreName}`);
  return new DatastoreServiceClass();
}

/**
 * Setup our support for the various types of datastores.
 * @param supportedDatastores Array of supported datastore types.
 */
export async function setupDatastoreSupport(
  supportedDatastores: string[],
): Promise<IDatastoreService<any>[]> {
  const services = await Promise.all(
    supportedDatastores.map((datastoreName) => loadDatastore(datastoreName)),
  );
  logger.info('all datstores loaded');
  return services;
}
