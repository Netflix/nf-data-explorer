import { getClient } from '@/services/BaseService';
import { NotificationType } from '@/typings/notifications';
import { IAppEnvironments } from '@/typings/store';
import { notify } from '@/utils/message-utils';

export async function getDatastoreTypes(): Promise<string[]> {
  const result = await getClient().get('/REST/datastores/types');
  return result.data;
}

export async function getAvailableEnvironments(): Promise<IAppEnvironments> {
  const result = await getClient().get('/REST/env/regions');
  return result.data;
}

export async function changeRegion(
  datastoreType: string,
  cluster: string,
  env: string,
  region: string,
): Promise<void> {
  const result = await getClient().post(`/REST/env/regions/${env}-${region}`, {
    datastoreType,
    cluster,
  });

  if (result.status === 200) {
    window.location.replace(result.headers.location);
  } else {
    notify(NotificationType.Error, 'Failed to switch environments', '');
  }
}

export async function changeLanguage(language: string): Promise<any> {
  const result = await getClient().post('/REST/i18n', {
    language,
  });
  return result.data;
}
