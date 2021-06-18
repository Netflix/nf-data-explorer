import HttpStatusError from '@/model/errors/HttpStatusError';

export default class ClusterMissingAclsError extends HttpStatusError {
  constructor(clusterName: string) {
    super(
      403,
      `Access control information not available for cluster ${clusterName}`,
      `Access control information not available for cluster ${clusterName}`,
      `Cluster access control information is not defined for cluster ${clusterName}. Please ensure this cluster
            has a designated owner.`,
    );
  }
}
