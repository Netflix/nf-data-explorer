import HttpStatusError from '@/model/errors/HttpStatusError';

export default class ClusterConnectionError extends HttpStatusError {
  constructor(clusterName: string, currentAppName: string) {
    super(
      503,
      'Unable to Connect to Cluster',
      `Could not connect to cluster: ${clusterName}`,
      `Unable to connect to ${clusterName}. Please ensure all server groups for cluster
            ${clusterName} permits security group access for this application ("${currentAppName}").`,
    );
  }
}
