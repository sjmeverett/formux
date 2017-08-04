import actions from './actions';
import { FormContext, FormDispatchProps } from './form';
import * as Validator from 'extensible-validator';
import * as _ from 'lodash';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { contextConsumer } from 'react-context-helpers';
import { connect, ComponentDecorator } from 'react-redux';


export interface FieldProps {
  name: string;
  validation?: Validator.Validator;
  onChange?: (e: React.ChangeEvent<any>, context?: FormContext) => void;
};

export interface FieldWithContextProps extends FieldProps, FormContext {
};

export interface FieldStateProps {
  value: any;
  errors: string[];
  valid: boolean;
};

export interface WrappedFieldProps extends FieldStateProps {
  onChange(e: React.ChangeEvent<any>): any;
};

interface ConnectedFieldProps extends FieldStateProps, FieldWithContextProps, FieldDispatchProps {
};

export interface FieldDispatchProps {
  update(path: string, key: string, value: string): void;
  updateValidationKey(path: string, key: string, errors: string[]): void;
};



/**
 * Connect a field to its value, errors and actions.
 */
function connectField<TProps>() {
  return connect<FieldStateProps, FieldDispatchProps, FieldWithContextProps & TProps>(
    (state, ownProps) => {
      const value = _.get<any, any>(state, ownProps.path + '.' + ownProps.name);
      const errors = _.get<any, string[]>(state, ownProps.path + '._validation.' + ownProps.name) || [];

      return {
        value,
        errors,
        valid: errors.length === 0
      };
    },
    {
      update: actions.update,
      updateValidationKey: actions.updateValidationKey
    }
  );
}

export function reduxField<TProps = {}>(
    Field: React.ComponentClass<WrappedFieldProps & TProps> | React.StatelessComponent<WrappedFieldProps & TProps>
  ) {
  
  // make a component that wraps the given component and connects to the
  // form state for value, errors, and actions
  const ConnectedField = connectField<TProps>()((props) => {
    const {
      name,
      validation,
      path,
      validationMap,
      model,
      update,
      updateValidationKey,
      onChange,
      ...fieldProps
    } = props as ConnectedFieldProps;

    // if there's a field validator, save it in the
    // validation map in the form context
    if (validation) {
      validationMap[name] = validation;
    }

    // when the field changes due to user input, this is called
    const _onChange = (e) => {
      // update the form state with the new input
      update(path, name, e.target.value);

      // check if there is a validator for this key
      const validator = validationMap[name];

      if (validator) {
        const validationContext = {
          path: name,
          model
        };

        // validate and retain only the messages
        const errors = validator.validate(e.target.value, validationContext)
          .map((err) => err.message);

        updateValidationKey(path, name, errors);
      }

      // call passed-in onChange if it's there
      onChange && onChange(e, {path, validationMap, model});
    };

    return <Field {...fieldProps} onChange={_onChange} />;
  });

  // wrap the above field to supply some props from context
  return contextConsumer<FormContext, FieldProps & TProps>('form')(ConnectedField);
};

