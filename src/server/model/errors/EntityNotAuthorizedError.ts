import { t } from '@/i18n';
import HttpStatusError from '@/model/errors/HttpStatusError';
import { EntityType } from '@/typings/enums';
import { IClusterDefinition } from '@/typings/typings';

export default class EntityNotAuthorizedError extends HttpStatusError {
  constructor(
    cluster: IClusterDefinition,
    entityType: EntityType,
    entityName: string,
  ) {
    const { env, name: clusterName, region, datastoreType } = cluster;
    const entityTypeString: string = EntityType[entityType].toLowerCase();
    super(
      403,
      t('errors.entityNotAuthorizedError.title', {
        entityType: entityTypeString,
        entityName,
      }),
      t('errors.entityNotAuthorizedError.message', {
        entityType: entityTypeString,
        entityName,
      }),
      t('errors.entityNotAuthorizedError.remediation', {
        entityType: escape(entityTypeString),
        entityName: escape(entityName),
        datastoreType: escape(datastoreType),
        clusterName: escape(clusterName.toLowerCase()),
        clusterRegion: escape(region),
        clusterEnv: escape(env),
        entityPath:
          entityType === EntityType.KEYSPACE
            ? `keyspaces/${region}/${entityName}`
            : '',
      }),
    );
  }
}
