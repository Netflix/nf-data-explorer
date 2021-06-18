import { t } from '@/i18n';
import HttpStatusError from '@/model/errors/HttpStatusError';

export default class CassandraNoHostAvailableError extends HttpStatusError {
  constructor(clusterName: string) {
    super(
      401,
      'No Hosts Available',
      `No hosts available for cluster ${clusterName}.`,
      t('errors.cassandraNoHostAvailableError.remediation'),
    );
  }
}
