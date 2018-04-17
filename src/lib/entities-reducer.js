import { Map, fromJS } from 'immutable';

function isOpenApiAction(meta) {
  return meta && meta.openApi;
}

function getNewEntities(action) {
  return isOpenApiAction(action.meta) && action.payload && action.payload.entities;
}

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
      state = this._mergeEntities(state, newEntities);
    }
    return isOpenApiAction(action.meta) ? this.additionalReducer(state, action) : state;
  }

  _mergeEntities(state, newEntities) {
    return state.update((oldEntities) => {
      const modeledEntities = fromJS(newEntities).map((entities, modelName) => {
        return entities.map((entity) => this._instantiate(entity, modelName));
      });
      return oldEntities.mergeDeep(modeledEntities);
    });
  }

  _instantiate(entity, modelName) {
    return this.Models[modelName] ? new this.Models[modelName](entity) : entity;
  }
}

export function createReducer(Models, {initialState, additionalReducer} = {}) {
  const reducer = new EntitiesReducer(Models, initialState, additionalReducer);
  return reducer.reduce;
}
