import HttpStatusError from '@/model/errors/HttpStatusError';

export default class ClusterAclsNotLoadedError extends HttpStatusError {
  constructor(clusterName: string) {
    super(
      403,
      `Access control information was not loaded for cluster ${clusterName}`,
      `Access control information was not loaded for cluster ${clusterName}`,
      `Cluster access control information is not available for cluster ${clusterName}. If this is a newly created
            cluster, you may need to wait for the ACL information to propagate.`,
    );
  }
}
