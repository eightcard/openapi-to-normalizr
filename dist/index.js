"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.resetMetaCreator = exports.createEntitiesReducer = exports.createOpenApiMiddleware = exports.normalizr = exports.immutable = void 0;

var _reduxOpenApi = _interopRequireDefault(require("./redux-open-api"));

var _entitiesReducer = require("./entities-reducer");

var _immutable = _interopRequireWildcard(require("immutable"));

var _normalizr = _interopRequireWildcard(require("normalizr"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
var _default = {
  createEntitiesReducer: createEntitiesReducer,
  createOpenApiMiddleware: createOpenApiMiddleware,
  immutable: immutable,
  normalizr: normalizr
};
exports.default = _default;