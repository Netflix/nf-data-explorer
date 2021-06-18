import { t } from '@/i18n';
import HttpStatusError from '@/model/errors/HttpStatusError';

export default class CassandraAuthenticationError extends HttpStatusError {
  constructor(clusterName: string) {
    super(
      401,
      'Authentication Failure',
      `Cluster ${clusterName} requires authentication.`,
      t('errors.cassandraAuthenticationError.remediation'),
    );
  }
}
