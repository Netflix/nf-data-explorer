import { t } from '@/i18n';
import HttpStatusError from './HttpStatusError';

export default class OperationNotSupportedInEnvError extends HttpStatusError {
  constructor(operation: string, env: string) {
    super(
      400,
      'Operation Not Supported in this Environment',
      `"${operation}" is not supported in environment ${env} `,
      t('errors.operationNotSupportedInEnvError.remediation', {
        env: escape(env),
      }),
    );
  }
}
