import { Action, buildCreator } from 'ts-actions';


export default buildCreator('redux-form', {
  update(path: string, key: string, value: string): UpdateAction {
    return {path, key, value};
  },

  clear(path: string): ClearAction {
    return {path};
  },

  updateValidation(path: string, errors: {[id: string]: string[]}): UpdateValidationAction {
    return {path, errors};
  },

  updateValidationKey(path: string, key: string, errors: string[]): UpdateValidationKeyAction {
    return {path, key, errors};
  }
});


export interface UpdateAction extends Action {
  path: string;
  key: string;
  value: string;
};


export interface ClearAction extends Action {
  path: string;
};


export interface UpdateValidationAction extends Action {
  path: string;
  errors: {[id: string]: string[]};
};


export interface UpdateValidationKeyAction extends Action {
  path: string;
  key: string;
  errors: string[];
};
