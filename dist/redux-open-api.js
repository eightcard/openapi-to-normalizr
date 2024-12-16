"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.HttpClient = void 0;
var _swaggerClient = _interopRequireDefault(require("swagger-client"));
var _normalizr = require("normalizr");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var NEED_REQUEST_BODY_REG = new RegExp('^(POST|PUT|PATCH)');
function getRequestBody(id, payload) {
  return payload && id.toUpperCase().match(NEED_REQUEST_BODY_REG) ? payload : null;
}
function isOpenApiAction(action) {
  return action && action.meta && action.meta.openApi;
}
function getShouldSkipPreviousRequest(action) {
  return Boolean(action && action.meta && action.meta.shouldSkipPreviousRequest);
}
var HttpClient = exports.HttpClient = _swaggerClient.default.http;

/**
 * { [key: action.type]: Date.valueOf() }
 */
var latestTimestampMap = {};
var _default = exports.default = function _default(spec, httpOptions) {
  return (0, _swaggerClient.default)({
    spec: spec
  }).then(function (_ref) {
    var apis = _ref.apis;
    var apiCache = {};
    var apiTags = Object.keys(apis);
    function findApi(operationId) {
      if (!apiCache[operationId]) {
        var tag = apiTags.find(function (key) {
          return apis[key][operationId];
        });
        if (!tag) {
          return function () {
            return Promise.reject("no api definition: ".concat(operationId));
          };
        }
        apiCache[operationId] = apis[tag][operationId];
      }
      return apiCache[operationId];
    }
    return function () {
      return function (next) {
        return function (action) {
          if (!isOpenApiAction(action)) {
            return next(action);
          }
          var _action$meta = action.meta,
            id = _action$meta.id,
            schema = _action$meta.schema;
          var api = findApi(id);
          var options = {};
          var requestBody = getRequestBody(id, action.payload);
          if (requestBody) {
            options.requestBody = requestBody; // for OAS v3
          }
          action.meta.requestPayload = action.payload;
          var timestamp = new Date().valueOf();
          var shouldSkipPreviousRequest = getShouldSkipPreviousRequest(action);
          if (shouldSkipPreviousRequest) {
            latestTimestampMap[action.type] = timestamp;
          }
          return api(action.payload, Object.assign({}, options, httpOptions)).then(function () {
            var response = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
            var shouldSkip = shouldSkipPreviousRequest && latestTimestampMap[action.type] !== timestamp;
            var useSchema = schema && (schema[response.status] || schema['default']);
            var payload = useSchema ? (0, _normalizr.normalize)(response.body, useSchema) : response.body;
            if (shouldSkip) {
              // eslint-disable-next-line callback-return
              next({
                type: "SKIPPED_".concat(action.type),
                meta: action.meta,
                payload: payload
              });
            } else {
              // eslint-disable-next-line callback-return
              next({
                type: action.type,
                meta: action.meta,
                payload: payload
              });
            }
            return response;
          }, function (error) {
            next({
              type: "ERROR_".concat(action.type),
              meta: action.meta,
              payload: error,
              error: true
            });
            return Promise.reject(error);
          });
        };
      };
    };
  });
};