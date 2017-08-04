import { reducer, actions, Form, reduxField } from '../lib';
import test from 'ava';
import { shallow, mount } from 'enzyme';
import * as Validator from 'extensible-validator';
import * as _ from 'lodash';
import * as React from 'react';
import { Provider } from 'react-redux';
import { createStore, Action } from 'redux';

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

test('Form', (t) => {
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

test('calls passed in onChange', (t) => {
  const store = createStore(reducer, {
    model: {
      input: 'value'
    }
  });

  const Input = reduxField((props) => <input type='text' value={props.value} onChange={props.onChange} />);
  let onChangeCalled = false;

  const wrapper = mount(
    <Provider store={store}>
      <Form path='model'>
        <Input name='input' onChange={() => onChangeCalled = true} />
      </Form>
    </Provider>
  );

  const input = wrapper.find('input');
  input.simulate('change', {target: {value: 'fish'}});
  t.is(input.prop('value'), 'fish');
  t.true(onChangeCalled);
});


test('Form validation', (t) => {
  const store = createStore(reducer, {
    model: {
      input: ''
    }
  });

  const Input = reduxField(
    (props) => <input type='text' value={props.value} onChange={props.onChange}
                  data-valid={props.valid} data-errors={props.errors} />
  );
  
  const wrapper = mount(
    <Provider store={store}>
      <Form path='model' validationMap={{input: new Validator.Number()}}>
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

  const Input = reduxField(
    (props) => <input type='text' value={props.value} onChange={props.onChange} />
  );

  let called = false;
  
  const wrapper = mount(
    <Provider store={store}>
      <Form path='model' validationMap={{input: new Validator.Number()}}
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
          validation={new Validator.Number()} />
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
