import actions, { KeyValidationResult } from './actions';
import * as Validator from 'extensible-validator';
import * as _ from 'lodash';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { contextProvider } from 'react-context-helpers';
import { connect, ComponentDecorator } from 'react-redux';


export interface FormProps {
  path: string;
  validationMap?: Validator.KeyValidation;
  onValidSubmit?: (model?: any) => any;
  className?: string;
};

export interface FormStateProps {
  model: any;
};

export interface FormContext {
  path: string;
  validationMap: Validator.KeyValidation;
  model: any;
};

export interface FormDispatchProps {
  updateValidation(path: string, value: KeyValidationResult): void
};


/**
 * Connect a form to its model and actions.
 */
const connectForm = connect<FormStateProps, FormDispatchProps, FormProps>(
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
    updateValidation: actions.updateValidation
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
    validationMap={},
    children,
    updateValidation,
    ...contextProps
  } = props;

  // handle form submit
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const result: Validator.ValidationResult = [];
    e.preventDefault();

    // iterate over the validator map
    for (const key in validationMap) {
      // validate the current key
      const keyResult = validationMap[key].validate(props.model[key], props.model);

      // save the error(s) if there are any
      result.push(...keyResult);
    }

    if (result.length === 0) {
      // blank the validation state if there were no errors
      updateValidation(props.path, {});

      // call the valid submit handler
      onValidSubmit(props.model);

    } else {
      // group the validation errors by path
      const groups = _.groupBy(result, (err) => err.path);

      // keep only the messages
      const messages = _.mapValues(
        groups,
        (group) => group.map((err) => err.message)
      );

      // update the validation state
      updateValidation(props.path, messages);
    }
  };

  return (
    <form className={props.className} onSubmit={onSubmit}>
      <FormContextProvider validationMap={validationMap || {}} {...contextProps}>
        {children}
      </FormContextProvider>
    </form>
  );
});


