import Swagger from 'swagger-client';
import { normalize } from 'normalizr';

const NEED_REQUEST_BODY_REG = new RegExp('^(POST|PUT|PATCH)');

function getRequestBody(id: string, payload?: TODO) {
  return payload && id.toUpperCase().match(NEED_REQUEST_BODY_REG) ? payload : null;
}

function isOpenApiAction(action: TODO) {
  return action && action.meta && action.meta.openApi;
}

function getShouldIgnorePreviousRequest(action: TODO) {
  return Boolean(action && action.meta && action.meta.shouldIgnorePreviousRequest);
}

export const HttpClient = Swagger.http;

/**
 * action.typeとDateをvalueOf()したもの
 */
const latestTimestampMap: Record<string, number> = {};

export default (spec: TODO, httpOptions?: Record<string, TODO>): TODO => {
  return Swagger({
    spec,
  }).then(({ apis }: { apis: TODO }) => {
    const apiCache: { [key: string]: TODO } = {};
    const apiTags = Object.keys(apis);

    function findApi(operationId: string) {
      if (!apiCache[operationId]) {
        const tag = apiTags.find((key) => apis[key][operationId]);
        if (!tag) {
          return () => Promise.reject(`no api definition: ${operationId}`);
        }
        apiCache[operationId] = apis[tag][operationId];
      }
      return apiCache[operationId];
    }

    return () => (next: (actionObj: TODO) => void) => (action: TODO) => {
      if (!isOpenApiAction(action)) {
        return next(action);
      }

      const { id, schema } = action.meta;
      const api = findApi(id);
      const options: { [key: string]: TODO } = {};
      const requestBody = getRequestBody(id, action.payload);
      if (requestBody) {
        options.requestBody = requestBody; // for OAS v3
      }
      action.meta.requestPayload = action.payload;

      const timestamp = new Date().valueOf();
      const shouldIgnorePreviousRequest = getShouldIgnorePreviousRequest(action);

      if (shouldIgnorePreviousRequest) {
        latestTimestampMap[action.type] = timestamp;
      }

      return api(action.payload, Object.assign({}, options, httpOptions)).then(
        (response: { [key: string]: TODO } = {}) => {
          // 並行してリクエストしているactionのうち、同じtypeのものの中で最後に呼び出されたactionかどうか
          // shouldIgnorePreviousRequest: trueの場合のみチェックする
          /* eslint-disable no-undefined */
          const isLatestRequest = shouldIgnorePreviousRequest
            ? latestTimestampMap[action.type] === timestamp
            : undefined;
          /* eslint-enable no-undefined */

          const useSchema = schema && (schema[response.status] || schema['default']);
          const payload = useSchema ? normalize(response.body, useSchema) : response.body;

          // shouldIgnorePreviousRequest: trueの場合は、最新のリクエストの場合のみnextを呼ぶ
          if (!shouldIgnorePreviousRequest || isLatestRequest) {
            // eslint-disable-next-line callback-return
            next({
              type: action.type,
              meta: action.meta,
              payload,
            });
          }
          return response;
        },
        (error: Error) => {
          next({
            type: `ERROR_${action.type}`,
            meta: action.meta,
            payload: error,
            error: true,
          });
          return Promise.reject(error);
        },
      );
    };
  });
};
