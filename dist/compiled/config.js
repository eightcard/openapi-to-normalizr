"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
var Config = /*#__PURE__*/function () {
  function Config(config) {
    _classCallCheck(this, Config);
    this._config = config;
    this.attributeConverter = config.attributeConverter ? config.attributeConverter : function (str) {
      return str;
    };
    this.modelsDir = config.modelsDir || 'dist';
  }
  _createClass(Config, [{
    key: "tags",
    get: function get() {
      return this._config.tags;
    }
  }, {
    key: "outputPath",
    get: function get() {
      return this._config.outputPath;
    }
  }, {
    key: "useTypeScript",
    get: function get() {
      return Boolean(this._config.useTypeScript);
    }
  }, {
    key: "useTypeScriptAction",
    get: function get() {
      var useTypeScriptAction = this._config.useTypeScriptAction;
      return typeof useTypeScriptAction === 'undefined' ? this.useTypeScript : Boolean(useTypeScriptAction);
    }
  }, {
    key: "useTypeScriptModel",
    get: function get() {
      var useTypeScriptModel = this._config.useTypeScriptModel;
      return typeof useTypeScriptModel === 'undefined' ? this.useTypeScript : Boolean(useTypeScriptModel);
    }
  }, {
    key: "useTypeScriptSchema",
    get: function get() {
      var useTypeScriptSchema = this._config.useTypeScriptSchema;
      return typeof useTypeScriptSchema === 'undefined' ? this.useTypeScript : Boolean(useTypeScriptSchema);
    }
  }, {
    key: "useTypeScriptSpec",
    get: function get() {
      var useTypeScriptSpec = this._config.useTypeScriptSpec;
      return typeof useTypeScriptSpec === 'undefined' ? this.useTypeScript : Boolean(useTypeScriptSpec);
    }
  }, {
    key: "getExtension",
    value: function getExtension(useTypeScript) {
      return useTypeScript ? 'ts' : 'js';
    }
  }, {
    key: "formatForModelGenerator",
    value: function formatForModelGenerator() {
      var _this$_config = this._config,
        templatePath = _this$_config.templates,
        usePropType = _this$_config.usePropType;
      return {
        outputDir: this.modelsDir,
        templatePath: templatePath,
        usePropType: usePropType,
        useTypeScript: this.useTypeScriptModel,
        attributeConverter: this.attributeConverter,
        extension: this.getExtension(this.useTypeScriptModel)
      };
    }
  }, {
    key: "formatForActionTypesGenerator",
    value: function formatForActionTypesGenerator() {
      var _this$_config2 = this._config,
        outputPath = _this$_config2.outputPath,
        templatePath = _this$_config2.templates;
      var operationIdList = [];
      return {
        outputPath: outputPath.actions,
        schemasFilePath: outputPath.schemas,
        templatePath: templatePath,
        operationIdList: operationIdList,
        useTypeScript: this.useTypeScriptAction,
        extension: this.getExtension(this.useTypeScriptAction)
      };
    }
  }, {
    key: "formatForSchemaGenerator",
    value: function formatForSchemaGenerator() {
      var _this$_config3 = this._config,
        outputPath = _this$_config3.outputPath,
        templatePath = _this$_config3.templates;
      return {
        templatePath: templatePath,
        outputPath: outputPath.schemas,
        modelsDir: this.modelsDir,
        attributeConverter: this.attributeConverter,
        useTypeScript: this.useTypeScriptSchema,
        extension: this.getExtension(this.useTypeScriptSchema)
      };
    }
  }, {
    key: "formatForJsSpecGenerator",
    value: function formatForJsSpecGenerator() {
      var _this$_config4 = this._config,
        templatePath = _this$_config4.templates,
        outputPath = _this$_config4.outputPath;
      return {
        templatePath: templatePath,
        outputPath: outputPath.jsSpec,
        extension: this.getExtension(this.useTypeScriptSpec)
      };
    }
  }]);
  return Config;
}();
exports.default = Config;