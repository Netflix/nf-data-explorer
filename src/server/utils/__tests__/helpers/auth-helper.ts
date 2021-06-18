import { getConfig } from '@/config/configuration';

const {
  REQUEST_HEADER_CLIENT_APP,
  REQUEST_HEADER_ACCESS_TOKEN,
  REQUEST_HEADER_EMAIL,
} = getConfig();

export const userHeaders = {
  [REQUEST_HEADER_CLIENT_APP]: 'nfdataexplorer2',
  [REQUEST_HEADER_ACCESS_TOKEN]: 'dummy.token',
  [REQUEST_HEADER_EMAIL]: 'jill@netflix.com',
};
