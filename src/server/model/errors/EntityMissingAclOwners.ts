import HttpStatusError from '@/model/errors/HttpStatusError';
import { EntityType } from '@/typings/enums';

export default class EntityMissingAclOwners extends HttpStatusError {
  constructor(clusterName: string, entityType: EntityType, entityName: string) {
    const entityTypeString = EntityType[entityType].toString();
    super(
      403,
      'Entity Access control information missing',
      `Entity Access control is required for ${entityTypeString} "${entityName}"
      on cluster ${clusterName}`,
      `Please specify ownership information for ${entityTypeString} "${entityName}".`,
    );
  }
}
