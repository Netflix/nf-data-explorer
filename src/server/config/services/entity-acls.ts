import EntityAccessControlCache from '@/services/entity-acls/EntityAccessControlCache';
import EntityAccessControlService from '@/services/entity-acls/EntityAccessControlService';
import { IEntityAccessControlProvider } from '@/services/entity-acls/providers/EntityAccessControlProvider';
import { IEntityAccessControlLoader } from '@/services/entity-acls/typings/entity-acls';
import { loadClass } from '@/utils/class-loader-utils';
import { Application } from 'express';
import { getConfig } from '../configuration';

const {
  ENTITY_ACCESS_CONTROL_LOADER,
  ENTITY_ACCESS_CONTROL_SERVICE_PROVIDER,
} = getConfig();

export async function setupEntityAccessControlCache(
  app: Application,
): Promise<EntityAccessControlCache> {
  if (!ENTITY_ACCESS_CONTROL_LOADER) {
    throw new Error(
      'ENTITY_ACCESS_CONTROL_LOADER not specified in configuration.',
    );
  }

  const EntityAccessControlLoaderClass = await loadClass<
    new (app: Application) => IEntityAccessControlLoader
  >(`@/services/entity-acls/providers/${ENTITY_ACCESS_CONTROL_LOADER}`);
  const loader = new EntityAccessControlLoaderClass(app);

  return new EntityAccessControlCache(loader);
}

export async function setupEntityAccessControlService(): Promise<
  EntityAccessControlService
> {
  if (!ENTITY_ACCESS_CONTROL_SERVICE_PROVIDER) {
    throw new Error(
      'ENTITY_ACCESS_CONTROL_SERVICE_PROVIDER not specified in configuration.',
    );
  }

  const EntityAccessControlServiceClass = await loadClass<
    new () => IEntityAccessControlProvider
  >(
    `@/services/entity-acls/providers/${ENTITY_ACCESS_CONTROL_SERVICE_PROVIDER}`,
  );
  const loader = new EntityAccessControlServiceClass();

  return new EntityAccessControlService(loader);
}
