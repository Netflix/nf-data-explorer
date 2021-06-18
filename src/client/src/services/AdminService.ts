import { getClient } from './BaseService';

export async function getAdminStatus(refresh = false) {
  const result = await getClient().get(`/REST/admin/status?refresh=${refresh}`);
  return result.data;
}
