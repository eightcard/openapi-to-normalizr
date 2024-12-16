"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _each = _interopRequireDefault(require("lodash/each"));
var _snakeCase = _interopRequireDefault(require("lodash/snakeCase"));
var _uniqBy = _interopRequireDefault(require("lodash/uniqBy"));
var _reduce = _interopRequireDefault(require("lodash/reduce"));
var _path = _interopRequireDefault(require("path"));
var _utils = require("./utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * レスポンス定義からnormalizr用のschemaを作成
 * content-typeはjsonのみサポート
 */
var SchemaGenerator = exports.default = /*#__PURE__*/function () {
  function SchemaGenerator(_ref) {
    var _ref$outputPath = _ref.outputPath,
      outputPath = _ref$outputPath === void 0 ? '' : _ref$outputPath,
      _ref$templatePath = _ref.templatePath,
      templatePath = _ref$templatePath === void 0 ? {} : _ref$templatePath,
      modelGenerator = _ref.modelGenerator,
      modelsDir = _ref.modelsDir,
      _ref$attributeConvert = _ref.attributeConverter,
      attributeConverter = _ref$attributeConvert === void 0 ? function (str) {
        return str;
      } : _ref$attributeConvert,
      useTypeScript = _ref.useTypeScript,
      _ref$extension = _ref.extension,
      extension = _ref$extension === void 0 ? 'js' : _ref$extension;
    _classCallCheck(this, SchemaGenerator);
    this.outputPath = outputPath;
    var _path$parse = _path.default.parse(this.outputPath),
      dir = _path$parse.dir,
      name = _path$parse.name;
    this.outputDir = dir;
    this.outputFileName = "".concat(name, ".").concat(extension);
    this.templatePath = templatePath;
    this.modelGenerator = modelGenerator;
    this.modelsDir = modelsDir;
    this.attributeConverter = attributeConverter;
    this.templates = (0, _utils.readTemplates)(['schema', 'head', 'oneOf'], this.templatePath);
    this.parsedObjects = {};
    this._importModels = [];
    this.oneOfs = [];
    this.parse = this.parse.bind(this);
    this.write = this.write.bind(this);
    this.useTypeScript = useTypeScript;
  }

  /**
   * API(id)ごとのスキーマをパース
   * - 内部でモデル情報をメモ
   */
  return _createClass(SchemaGenerator, [{
    key: "parse",
    value: function parse(id, responses) {
      var _this = this;
      (0, _each.default)(responses, function (response, code) {
        var contents = SchemaGenerator.getJsonContents(response);
        if (!contents) {
          console.warn("".concat(id, ":").concat(code, " does not have content."));
          return;
        }
        var onSchema = function onSchema(_ref2) {
          var type = _ref2.type,
            value = _ref2.value;
          if (type === 'model') {
            var modelName = (0, _utils.getModelName)(value);
            if ((0, _utils.getIdAttribute)(value, modelName)) {
              _this._importModels.push({
                modelName: modelName,
                model: value
              });
              return (0, _utils.schemaName)(modelName);
            }
          }
          if (type === 'oneOf') {
            var count = _this.oneOfs.length + 1;
            var key = "oneOfSchema".concat(count);
            value.key = key;
            _this.oneOfs.push(value);
            return key;
          }
        };
        var data = (0, _utils.parseSchema)(contents.schema, onSchema);
        (0, _utils.applyIf)(data, function (val) {
          _this.parsedObjects[id] = _this.parsedObjects[id] || {};
          _this.parsedObjects[id][code] = val;
        });
      });
    }

    /**
     * パース情報とテンプレートからschema.jsとmodels/index.js書き出し
     */
  }, {
    key: "write",
    value: function write() {
      var _this2 = this;
      return Promise.all([this._writeSchemaFile()].concat(_toConsumableArray(this.importModels.map(function (_ref3) {
        var modelName = _ref3.modelName,
          model = _ref3.model;
        return (
          // eslint-disable-next-line lines-around-comment
          // @ts-expect-error utilsのgetModelNameで生成されるmodelNameがundefinedの可能性がある
          _this2.modelGenerator.writeModel(model, modelName)
        );
      })))).then(function () {
        _this2.modelGenerator.writeIndex();
      });
    }
  }, {
    key: "_writeSchemaFile",
    value: function _writeSchemaFile() {
      var _this3 = this;
      var oneOfs = this.oneOfs.map(function (obj) {
        return Object.assign(obj, {
          mapping: (0, _utils.objectToTemplateValue)(obj.mapping),
          propertyName: "'".concat(_this3.attributeConverter(obj.propertyName), "'")
        });
      });
      var _this$templates = this.templates,
        schema = _this$templates.schema,
        head = _this$templates.head,
        oneOf = _this$templates.oneOf;
      if (!schema || !head || !oneOf) return Promise.reject();
      var text = (0, _utils.render)(schema, {
        importList: this._prepareImportList(),
        data: (0, _utils.objectToTemplateValue)(this.formattedSchema),
        hasOneOf: oneOfs.length > 0,
        oneOfs: oneOfs,
        useTypeScript: this.useTypeScript
      }, {
        head: head,
        oneOf: oneOf
      });
      return (0, _utils.writeFilePromise)(_path.default.join(this.outputDir, this.outputFileName), text);
    }
  }, {
    key: "_prepareImportList",
    value: function _prepareImportList() {
      var relative = _path.default.relative(this.outputDir, this.modelsDir);
      return this.importModels.map(function (_ref4) {
        var modelName = _ref4.modelName;
        return {
          name: (0, _utils.schemaName)(modelName),
          path: _path.default.join(relative, (0, _snakeCase.default)(modelName))
        };
      });
    }
  }, {
    key: "importModels",
    get: function get() {
      return (0, _uniqBy.default)(this._importModels, 'modelName');
    }
  }, {
    key: "formattedSchema",
    get: function get() {
      var _this4 = this;
      return (0, _reduce.default)(this.parsedObjects, function (acc, schema, key) {
        acc[key] = (0, _utils.changeFormat)(schema, _this4.attributeConverter);
        return acc;
      }, {});
    }
  }], [{
    key: "getJsonContents",
    value: function getJsonContents(response) {
      // ResponseObject
      if ('content' in response) {
        return response.content && response.content['application/json'];
      }
    }
  }]);
}();