import HttpStatusError from '@/model/errors/HttpStatusError';

export default class FeatureDisabledError extends HttpStatusError {
  constructor(feature: string) {
    super(
      501,
      'Feature Disabled',
      `The "${feature}" feature is disabled.`,
      'The requested feature is not enabled. You may need to update the app configuration or write some custom code to implement this feature. Please check the logs for more details.',
    );
  }
}
