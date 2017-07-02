import actions from './actions';
import { Validator, ValidatorMap, ValidationErrors } from './validation';
import * as _ from 'lodash';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { contextProvider, contextToProps } from 'react-context-helpers';
import { connect, ComponentDecorator } from 'react-redux';

export interface FormContextProps {
  path: string;
  validator?: Validator;
  validatorMap?: ValidatorMap;
};

export interface FormProps extends FormContextProps {
  onValidSubmit?: (model?: any) => any;
  className?: string;
};

export interface FormStateProps {
  model: any;
};

export interface FormDispatchProps {
  update(path: string, key: string, value: string): void;
  updateValidation(path: string, errors: ValidationErrors): void;
  updateValidationKey(path: string, key: string, errors: string[]): void;
};

export interface FormMergedProps extends FormStateProps, FormDispatchProps {
};

export interface DecoratedFormProps extends FormProps, FormMergedProps {
};

export interface FormContext extends FormContextProps, FormStateProps {
};

export interface FormContextTypes {
  formContext: FormContext;
};

export const formContextTypes: PropTypes.ValidationMap<FormContextTypes> = {
  formContext: PropTypes.shape({
    path: PropTypes.string,
    model: PropTypes.object,
    validator: PropTypes.object,
    validatorMap: PropTypes.object
  })
};

const formActions = {
  update: actions.update,
  updateValidation: actions.updateValidation,
  updateValidationKey: actions.updateValidationKey
};


/**
 * Copy form props into context.
 */
const provideFormContext: ComponentDecorator<DecoratedFormProps, DecoratedFormProps>
  = contextProvider<FormContextTypes, DecoratedFormProps, DecoratedFormProps>(
    formContextTypes, 
    (props) => ({
      formContext: {
        path: props.path,
        model: props.model,
        validator: props.validator,
        validatorMap: props.validatorMap
      }
    })
  );


const FormWithContext = provideFormContext((props) => (
  <form className={props.className}
      onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        let result = {};

        if (props.validator) {
          result = props.validator.validateAll(props.model);
        }

        if (props.validatorMap) {
          for (const key in props.validatorMap) {
            const keyResult = props.validatorMap[key](props.model[key], props.model);

            if (keyResult && keyResult.length) {
              result[key] = keyResult;
            }
          }
        }

        props.updateValidation(props.path, result);
        
        if (Object.keys(result).length === 0) {
          props.onValidSubmit(props.model);
        }
      }}>
    {props.children}
  </form>
));


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
      validatorMap: ownProps.validatorMap || {}
    };
  },
  formActions
);

export const Form = connectForm(FormWithContext);
