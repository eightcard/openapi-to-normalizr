"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shouldSkipPreviousRequestMetaCreator = exports.resetMetaCreator = exports.normalizr = exports.immutable = exports.default = exports.createOpenApiMiddleware = exports.createEntitiesReducer = exports.HttpClient = void 0;

var _reduxOpenApi = _interopRequireWildcard(require("./redux-open-api"));

var _entitiesReducer = require("./entities-reducer");

var _immutable = _interopRequireWildcard(require("immutable"));

var _normalizr = _interopRequireWildcard(require("normalizr"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var immutable = _immutable;
exports.immutable = immutable;
var normalizr = _normalizr;
exports.normalizr = normalizr;
var createOpenApiMiddleware = _reduxOpenApi.default;
exports.createOpenApiMiddleware = createOpenApiMiddleware;
var createEntitiesReducer = _entitiesReducer.createReducer;
exports.createEntitiesReducer = createEntitiesReducer;
var resetMetaCreator = _entitiesReducer.resetMetaCreator;
exports.resetMetaCreator = resetMetaCreator;
var shouldSkipPreviousRequestMetaCreator = _entitiesReducer.shouldSkipPreviousRequestMetaCreator;
exports.shouldSkipPreviousRequestMetaCreator = shouldSkipPreviousRequestMetaCreator;
var HttpClient = _reduxOpenApi.HttpClient;
exports.HttpClient = HttpClient;
var _default = {
  createEntitiesReducer: createEntitiesReducer,
  createOpenApiMiddleware: createOpenApiMiddleware,
  immutable: immutable,
  normalizr: normalizr,
  HttpClient: HttpClient
};
exports.default = _default;