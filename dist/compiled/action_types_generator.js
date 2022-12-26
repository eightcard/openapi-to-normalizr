"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _path = _interopRequireDefault(require("path"));
var _utils = require("./utils");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var ActionTypesGenerator = /*#__PURE__*/function () {
  function ActionTypesGenerator(_ref) {
    var _ref$outputPath = _ref.outputPath,
      outputPath = _ref$outputPath === void 0 ? '' : _ref$outputPath,
      _ref$schemasFilePath = _ref.schemasFilePath,
      schemasFilePath = _ref$schemasFilePath === void 0 ? '' : _ref$schemasFilePath,
      _ref$templatePath = _ref.templatePath,
      templatePath = _ref$templatePath === void 0 ? {} : _ref$templatePath,
      _ref$operationIdList = _ref.operationIdList,
      operationIdList = _ref$operationIdList === void 0 ? [] : _ref$operationIdList,
      _ref$useTypeScript = _ref.useTypeScript,
      useTypeScript = _ref$useTypeScript === void 0 ? false : _ref$useTypeScript,
      _ref$extension = _ref.extension,
      extension = _ref$extension === void 0 ? 'js' : _ref$extension;
    _classCallCheck(this, ActionTypesGenerator);
    this.outputPath = outputPath;
    var _path$parse = _path.default.parse(this.outputPath),
      dir = _path$parse.dir,
      name = _path$parse.name,
      ext = _path$parse.ext;
    this.outputDir = dir;
    this.outputFileName = "".concat(name, ".").concat(extension);
    this.schemasFilePath = schemasFilePath.replace(ext, '');
    this.templatePath = templatePath;
    this.operationIdList = operationIdList;
    this.templates = (0, _utils.readTemplates)(['head', 'actionTypes'], this.templatePath);
    this.appendId = this.appendId.bind(this);
    this.write = this.write.bind(this);
    this.useTypeScript = useTypeScript;
  }
  _createClass(ActionTypesGenerator, [{
    key: "appendId",
    value: function appendId(id) {
      this.operationIdList.push(id.toUpperCase());
    }

    /**
     * actionTypes.jsを書き出し
     */
  }, {
    key: "write",
    value: function write() {
      var _this$templates = this.templates,
        actionTypes = _this$templates.actionTypes,
        head = _this$templates.head;
      if (!actionTypes || !head) return;
      var text = (0, _utils.render)(actionTypes, {
        operationIdList: this.operationIdList,
        schemasFile: _path.default.relative(this.outputDir, this.schemasFilePath),
        useTypeScript: this.useTypeScript
      }, {
        head: head
      });
      return (0, _utils.writeFilePromise)(_path.default.join(this.outputDir, this.outputFileName), text);
    }
  }]);
  return ActionTypesGenerator;
}();
exports.default = ActionTypesGenerator;