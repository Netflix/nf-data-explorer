import { t } from '@/i18n';
import HttpStatusError from '@/model/errors/HttpStatusError';
import { IClusterDefinition } from '@/typings/typings';

export default class ClusterNotAuthorizedError extends HttpStatusError {
  constructor(username: string, cluster: IClusterDefinition) {
    const name = cluster.name.toLowerCase();
    super(
      403,
      'User does not have access to cluster',
      `User ${username} does not have access to cluster ${name}`,
      t('errors.clusterNotAuthorizedError.remediation', {
        clusterName: escape(name),
        clusterEnv: escape(cluster.env),
        datastoreType: escape(cluster.datastoreType),
      }),
    );
  }
}
