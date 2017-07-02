import * as React from 'react';
import * as _ from 'lodash';
import test from 'ava';
import { reducer, actions, Form, reduxField, Validator, ValidationErrors } from '../lib';
import { createStore, Action } from 'redux';
import { Provider } from 'react-redux';
import { shallow, mount } from 'enzyme';

require('jsdom-global')();

const dummyStore = createStore((action, state) => state);

test('update reducer', (t) => {
  const store = createStore(reducer, {
    nested: {
      field: 'value'
    }
  });

  store.dispatch({
    type: actions.types.update,
    path: 'nested',
    key: 'field',
    value: 'updated'
  });

  t.deepEqual(store.getState(), {
    nested: {
      field: 'updated'
    }
  });
});


test('update creator', (t) => {
  const action = actions.update('nested', 'field', 'updated');

  t.deepEqual(action, {
    type: actions.types.update,
    path: 'nested',
    key: 'field',
    value: 'updated'
  });
});


test('clear reducer', (t) => {
  const store = createStore(reducer, {
    theform: {
      field1: 'hello',
      field2: 'world',
      _validation: {
        field1: {
          valid: true
        }
      }
    }
  });

  store.dispatch(actions.clear('theform') as Action);

  t.deepEqual(store.getState(), {
    theform: {
      field1: '',
      field2: '',
      _validation: {}
    }
  });
});


test('updateValidation', (t) => {
  const store = createStore(reducer, {
    theform: {
      field1: 'hello',
      field2: 'world',
      _validation: {
        field1: []
      }
    }
  });

  store.dispatch(actions.updateValidation('theform', {field2: []}) as Action);

  t.deepEqual(store.getState(), {
    theform: {
      field1: 'hello',
      field2: 'world',
      _validation: {
        field2: []
      }
    }
  });
});


test('updateValidationKey', (t) => {
  const store = createStore(reducer, {
    theform: {
      field1: 'hello',
      field2: 'world',
      _validation: {
        field1: []
      }
    }
  });

  store.dispatch(actions.updateValidationKey('theform', 'field2', []) as Action);

  t.deepEqual(store.getState(), {
    theform: {
      field1: 'hello',
      field2: 'world',
      _validation: {
        field1: [],
        field2: []
      }
    }
  });
});

interface Model {
  input: string;
}

test('reduxForm', (t) => {
  const store = createStore(reducer, {
    model: {
      input: 'value'
    }
  });

  const Input = reduxField((props) => <input type='text' value={props.value} onChange={props.onChange} />);
  
  const wrapper = mount(
    <Provider store={store}>
      <Form path='model'>
        <Input name='input' />
      </Form>
    </Provider>
  );

  const input = wrapper.find('input');
  t.is(input.prop('value'), 'value');
  input.simulate('change', {target: {value: 'fish'}});
  t.is(input.prop('value'), 'fish');
});


test('reduxForm validation', (t) => {
  const store = createStore(reducer, {
    model: {
      input: ''
    }
  });

  const validator = makeValidator({
    input: (value) => /^[0-9]+$/.test(value)
      ? []
      : ['must be a number']
  });

  const Input = reduxField(
    (props) => <input type='text' value={props.value} onChange={props.onChange}
                  data-valid={props.valid} data-errors={props.errors} />
  );
  
  const wrapper = mount(
    <Provider store={store}>
      <Form path='model' validator={validator}>
        <Input name='input' />
      </Form>
    </Provider>
  );

  const input = wrapper.find('input');
  input.simulate('change', {target: {value: 'abc'}});
  t.is(input.prop('data-valid'), false);
  t.deepEqual(input.prop('data-errors'), ['must be a number']);
});


test('reduxForm onValidSubmit', (t) => {
  const store = createStore(reducer, {
    model: {
      input: ''
    }
  });

  const validator = makeValidator({
    input: (value) => /^[0-9]+$/.test(value)
      ? []
      : ['must be a number']
  });

  const Input = reduxField(
    (props) => <input type='text' value={props.value} onChange={props.onChange} />
  );

  let called = false;
  
  const wrapper = mount(
    <Provider store={store}>
      <Form path='model' validator={validator}
        onValidSubmit={(model) => {
          called = true;
          let {_validation, ..._model} = model;
          t.deepEqual<any>(_model, {input: '123'});
        }}>
        <Input name='input' />
      </Form>
    </Provider>
  );

  const input = wrapper.find('input');
  input.simulate('change', {target: {value: 'abc'}});
  
  const form = wrapper.find('form');
  form.simulate('submit');
  t.false(called);

  input.simulate('change', {target: {value: '123'}});
  form.simulate('submit');
  t.true(called);
});


test('validator on field', (t) => {
  const store = createStore(reducer, {
    model: {
      input: ''
    }
  });

  const Input = reduxField(
    (props) => <input type='text' value={props.value} onChange={props.onChange}
                  data-valid={props.valid} data-errors={props.errors} />
  );

  let called = false;
  
  const wrapper = mount(
    <Provider store={store}>
      <Form path='model' onValidSubmit={() => called = true}>
        <Input name='input'
          validator={
            (value) => /^[0-9]+$/.test(value)
              ? []
              : ['must be a number']
          } />
      </Form>
    </Provider>
  );

  const input = wrapper.find('input');
  input.simulate('change', {target: {value: 'abc'}});
  t.is(input.prop('data-valid'), false);
  t.deepEqual(input.prop('data-errors'), ['must be a number']);

  const form = wrapper.find('form');
  form.simulate('submit');
  t.false(called);

  input.simulate('change', {target: {value: '123'}});
  form.simulate('submit');
  t.true(called);
});



function makeValidator(rules: {[key: string]: (value: any) => string[]}): Validator {
  return {
    validateKey(path: string, value: any, model: { [key: string]: any; }): string[] {
      const validator = rules[path];
      if (!validator) console.log(`missing validator for ${path}`)
      return validator ? validator(value) : [];
    },

    validateAll(model: { [key: string]: any; }): ValidationErrors {
      const result: ValidationErrors = {};

      for (const key in rules) {
        const keyResult = this.validateKey(key, model[key], model);
        
        if (keyResult && keyResult.length) {
          result[key] = keyResult;
        }
      }

      return result;
    }
  }
}
