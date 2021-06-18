import HttpStatusError from '@/model/errors/HttpStatusError';

export default class FeatureNotImplementedError extends HttpStatusError {
  constructor(featureName: string) {
    super(
      501,
      'Feature Not Implemented',
      `The "${featureName}" feature is not implemented.`,
      'The requested feature is not implemented. You may need to update the app configuration or write some custom code to implement this feature. Please check the logs for more details.',
    );
  }
}
