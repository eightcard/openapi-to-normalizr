"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MODEL_DEF_KEY = exports.ALTERNATIVE_REF_KEY = void 0;
exports.dereferenceSchema = dereferenceSchema;
exports.getPreparedSpec = getPreparedSpec;
exports.walkSchema = walkSchema;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _merge = _interopRequireDefault(require("lodash/merge"));

var _noop = _interopRequireDefault(require("lodash/noop"));

var _isArray = _interopRequireDefault(require("lodash/isArray"));

var _isObject = _interopRequireDefault(require("lodash/isObject"));

var _each = _interopRequireDefault(require("lodash/each"));

var _uniq = _interopRequireDefault(require("lodash/uniq"));

var _flatten = _interopRequireDefault(require("lodash/flatten"));

var _jsYaml = _interopRequireDefault(require("js-yaml"));

var _jsonSchemaRefParser = _interopRequireDefault(require("@apidevtools/json-schema-ref-parser"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var ALTERNATIVE_REF_KEY = '__$ref__';
exports.ALTERNATIVE_REF_KEY = ALTERNATIVE_REF_KEY;
var MODEL_DEF_KEY = 'x-model-name';
/* library alias */

exports.MODEL_DEF_KEY = MODEL_DEF_KEY;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
var isDocument = function isDocument(obj) {
  return 'openapi' in obj && 'info' in obj && 'paths' in obj;
}; // eslint-disable-next-line @typescript-eslint/no-explicit-any


var isOperation = function isOperation(obj) {
  return 'tags' in obj;
};

var methodNames = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']; // メソッド名の Union String Literal Types = 'get' | 'put' | ... | 'trace';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
var isMethodName = function isMethodName(str) {
  return methodNames.includes(str);
};

function dereferenceSchema(spec) {
  return _jsonSchemaRefParser.default.dereference(spec);
} // eslint-disable-next-line @typescript-eslint/no-explicit-any


function walkSchema(spec) {
  var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _noop.default;

  if ((0, _isArray.default)(spec)) {
    return spec.forEach(function (item) {
      return walkSchema(item, callback);
    });
  } else if ((0, _isObject.default)(spec)) {
    callback(spec);
    return (0, _each.default)(spec, function (value) {
      return walkSchema(value, callback);
    });
  }
}

function getRefFilesPath(spec) {
  var paths = [];
  walkSchema(spec, function (obj) {
    if (obj.$ref) {
      var matches = obj.$ref.match(/^([^#].*)#/);
      if (matches) paths.push(matches[1]);
    }
  });
  return paths;
}

function getPreparedSpec() {
  var specFiles = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var tags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var readFiles = {};
  var allFiles = (0, _uniq.default)(getAllRelatedFiles(specFiles));
  return _merge.default.apply(void 0, [{}].concat(_toConsumableArray(specFiles.concat(allFiles).map(function (p) {
    var spec = _jsYaml.default.load(_fs.default.readFileSync(p).toString());

    if (isDocument(spec)) {
      if (specFiles.includes(p)) {
        removeUnusableOperation(spec);
      } else {
        // 指定されたspecファイル以外のpath情報は不要
        spec.paths = {};
      }

      applyAlternativeRef(spec);
      var schemas = spec.components && spec.components.schemas;

      if (schemas) {
        (0, _each.default)(schemas, function (model, name) {
          model[MODEL_DEF_KEY] = name;
        });
      }
    }

    return spec;
  }))));

  function isUsableOperation(operationTags) {
    if (tags.length === 0) return true;
    return operationTags && tags.some(function (t) {
      return operationTags.includes(t);
    });
  }

  function removeUnusableOperation(spec) {
    (0, _each.default)(spec.paths, function (operations) {
      if (!operations) return;
      (0, _each.default)(operations, function (operation, method) {
        if (isOperation(operation) && isMethodName(method) && !isUsableOperation(operation.tags)) {
          delete operations[method];
        }
      });
    });
  }

  function getAllRelatedFiles(files) {
    return files.reduce(function (acc, filePath) {
      var spec = _jsYaml.default.load(_fs.default.readFileSync(filePath).toString());

      var refFilesPaths = isDocument(spec) ? (0, _uniq.default)(getRefFilesPath(spec)) : [];
      var relatedFilesPaths = (0, _flatten.default)(refFilesPaths.map(function (p) {
        var refSpecPath = _path.default.join(_path.default.dirname(filePath), p);

        if (readFiles[refSpecPath]) {
          return refSpecPath;
        } else {
          readFiles[refSpecPath] = true;
          var relatedFiles = getAllRelatedFiles([refSpecPath]);
          return [refSpecPath].concat(relatedFiles);
        }
      }));
      return acc.concat(relatedFilesPaths);
    }, []);
  }

  function applyAlternativeRef(spec) {
    walkSchema(spec, function (obj) {
      if (obj.$ref) {
        // mergeされるので内部refに変換
        var index = obj.$ref.indexOf('#');
        obj.$ref = obj.$ref.slice(index);
        obj[ALTERNATIVE_REF_KEY] = obj.$ref;
      }
    });
    return spec;
  }
}