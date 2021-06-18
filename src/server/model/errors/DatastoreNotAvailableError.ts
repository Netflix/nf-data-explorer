import HttpStatusError from './HttpStatusError';

export default class DatastoreNotAvailableError extends HttpStatusError {
  constructor(datastoreType: string) {
    super(
      400,
      'Datastore not available',
      `Datastore type "${datastoreType}" is not available.`,
      'There are no clusters available for the requested datastore. Please check the list of available datastores by visiting the home page.',
    );
  }
}
