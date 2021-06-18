import setupLogger from '@/config/logger';
import { IEntityAccessControlProvider } from '@/services/entity-acls/providers/EntityAccessControlProvider';
import { EntityType } from '@/typings/enums';

const logger = setupLogger(module);

export default class EntityAccessControlService {
  constructor(readonly provider: IEntityAccessControlProvider) {}

  public async getEntityOwners(
    clusterName: string,
    env: string,
    type: EntityType,
    entityName: string,
  ): Promise<string[]> {
    return this.provider.getEntityOwners(clusterName, env, type, entityName);
  }

  public async setEntityOwners(
    clusterName: string,
    env: string,
    type: EntityType,
    entityName: string,
    owners: string[],
  ): Promise<void> {
    try {
      const res = await this.provider.setEntityOwners(
        clusterName,
        env,
        type,
        entityName,
        owners,
      );
      logger.info(
        `Updated entity ownership on cluster ${clusterName}.${env} for
        ${EntityType[type]} "${entityName}" with owners: ${JSON.stringify(
          owners,
        )}.`,
      );
      return res;
    } catch (err) {
      logger.error(
        `Failed to update entity ownership on cluster ${clusterName}.${env} for
      ${EntityType[type]} "${entityName}" with owners: ${JSON.stringify(
          owners,
        )}.`,
        err,
      );
      throw err;
    }
  }
}
