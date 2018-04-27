import Swagger from 'swagger-client';
import { normalize } from 'normalizr';

const NEED_REQUEST_BODY_REG = new RegExp('^(POST|PUT)');

function getRequestBody(id, payload) {
  return payload && id.toUpperCase().match(NEED_REQUEST_BODY_REG) ? payload : null;
}

function isOpenApiAction(action) {
  return action && action.meta && action.meta.openApi;
}

export default (spec, httpOptions) => {
  return Swagger({spec}).then(({apis}) => {
    const apiCache = {};
    const apiTags = Object.keys(apis);

    function findApi(operationId) {
      if (!apiCache[operationId]) {
        const tag = apiTags.find((key) => apis[key][operationId]);
        if (!tag) {
          return () => Promise.reject(`no api definition: ${operationId}`);
        }
        apiCache[operationId] = apis[tag][operationId];
      }
      return apiCache[operationId]
    }

    return () => next => action => {
      if (!isOpenApiAction(action)) {
        return next(action);
      }

      const {id, schema} = action.meta;
      const api = findApi(id);
      const options = {};
      const requestBody = getRequestBody(id, action.payload);
      if (requestBody) {
        options.requestBody = requestBody;  // for OAS v3
      }
      action.meta.requestPayload = action.payload;
      return api(action.payload, Object.assign({}, options, httpOptions)).then(
        (response = {}) => {
          const payload = schema ? normalize(response.body, schema[response.status] || schema['default']) : action.payload;
          next({
            type: action.type,
            meta: action.meta,
            payload,
          });
          return response;
        },
        (error) => {
          next({
            type: `ERROR_${action.type}`,
            meta: action.meta,
            payload: error,
            error: true,
          });
          return Promise.reject(error);
        }
      );
    }
  });
};
