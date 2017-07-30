# formux

Makes constructing forms in a React/Redux application easier.

## Usage

Install:

    $ npm install --save formux

Define your components:

```js
import { Form, reduxField } from 'formux';
import * as Validator form 'extensible-validator';

// define a reusable input component
// this one automatically adds the 'has-error' class if there is a validation error
const Input = reduxField()(
  (props) => <input type='text' value={props.value} onChange={props.onChange} className={props.valid ? '' : 'has-error'} />
);

// make a form
// wire up onValidSubmit which only gets called if the form is valid
const Page = (
  <div>
    ...
    <Form path='person' onValidSubmit={addPerson}>
      <Input name='name' validator={new Validator.String().required()} />
      <Input name='age' validator={new Validator.Number().required()} />
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
