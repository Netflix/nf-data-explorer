import HttpStatusError from '@/model/errors/HttpStatusError';

export default class ClusterNotFoundError extends HttpStatusError {
  constructor(clusterName: string, region: string, env: string) {
    super(
      404,
      'Cluster Not Found',
      `Could not find cluster: ${clusterName}.${region}.${env}`,
      `Cluster ${clusterName} (in region ${region} and env ${env}) could not be found in the list
      of discovered clusters.
      Please make sure you have selected the correct region for your cluster. Additionally,
      if the cluster was recently added, you may have to wait until the
      connection list is refreshed.`,
    );
  }
}
