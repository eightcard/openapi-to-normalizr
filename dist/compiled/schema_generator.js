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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

/**
 * レスポンス定義からnormalizr用のschemaを作成
 * content-typeはjsonのみサポート
 */
var SchemaGenerator = /*#__PURE__*/function () {
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


  _createClass(SchemaGenerator, [{
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

            var _key = "oneOfSchema".concat(count);

            value.key = _key;

            _this.oneOfs.push(value);

            return _key;
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
        return (// eslint-disable-next-line lines-around-comment
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

  return SchemaGenerator;
}();

exports.default = SchemaGenerator;