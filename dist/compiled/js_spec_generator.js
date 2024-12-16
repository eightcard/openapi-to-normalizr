"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _path = _interopRequireDefault(require("path"));
var _lodash = _interopRequireDefault(require("lodash"));
var _utils = require("./utils");
var _spec_file_utils = require("./spec_file_utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _toArray(r) { return _arrayWithHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var UNNECESSARY_PROPS = [_spec_file_utils.ALTERNATIVE_REF_KEY, 'description', 'info', _spec_file_utils.MODEL_DEF_KEY, 'x-id-attribute', 'x-attribute-as', 'x-enum-key-attributes'];
var JsSpecGenerator = exports.default = /*#__PURE__*/function () {
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
  return _createClass(JsSpecGenerator, [{
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
      var useRefs = {};

      // pathから利用しているrefを取得
      (0, _spec_file_utils.walkSchema)(spec.paths, function (obj) {
        if (obj.$ref) useRefs[obj.$ref] = true;
      });

      // pathで利用しているrefから芋づる式に利用しているrefを取得
      _lodash.default.each(useRefs, function (_bool, ref) {
        return checkRef(ref);
      });

      // ↑で取得した以外のcomponents情報を削除
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
}();