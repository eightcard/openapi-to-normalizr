import { Map, fromJS } from 'immutable';
import isUndefined from 'lodash/isUndefined';

const initialState = Map();

function isOpenApiAction(meta) {
  return meta && meta.openApi;
}

function getNewEntities(action) {
  return isOpenApiAction(action.meta) && action.payload && action.payload.entities;
}

/**
 * immutable.js based entities reducer
 */
class EntitiesReducer {
  constructor(Models = {}, additionalReducer = (state) => state) {
    this.Models = Models;
    this.additionalReducer = additionalReducer;
    this.reduce = this.reduce.bind(this);
  }

  reduce(state = initialState, action = {}) {
    const newEntities = getNewEntities(action);
    if (newEntities) {
      state = this._mergeEntities(state, newEntities);
    }
    return isOpenApiAction(action.meta) ? this.additionalReducer(state, action) : state;
  }

  _mergeEntities(state, newEntities) {
    return state.update((oldEntities) => {
      const modeledEntities = fromJS(newEntities).map((entities, modelName) => {
        return entities.map((entity) => this._instantiate(entity, modelName));
      });
      return oldEntities.mergeDeepWith(merger, modeledEntities);
    });
  }

  _instantiate(entity, modelName) {
    return this.Models[modelName] ? new this.Models[modelName](entity) : entity;
  }
}

const merger = (prev, next) => isUndefined(next) ? prev : next;

export function createReducer(Models, additionalReducer) {
  const reducer = new EntitiesReducer(Models, additionalReducer);
  return reducer.reduce;
}
