import { Map, fromJS } from 'immutable';
import isUndefined from 'lodash/isUndefined';

function getNewEntities(action: { payload?: TODO }) {
  return action.payload && action.payload.entities;
}

export function resetMetaCreator() {
  return { reset: true } as const;
}

type State = Map<string, TODO>;

/**
 * immutable.js based entities reducer
 */
class EntitiesReducer {
  Models: TODO;

  initialState: State;

  additionalReducer: (state: State, action?: TODO) => TODO;

  constructor(
    Models = {},
    initialState: State = Map<string, TODO>(),
    additionalReducer = (state: State) => state,
  ) {
    this.Models = Models;
    this.initialState = initialState;
    this.additionalReducer = additionalReducer;
    this.reduce = this.reduce.bind(this);
  }

  reduce(state = this.initialState, action = {}) {
    const newEntities = getNewEntities(action);
    if (newEntities) {
      state = this._mergeEntities(state, newEntities, action);
    }
    return this.additionalReducer(state, action);
  }

  _mergeEntities(state: State, newEntities: State, { meta }: { meta?: TODO } = {}) {
    const reset = meta && meta.reset;
    return state.withMutations((state) => {
      // @ts-expect-error オブジェクト型は 'unknown' です。ts(2571)
      fromJS(newEntities).forEach((entities: TODO[], modelName: string) => {
        entities.forEach((entity, id) => {
          if (reset || !state.hasIn([modelName, id])) {
            state.setIn([modelName, id], this._instantiate(entity, modelName));
          } else {
            state.updateIn([modelName, id], (oldEntity) => {
              // @ts-expect-error オブジェクト型は 'unknown' です。ts(2571)
              return oldEntity.mergeDeepWith(merger, this._instantiate(entity, modelName));
            });
          }
        });
      });
    });
  }

  _instantiate(entity: TODO, modelName: string) {
    return this.Models[modelName] ? new this.Models[modelName](entity) : entity;
  }
}

const merger = (prev: TODO, next: TODO) => (isUndefined(next) ? prev : next);

export function createReducer(
  Models: TODO,
  { initialState, additionalReducer }: { initialState?: TODO; additionalReducer?: TODO } = {},
): TODO {
  const reducer = new EntitiesReducer(Models, initialState, additionalReducer);
  return reducer.reduce;
}
