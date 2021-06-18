import HttpStatusError from '@/model/errors/HttpStatusError';

export default class NoClustersAvailableError extends HttpStatusError {
  constructor(datastoreType: string) {
    super(
      500,
      'No Clusters Available',
      `No clusters available for datastore ${datastoreType}`,
      'There are no clusters available for the selected datastore. The server may still be starting. Please try your request again.',
    );
  }
}
