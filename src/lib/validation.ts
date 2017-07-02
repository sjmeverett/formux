
export interface ValidationErrors {
  [path: string]: string[];
};

export interface Validator {
  validateAll(model: { [key: string]: any; }): ValidationErrors;
  validateKey(path: string, value: any, model: { [key: string]: any; }): string[];
};

export interface ValueValidator {
  (value: any, model?: { [key: string]: any; }): string[];
};

export interface ValidatorMap {
  [key: string]: ValueValidator;
};
