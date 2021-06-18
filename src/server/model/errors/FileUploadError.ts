import { t } from '@/i18n';
import HttpStatusError from './HttpStatusError';

export interface IMulterError {
  code: string;
  field: string;
  message: string;
  name: string;
}

export default class FileUploadError extends HttpStatusError {
  constructor(e: IMulterError) {
    const title = 'Failed to upload file';
    let status: number;
    let message: string;
    let remediation: string;
    switch (e.code) {
      case 'LIMIT_FILE_SIZE':
        status = 400;
        message = 'File upload too large';
        remediation = t('errors.fileUploadError.tooLargeRemediation');
        break;
      default:
        status = 500;
        message = title;
        remediation = t('errors.fileUploadError.defaultRemediation');
    }
    super(status, title, message, remediation);
  }
}
