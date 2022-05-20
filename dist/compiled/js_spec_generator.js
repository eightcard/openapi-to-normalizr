"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = _interopRequireDefault(require("path"));

var _lodash = _interopRequireDefault(require("lodash"));

var _utils = require("./utils");

var _spec_file_utils = require("./spec_file_utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var UNNECESSARY_PROPS = [_spec_file_utils.ALTERNATIVE_REF_KEY, 'description', 'info', _spec_file_utils.MODEL_DEF_KEY, 'x-id-attribute', 'x-attribute-as', 'x-enum-key-attributes'];

var JsSpecGenerator = /*#__PURE__*/function () {
  function JsSpecGenerator(_ref) {
    var _ref$outputPath = _ref.outputPath,
        outputPath = _ref$outputPath === void 0 ? '' : _ref$outputPath,
        templatePath = _ref.templatePath,
        _ref$extension = _ref.extension,
        extension = _ref$extension === void 0 ? 'js' : _ref$extension;

    _classCallCheck(this, JsSpecGenerator);

    this.outputPath = outputPath;
    this.templatePath = templatePath;
    this.templates = (0, _utils.readTemplates)(['spec', 'head'], this.templatePath);

    var _path$parse = _path.default.parse(this.outputPath),
        dir = _path$parse.dir,
        name = _path$parse.name;

    this.outputDir = dir;
    this.outputFileName = "".concat(name, ".").concat(extension);
    this.write = this.write.bind(this);
  }

  _createClass(JsSpecGenerator, [{
    key: "write",
    value: function write(specData) {
      this.deleteUnnecessaryProps(specData);
      this.deleteUnusedComponents(specData);
      var _this$templates = this.templates,
          spec = _this$templates.spec,
          head = _this$templates.head;
      if (!spec || !head) return;
      var text = (0, _utils.render)(spec, {
        spec: JSON.stringify(specData, null, 2)
      }, {
        head: head
      });
      return (0, _utils.writeFilePromise)(_path.default.join(this.outputDir, this.outputFileName), text);
    }
  }, {
    key: "deleteUnnecessaryProps",
    value: function deleteUnnecessaryProps(spec) {
      (0, _spec_file_utils.walkSchema)(spec, function (obj) {
        UNNECESSARY_PROPS.forEach(function (key) {
          return delete obj[key];
        });
      });
    }
  }, {
    key: "deleteUnusedComponents",
    value: function deleteUnusedComponents(spec) {
      var useRefs = {}; // pathから利用しているrefを取得

      (0, _spec_file_utils.walkSchema)(spec.paths, function (obj) {
        if (obj.$ref) useRefs[obj.$ref] = true;
      }); // pathで利用しているrefから芋づる式に利用しているrefを取得

      _lodash.default.each(useRefs, function (_bool, ref) {
        return checkRef(ref);
      }); // ↑で取得した以外のcomponents情報を削除


      _lodash.default.each(spec.components, function (schemas, key) {
        _lodash.default.each(schemas, function (_obj, name) {
          var p = "#/components/".concat(key, "/").concat(name);
          if (!useRefs[p]) delete schemas[name];
        });
      });

      function checkRef(targetRef) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        var _targetRef$split = targetRef.split('/'),
            _targetRef$split2 = _toArray(_targetRef$split),
            components = _targetRef$split2[1],
            group = _targetRef$split2[2],
            name = _targetRef$split2[3],
            rest = _targetRef$split2.slice(4);

        (0, _spec_file_utils.walkSchema)(spec[components][group][name], function (obj) {
          if (obj.$ref) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            var _obj$$ref$split = obj.$ref.split('/'),
                _obj$$ref$split2 = _toArray(_obj$$ref$split),
                hash = _obj$$ref$split2[0],
                _components = _obj$$ref$split2[1],
                _group = _obj$$ref$split2[2],
                _name = _obj$$ref$split2[3],
                _rest = _obj$$ref$split2.slice(4);

            var ref = [hash, _components, _group, _name].join('/');
            useRefs[ref] = true;
            checkRef(ref);
          }
        });
      }
    }
  }]);

  return JsSpecGenerator;
}();

exports.default = JsSpecGenerator;