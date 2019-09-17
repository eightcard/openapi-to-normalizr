/* eslint-disable no-console */
import _ from 'lodash';
import { Map } from 'immutable';
import { beforeSend, camelKeys, snakeKeys } from './helper';

// 自動生成ファイル
import rawSpec from '../tmp/sample_api';
import * as Models from '../tmp/models';
import * as ActionTypes from '../tmp/action_types/sample';
const createEntitiesAction = ActionTypes.createOpenApiAction;

import { applyMiddleware, createStore } from 'redux';
import createOpenApiMiddleware from '../../src/lib/redux-open-api';
import { createReducer as createEntitiesReducer } from '../../src/lib/entities-reducer';

// Store作成
function additionalReducer(state = Map(), action = {}) {
  console.log(action.type);
  switch (action.type) {
    case ActionTypes.DELETE_PETS__ID_:
      const id = action.meta.requestPayload.id;
      return ['Dog', 'Cat'].reduce((acc, key) => acc.removeIn([key, id.toString()]), state);
    default:
      return state;
  }
}

const httpOption = {
  requestInterceptor: beforeSend,
  responseInterceptor: (res) => {
    res.body = camelKeys(res.body);
    return res;
  },
};
const payloadCreator = (payload) => snakeKeys(payload);

createOpenApiMiddleware(rawSpec, httpOption).then((middleware) => {
  const store = createStore(
    createEntitiesReducer(Models, { additionalReducer }),
    applyMiddleware(middleware),
  );

  const outputArea = document.querySelector('#output-area');
  store.subscribe(() => {
    const state = store.getState();
    const pre = document.createElement('pre');
    pre.innerText = JSON.stringify(state.toJS(), null, 2);
    pre.style.backgroundColor = 'lightgray';
    outputArea.prepend(pre);
    outputArea.prepend(document.createElement('hr'));
  });

  // View作成
  _(ActionTypes)
    .filter(_.isString)
    .each((actionType) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.innerText = actionType;
      button.onclick = function onclick() {
        const params = JSON.parse(this.nextElementSibling.value || '{}');
        try {
          store
            .dispatch(createEntitiesAction(actionType, payloadCreator)(params))
            .then((ret) => console.log('after execute', ret));
        } catch (e) {
          console.log(e);
        }
      };
      button.style.width = '150px';
      const input = document.createElement('input');
      li.appendChild(button);
      li.appendChild(input);
      document.querySelector('#button-list').appendChild(li);
    });
});
