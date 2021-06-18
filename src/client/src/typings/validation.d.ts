export interface IValidationResult {
  isValid: boolean;
  message: string | undefined;
}

export interface IMultiValidationResult {
  isValid: boolean;
  messages: string[];
}
