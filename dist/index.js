"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shouldSkipPreviousRequestMetaCreator = exports.resetMetaCreator = exports.normalizr = exports.immutable = exports.default = exports.createOpenApiMiddleware = exports.createEntitiesReducer = exports.HttpClient = void 0;
var _reduxOpenApi = _interopRequireWildcard(require("./redux-open-api"));
var _entitiesReducer = require("./entities-reducer");
var _immutable = _interopRequireWildcard(require("immutable"));
var _normalizr = _interopRequireWildcard(require("normalizr"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != _typeof(e) && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
var immutable = exports.immutable = _immutable;
var normalizr = exports.normalizr = _normalizr;
var createOpenApiMiddleware = exports.createOpenApiMiddleware = _reduxOpenApi.default;
var createEntitiesReducer = exports.createEntitiesReducer = _entitiesReducer.createReducer;
var resetMetaCreator = exports.resetMetaCreator = _entitiesReducer.resetMetaCreator;
var shouldSkipPreviousRequestMetaCreator = exports.shouldSkipPreviousRequestMetaCreator = _entitiesReducer.shouldSkipPreviousRequestMetaCreator;
var HttpClient = exports.HttpClient = _reduxOpenApi.HttpClient;
var _default = exports.default = {
  createEntitiesReducer: createEntitiesReducer,
  createOpenApiMiddleware: createOpenApiMiddleware,
  immutable: immutable,
  normalizr: normalizr,
  HttpClient: HttpClient
};