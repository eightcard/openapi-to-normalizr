"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = main;

var _path = _interopRequireDefault(require("path"));

var _swaggerClient = _interopRequireDefault(require("swagger-client"));

var _lodash = _interopRequireDefault(require("lodash"));

var _utils = require("./utils");

var _spec_file_utils = require("./spec_file_utils");

var _model_generator = _interopRequireDefault(require("./model_generator"));

var _schema_generator = _interopRequireDefault(require("./schema_generator"));

var _action_types_generator = _interopRequireDefault(require("./action_types_generator"));

var _js_spec_generator = _interopRequireDefault(require("./js_spec_generator"));

var _config = _interopRequireDefault(require("./config"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function main(_x, _x2) {
  return _main.apply(this, arguments);
}

function _main() {
  _main = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(specFiles, c) {
    var config, spec, copiedSpec, opId, walkResponses;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            walkResponses = function _walkResponses(paths) {
              var onResponses = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

              _lodash.default.each(paths, function (operations, path) {
                _lodash.default.each(operations, function (operation, method) {
                  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
                    // use only RESTful methods
                    return;
                  }

                  if (!_lodash.default.isObject(operation)) {
                    console.warn("not processed. path:".concat(path, ", method:").concat(method));
                    return;
                  } // @ts-expect-error


                  if (operation.operationId) {
                    console.info( // @ts-expect-error
                    "no use specified operationId. path:".concat(path, ", method:").concat(method, ", operationId:").concat(operation.operationId)); // @ts-expect-error

                    delete operation.operationId;
                  } // @ts-expect-error


                  var response = operation.responses;
                  var id = opId(operation, path, method);
                  onResponses.forEach(function (onResponse) {
                    return onResponse(id, response, {
                      path: path,
                      method: method,
                      operation: operation
                    });
                  });
                });
              });
            };

            opId = function _opId(operation, path, method) {
              return _swaggerClient.default.helpers.opId(operation, path, method);
            };

            config = new _config.default(c);
            spec = (0, _spec_file_utils.getPreparedSpec)(specFiles, config.tags); // dereferenceが内部状態を変えてしまうためcopy

            copiedSpec = JSON.parse(JSON.stringify(spec));
            _context.next = 7;
            return (0, _spec_file_utils.dereferenceSchema)(spec).then(function (spec) {
              var actionTypesGenerator, modelGenerator, schemaGenerator;

              var _map = ['actions', 'schemas', 'jsSpec'].map(function (key) {
                return _path.default.dirname(config.outputPath[key]);
              }),
                  _map2 = _slicedToArray(_map, 3),
                  actionsDir = _map2[0],
                  schemasDir = _map2[1],
                  specDir = _map2[2];

              var baseModelsDir = "".concat(config.modelsDir, "/base");
              var prepareDirs = [actionsDir, schemasDir, specDir, config.modelsDir, baseModelsDir].map(function (p) {
                return (0, _utils.mkdirpPromise)(p);
              });
              return (0, _swaggerClient.default)({
                spec: spec
              }).then(function (_ref) {
                var spec = _ref.spec;
                // refとOpenAPI記法(oneOfなど)解決済みのspecからモデル定義を取得
                var definitions = (0, _utils.getModelDefinitions)(spec);
                return Promise.all(prepareDirs).then(function () {
                  var configForModelGenerator = Object.assign({
                    outputBaseDir: baseModelsDir,
                    definitions: definitions
                  }, config.formatForModelGenerator());
                  modelGenerator = new _model_generator.default(configForModelGenerator);
                  actionTypesGenerator = new _action_types_generator.default(config.formatForActionTypesGenerator());
                  var configForSchemaGenerator = Object.assign({
                    modelGenerator: modelGenerator
                  }, config.formatForSchemaGenerator());
                  schemaGenerator = new _schema_generator.default(configForSchemaGenerator);
                  walkResponses(spec.paths, [schemaGenerator.parse, actionTypesGenerator.appendId]);
                  return Promise.all([schemaGenerator, actionTypesGenerator].map(function (g) {
                    return g.write();
                  }));
                });
              }).catch(function (e) {
                console.error("Failed: ".concat(e));
                throw e;
              });
            }).then(function () {
              return new _js_spec_generator.default(config.formatForJsSpecGenerator()).write(copiedSpec);
            }).catch(function (e) {
              console.error("Failed: ".concat(e));
              throw e;
            });

          case 7:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _main.apply(this, arguments);
}