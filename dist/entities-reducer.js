"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createReducer = createReducer;

var _immutable = require("immutable");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var initialState = (0, _immutable.Map)();

function isOpenApiAction(meta) {
  return meta && meta.openApi;
}

function getNewEntities(action) {
  return isOpenApiAction(action.meta) && action.payload && action.payload.entities;
}

var EntitiesReducer =
/*#__PURE__*/
function () {
  function EntitiesReducer() {
    var Models = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var additionalReducer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (state) {
      return state;
    };

    _classCallCheck(this, EntitiesReducer);

    this.Models = Models;
    this.additionalReducer = additionalReducer;
    this.reduce = this.reduce.bind(this);
  }

  _createClass(EntitiesReducer, [{
    key: "reduce",
    value: function reduce() {
      var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
      var action = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var newEntities = getNewEntities(action);

      if (newEntities) {
        state = this._mergeEntities(state, newEntities);
      }

      return isOpenApiAction(action.meta) ? this.additionalReducer(state, action) : state;
    }
  }, {
    key: "_mergeEntities",
    value: function _mergeEntities(state, newEntities) {
      var _this = this;

      return state.update(function (oldEntities) {
        var modeledEntities = (0, _immutable.fromJS)(newEntities).map(function (entities, modelName) {
          return entities.map(function (entity) {
            return _this._instantiate(entity, modelName);
          });
        });
        return oldEntities.mergeDeep(modeledEntities);
      });
    }
  }, {
    key: "_instantiate",
    value: function _instantiate(entity, modelName) {
      return this.Models[modelName] ? new this.Models[modelName](entity) : entity;
    }
  }]);

  return EntitiesReducer;
}();

function createReducer(Models, additionalReducer) {
  var reducer = new EntitiesReducer(Models, additionalReducer);
  return reducer.reduce;
}