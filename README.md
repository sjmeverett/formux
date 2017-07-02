# formux

Makes constructing forms in a React/Redux application easier.

## Usage

Install:

    $ yarn add formux

Define your components:

```js
import { Form, reduxField } from 'formux';

// define a reusable input component
// automatically adds the 'has-error' class if there is a validation error
const Input = reduxField()(
  (props) => <input type='text' value={props.value} onChange={props.onChange} className={props.valid ? '' : 'has-error'} />
);

// make some validators
function required(value) {
  return value === ''
    ? ['required']
    : [];
}

function isNumber(value) {
  return /^[0-9]+$/.test(value) === false
    ? ['must be a number']
    : [];
}

// make a form
// wire up onValidSubmit which only gets called if the form is valid
const Page = (
  <div>
    ...
    <Form path='person' onValidSubmit={addPerson}>
      <Input name='name' validator={required} />
      <Input name='age' validator={isNumber} />
      <button type='submit'>Submit</button>
    </Form>
  </div>
);
```

You also need to install the reducer, e.g.:

```js
import { reducer } from 'formux';
import { combineReducers } from 'redux';

const rootReducer = combineReducers({
  ...
  forms: reducer
});
```
