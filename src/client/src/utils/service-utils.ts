import HttpStatusError from '@/models/errors/HttpStatusError';
import RequestCanceledError from '@/models/errors/RequestCanceledError';
import Axios, { AxiosError } from 'axios';

export function handleServiceError(err: AxiosError): Error {
  if (err.response) {
    const { data } = err.response;
    // ensure we have an HttpStatusError
    if (
      Object.prototype.hasOwnProperty.call(data, 'status') &&
      Object.prototype.hasOwnProperty.call(data, 'title') &&
      Object.prototype.hasOwnProperty.call(data, 'message') &&
      Object.prototype.hasOwnProperty.call(data, 'remediation')
    ) {
      const { status, title, message, remediation } = data;
      return new HttpStatusError(status, title, message, remediation);
    }
  } else if (Axios.isCancel(err)) {
    return new RequestCanceledError();
  }
  return new Error('Unexpected request error.');
}
