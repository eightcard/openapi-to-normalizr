import createMiddleware from './redux-open-api';
import { createReducer } from './entities-reducer';

import * as _immutable from 'immutable';
import * as _normalizr from 'normalizr';
export const immutable = _immutable;
export const normalizr = _normalizr;
export const createOpenApiMiddleware = createMiddleware;
export const createEntitiesReducer = createReducer;

export default {
  createEntitiesReducer,
  createOpenApiMiddleware,
  immutable, normalizr,
};
