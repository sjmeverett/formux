import * as _ from 'lodash';
import actions, * as Actions from './actions';
import HandlerBuilder from 'handler-builder';


const reducerBuilder = new HandlerBuilder<string>(
  (state, action) => action.type,
  (state, action) => state
);


export const reducer = reducerBuilder.build({
  [actions.types.update](state, action: Actions.UpdateAction) {
    return set(`${action.path}.${action.key}`, state, action.value);
  },


  [actions.types.clear](state, action: Actions.ClearAction) {
    state = Object.assign({}, state);
    let model = _.get(state, action.path);

    for (let k in model) {
      if (k === '_validation') {
        model[k] = {};

      } else {
        model[k] = '';
      }
    }

    return state;
  },


  [actions.types.updateValidation](state, action: Actions.UpdateValidationAction) {
    return set(action.path + '._validation', state, action.errors);
  },


  [actions.types.updateValidationKey](state, action: Actions.UpdateValidationKeyAction) {
    return set(action.path + '._validation.' + action.key, state, action.errors);
  }
});



function set(path: string | string[], obj: {[key: string]: any} = {}, value: any): Object {
  if (!Array.isArray(path))
    path = path.split('.');

  const [base, ...rest] = path;

  return Object.assign({}, obj, {
    [base]: rest.length
      ? set(rest, obj[base], value)
      : value
  });
}
