import actions from './actions';
import { Validator, ValidatorMap, ValidationErrors } from './validation';
import * as _ from 'lodash';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { contextProvider, contextToProps } from 'react-context-helpers';
import { connect, ComponentDecorator } from 'react-redux';


export interface FormProps {
  path: string;
  validatorMap?: ValidatorMap;
  onValidSubmit?: (model?: any) => any;
  className?: string;
};

export interface FormStateProps {
  model: any;
};

export interface FormContext extends FormActions {
  path: string;
  validatorMap: ValidatorMap;
  model: any;
};

export interface FormActions {
  update(path: string, key: string, value: string): void;
  updateValidation(path: string, errors: ValidationErrors): void;
  updateValidationKey(path: string, key: string, errors: string[]): void;
};


/**
 * Connect a form to its model and actions.
 */
const connectForm = connect<FormStateProps, FormActions, FormProps>(
  (state, ownProps) => {
    const model = _.get(state, ownProps.path);

    if (typeof model !== 'object') {
      console.warn(`form path ${ownProps.path} is not an object`);
    }

    return {
      model,
    };
  },
  {
    update: actions.update,
    updateValidation: actions.updateValidation,
    updateValidationKey: actions.updateValidationKey
  }
);

/**
 * The form context provider copies its props into the `form` key on the context.
 */
const FormContextProvider = contextProvider<FormContext>('form');

/**
 * A redux form.
 */
export const Form = connectForm((props) => {
  const {
    className,
    onValidSubmit,
    validatorMap={},
    children,
    ...contextProps
  } = props;

  // handle form submit
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const result = {};
    e.preventDefault();

    // iterate over the validator map
    for (const key in props.validatorMap) {
      // validate the current key
      const keyResult = props.validatorMap[key](props.model[key], props.model);

      // save the error(s) if there are any
      if (keyResult && keyResult.length) {
        result[key] = keyResult;
      }
    }

    // update the form validation state
    props.updateValidation(props.path, result);
    
    // if there wasn't an error, call onValidSubmit handler
    if (Object.keys(result).length === 0) {
      onValidSubmit(props.model);
    }
  };

  return (
    <form className={props.className} onSubmit={onSubmit}>
      <FormContextProvider validatorMap={validatorMap || {}} {...contextProps}>
        {children}
      </FormContextProvider>
    </form>
  );
});


