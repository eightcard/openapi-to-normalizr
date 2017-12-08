"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _isFunction = _interopRequireDefault(require("lodash/isFunction"));

var _reduxActions = require("redux-actions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _default(schemas) {
  return function (id) {
    var payloadCreator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (params) {
      return params;
    };
    var metaCreator = arguments.length > 2 ? arguments[2] : undefined;
    var meta = {
      openApi: true,
      id: id.toLowerCase(),
      schema: schemas[id.toLowerCase()]
    };

    var _metaCreator = function _metaCreator() {
      return meta;
    };

    if ((0, _isFunction.default)(metaCreator)) {
      _metaCreator = function _metaCreator() {
        return Object.assign(metaCreator.apply(void 0, arguments), meta);
      };
    }

    return (0, _reduxActions.createAction)(id, payloadCreator, _metaCreator);
  };
}