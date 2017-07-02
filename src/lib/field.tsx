import actions from './actions';
import { FormContext, FormContextTypes, formContextTypes, FormDispatchProps } from './form';
import { ValueValidator } from './validation';
import * as _ from 'lodash';
import * as React from 'react';
import { contextProvider, contextToProps } from 'react-context-helpers';
import { connect, ComponentDecorator } from 'react-redux';


export interface FieldProps {
  name: string;
  validator?: ValueValidator;
};

export interface MergedFieldProps extends FieldProps, FormContextTypes {
};

export interface FieldStateProps {
  value: any;
  errors: string[];
};

export interface DecoratedFieldProps extends FieldStateProps {
  valid: boolean;
  onChange(e: React.ChangeEvent<any>): any;
};

export interface ConnectedFieldProps extends MergedFieldProps, FieldStateProps, FormDispatchProps {
};

const formActions = {
  update: actions.update,
  updateValidation: actions.updateValidation,
  updateValidationKey: actions.updateValidationKey
};


function connectField<TProps>() {
  return connect<FieldStateProps, FormDispatchProps, MergedFieldProps & TProps>(
    (state, ownProps) => {
      const value = _.get<any, any>(state, ownProps.formContext.path + '.' + ownProps.name);
      const errors = _.get<any, string[]>(state, ownProps.formContext.path + '._validation.' + ownProps.name) || [];
      return {value, errors};
    },
    formActions
  );
}


function consumeFormContext<TProps>() {
  return contextToProps<FormContextTypes, FieldProps & TProps>(formContextTypes);
}


function wrapField<TProps>(
    Field: React.ComponentClass<DecoratedFieldProps & TProps> | React.StatelessComponent<DecoratedFieldProps & TProps>
  ): React.StatelessComponent<ConnectedFieldProps & TProps> {
  
  return (props: ConnectedFieldProps & TProps) => {
    const {
      name, validator,
      formContext,
      update, updateValidation, updateValidationKey,
      ...ownProps
    } = props as ConnectedFieldProps;

    if (validator) {
      formContext.validatorMap[name] = validator;
    }

    return (
      <Field {...ownProps}
        valid={props.errors.length === 0}
        onChange={(e) => {
          update(formContext.path, name, e.target.value);

          if (formContext.validator) {
            const result = formContext.validator.validateKey(name, e.target.value, formContext.model);
            updateValidationKey(formContext.path, name, result);
          }

          if (validator) {
            const result = validator(e.target.value, formContext.model);
            updateValidationKey(formContext.path, name, result);
          }
        }} />
    );
  };
}


export function reduxField<TProps={}>(
    Field: React.ComponentClass<DecoratedFieldProps & TProps> | React.StatelessComponent<DecoratedFieldProps & TProps>
  ) {

  const WrappedField = wrapField(Field);
  const ConnectedField = connectField<TProps>()(WrappedField);
  return consumeFormContext<TProps>()(ConnectedField);
};
