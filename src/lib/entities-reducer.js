import { Map, fromJS } from 'immutable';
import isUndefined from 'lodash/isUndefined';

function getNewEntities(action) {
  return action.payload && action.payload.entities;
}

export function resetMetaCreator() {
  return {
    reset: true,
  };
}

/**
 * immutable.js based entities reducer
 */
class EntitiesReducer {
  constructor(Models = {}, initialState = Map(), additionalReducer = (state) => state) {
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

  _mergeEntities(state, newEntities, {meta} = {}) {
    return state.update((oldEntities) => {
      const modeledEntities = fromJS(newEntities).map((entities, modelName) => {
        return entities.map((entity) => this._instantiate(entity, modelName));
      });
      if (meta && meta.reset) {
        return oldEntities.mergeDeep(modeledEntities);
      } else {
        return oldEntities.mergeDeepWith(merger, modeledEntities);
      }
    });
  }

  _instantiate(entity, modelName) {
    return this.Models[modelName] ? new this.Models[modelName](entity) : entity;
  }
}

const merger = (prev, next) => isUndefined(next) ? prev : next;

export function createReducer(Models, {initialState, additionalReducer} = {}) {
  const reducer = new EntitiesReducer(Models, initialState, additionalReducer);
  return reducer.reduce;
}
