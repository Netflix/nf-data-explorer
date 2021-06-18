import i18n from '@/i18n';
import { Routes } from './router/routes';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

interface IDatastoreDef {
  name: string;
  description: string;
  routeName: string;
}

interface DatastoreDefWithImage extends IDatastoreDef {
  imagePath: string;
}

interface DatastoreDefWithIcon extends IDatastoreDef {
  faIcon: IconDefinition;
}

export type DatastoreDef = DatastoreDefWithIcon | DatastoreDefWithImage;

export function getDatastores() {
  return {
    cassandra: {
      name: 'Cassandra',
      description: i18n.t('datastores.cassandra.description'),
      imagePath: '/images/icon_cassandra.svg',
      routeName: Routes.CassandraClusters,
    },
    dynomite: {
      name: 'Dynomite',
      description: i18n.t('datastores.dynomite.description'),
      imagePath: '/images/icon_dynomite.png',
      routeName: Routes.DynomiteClusters,
    },
  } as { [datastoreType: string]: DatastoreDef };
}
