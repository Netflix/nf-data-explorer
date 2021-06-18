import { IRegionInfo } from '@/typings/typings';

export const sampleDatastore = 'cassandra';
export const sampleClusterName = 'cluster_a';
export const availability = [
  { env: 'test', region: 'us-east-1' },
  { env: 'test', region: 'eu-west-1' },
  { env: 'prod', region: 'eu-west-1' },
] as IRegionInfo[];
