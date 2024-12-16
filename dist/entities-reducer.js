"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createReducer = createReducer;
exports.resetMetaCreator = resetMetaCreator;
exports.shouldSkipPreviousRequestMetaCreator = shouldSkipPreviousRequestMetaCreator;
var _immutable = require("immutable");
var _isUndefined = _interopRequireDefault(require("lodash/isUndefined"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function getNewEntities(action) {
  return action.payload && action.payload.entities;
}
function resetMetaCreator() {
  return {
    reset: true
  };
}
function shouldSkipPreviousRequestMetaCreator() {
  return {
    shouldSkipPreviousRequest: true
  };
}
/**
 * immutable.js based entities reducer
 */
var EntitiesReducer = /*#__PURE__*/function () {
  function EntitiesReducer() {
    var Models = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var initialState = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : (0, _immutable.Map)();
    var additionalReducer = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function (state) {
      return state;
    };
    _classCallCheck(this, EntitiesReducer);
    this.Models = Models;
    this.initialState = initialState;
    this.additionalReducer = additionalReducer;
    this.reduce = this.reduce.bind(this);
  }
  return _createClass(EntitiesReducer, [{
    key: "reduce",
    value: function reduce() {
      var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.initialState;
      var action = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var newEntities = getNewEntities(action);
      if (newEntities) {
        state = this._mergeEntities(state, newEntities, action);
      }
      return this.additionalReducer(state, action);
    }
  }, {
    key: "_mergeEntities",
    value: function _mergeEntities(state, newEntities) {
      var _this = this;
      var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        meta = _ref.meta;
      var reset = meta && meta.reset;
      return state.withMutations(function (state) {
        // @ts-expect-error オブジェクト型は 'unknown' です。ts(2571)
        (0, _immutable.fromJS)(newEntities).forEach(function (entities, modelName) {
          entities.forEach(function (entity, id) {
            if (reset || !state.hasIn([modelName, id])) {
              state.setIn([modelName, id], _this._instantiate(entity, modelName));
            } else {
              state.updateIn([modelName, id], function (oldEntity) {
                // @ts-expect-error オブジェクト型は 'unknown' です。ts(2571)
                return oldEntity.mergeDeepWith(merger, _this._instantiate(entity, modelName));
              });
            }
          });
        });
      });
    }
  }, {
    key: "_instantiate",
    value: function _instantiate(entity, modelName) {
      return this.Models[modelName] ? new this.Models[modelName](entity) : entity;
    }
  }]);
}();
var merger = function merger(prev, next) {
  return (0, _isUndefined.default)(next) ? prev : next;
};
function createReducer(Models) {
  var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
    initialState = _ref2.initialState,
    additionalReducer = _ref2.additionalReducer;
  var reducer = new EntitiesReducer(Models, initialState, additionalReducer);
  return reducer.reduce;
}