"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var _path = _interopRequireDefault(require("path"));

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * モデル定義からモデルファイルを作成
 */
var ModelGenerator = /*#__PURE__*/function () {
  function ModelGenerator(_ref) {
    var _ref$outputDir = _ref.outputDir,
        outputDir = _ref$outputDir === void 0 ? '' : _ref$outputDir,
        _ref$outputBaseDir = _ref.outputBaseDir,
        outputBaseDir = _ref$outputBaseDir === void 0 ? '' : _ref$outputBaseDir,
        _ref$templatePath = _ref.templatePath,
        templatePath = _ref$templatePath === void 0 ? {} : _ref$templatePath,
        _ref$usePropType = _ref.usePropType,
        usePropType = _ref$usePropType === void 0 ? false : _ref$usePropType,
        _ref$useTypeScript = _ref.useTypeScript,
        useTypeScript = _ref$useTypeScript === void 0 ? false : _ref$useTypeScript,
        _ref$attributeConvert = _ref.attributeConverter,
        attributeConverter = _ref$attributeConvert === void 0 ? function (str) {
      return str;
    } : _ref$attributeConvert,
        _ref$definitions = _ref.definitions,
        definitions = _ref$definitions === void 0 ? {} : _ref$definitions,
        _ref$extension = _ref.extension,
        extension = _ref$extension === void 0 ? 'js' : _ref$extension;

    _classCallCheck(this, ModelGenerator);

    this.outputDir = outputDir;
    this.outputBaseDir = outputBaseDir;
    this.templatePath = templatePath;
    this.usePropType = usePropType;
    this.useTypeScript = useTypeScript;
    this.attributeConverter = attributeConverter;
    this.definitions = definitions;
    this.extension = extension;
    this.templates = (0, _utils.readTemplates)(['model', 'models', 'override', 'head', 'dependency', 'oneOf'], this.templatePath);
    this.writeModel = this.writeModel.bind(this);
    this.writeIndex = this.writeIndex.bind(this);
    this._modelNameList = [];
    this.importImmutableMap = false;
  }
  /**
   * モデル定義ごとに呼び出し
   * - モデルファイルを書き出す
   * - Promiseでモデル名(Petなど)を返す
   */


  _createClass(ModelGenerator, [{
    key: "writeModel",
    value: function writeModel(model, name) {
      var _this = this;

      var properties = model.properties; // dereferenced

      var fileName = _lodash.default.snakeCase(name);

      var idAttribute = (0, _utils.getIdAttribute)(model, name);
      if (!idAttribute) return Promise.reject('idAttribute does not exists');

      if (this._modelNameList.includes(name)) {
        // ignore duplicate execution
        return Promise.resolve();
      }

      this._modelNameList.push(name); // requiredはモデル定義のものを使う


      var requiredPropertyNames = this.definitions[name] && this.definitions[name].required;
      var appliedProperties = (0, _utils.applyRequired)(properties, requiredPropertyNames);
      return this._renderBaseModel(name, appliedProperties, idAttribute).then(function (_ref2) {
        var text = _ref2.text,
            props = _ref2.props;
        (0, _utils.writeFile)(_path.default.join(_this.outputBaseDir, "".concat(fileName, ".").concat(_this.extension)), text);
        return _this._writeOverrideModel(name, fileName, props).then(function () {
          return name;
        });
      });
    }
  }, {
    key: "writeIndex",
    value: function writeIndex() {
      var modelNameList = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this._modelNameList;
      var _this$templates = this.templates,
          models = _this$templates.models,
          head = _this$templates.head;
      if (!models || !head) return;
      var text = (0, _utils.render)(models, {
        models: _lodash.default.uniq(modelNameList).map(function (name) {
          return {
            fileName: _lodash.default.snakeCase(name),
            name: name
          };
        })
      }, {
        head: head
      });
      return (0, _utils.writeFilePromise)(_path.default.join(this.outputDir, "index.".concat(this.extension)), text);
    }
  }, {
    key: "_writeOverrideModel",
    value: function _writeOverrideModel(name, fileName, props) {
      var overrideText = this._renderOverrideModel(name, fileName, props);

      var filePath = _path.default.join(this.outputDir, "".concat(fileName, ".").concat(this.extension));

      return (0, _utils.isFileExistPromise)(filePath).then(function (isExist) {
        return isExist || (0, _utils.writeFilePromise)(filePath, overrideText);
      });
    }
  }, {
    key: "_prepareImportList",
    value: function _prepareImportList(importList) {
      return _lodash.default.uniqBy(importList, 'modelName').map(function (_ref3) {
        var modelName = _ref3.modelName,
            filePath = _ref3.filePath;
        return {
          name: modelName,
          schemaName: (0, _utils.schemaName)(modelName),
          filePath: filePath ? filePath : _lodash.default.snakeCase(modelName)
        };
      });
    }
  }, {
    key: "_prepareIdAttribute",
    value: function _prepareIdAttribute(idAttribute) {
      var _this2 = this;

      var splits = idAttribute.split('.');

      if (splits[0] === 'parent') {
        splits.shift();
        return "(value, parent) => parent".concat(splits.map(function (str) {
          return "['".concat(_this2.attributeConverter(str), "']");
        }).join(''));
      }

      if (splits.length === 1) {
        return "'".concat(this.attributeConverter(splits[0]), "'");
      }

      return "(value) => value".concat(splits.map(function (str) {
        return "['".concat(_this2.attributeConverter(str), "']");
      }).join(''));
    }
  }, {
    key: "_renderBaseModel",
    value: function _renderBaseModel(name, properties, idAttribute) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        var importList = [];
        var oneOfs = [];
        var oneOfsCounter = 1; // @ts-expect-error バインド要素 'type', 'value' には暗黙的に 'any' 型が含まれます。

        var dependencySchema = (0, _utils.parseSchema)(properties, function (_ref4) {
          var type = _ref4.type,
              value = _ref4.value;

          if (type === 'model') {
            var modelName = (0, _utils.getModelName)(value);

            if ((0, _utils.getIdAttribute)(value, modelName)) {
              importList.push({
                modelName: modelName,
                value: value
              });
              return (0, _utils.schemaName)(modelName);
            }
          }

          if (type === 'oneOf') {
            var _key = "oneOfSchema".concat(oneOfsCounter++);

            value.key = _key;
            oneOfs.push(value);
            return _key;
          }
        }); // reset

        _this3.importImmutableMap = false;
        var props = {
          name: name,
          idAttribute: _this3._prepareIdAttribute(idAttribute),
          usePropTypes: _this3.usePropType,
          useTypeScript: _this3.useTypeScript,
          props: _this3._convertPropForTemplate(properties, dependencySchema),
          schema: (0, _utils.objectToTemplateValue)((0, _utils.changeFormat)(dependencySchema, _this3.attributeConverter)),
          oneOfs: oneOfs.map(function (obj) {
            return Object.assign(obj, {
              mapping: (0, _utils.objectToTemplateValue)(obj.mapping),
              propertyName: _this3._prepareIdAttribute(obj.propertyName)
            });
          }),
          importList: _this3._prepareImportList(importList),
          getPropTypes: getPropTypes,
          getTypeScriptTypes: getTypeScriptTypes,
          getDefaults: getDefaults,
          importImmutableMap: _this3.importImmutableMap
        };
        var _this3$templates = _this3.templates,
            model = _this3$templates.model,
            head = _this3$templates.head,
            dependency = _this3$templates.dependency,
            oneOf = _this3$templates.oneOf;
        if (!model || !head || !dependency || !oneOf) return;
        var text = (0, _utils.render)(model, props, {
          head: head,
          dependency: dependency,
          oneOf: oneOf
        }); // import先のモデルを書き出し

        Promise.all(importList.map(function (_ref5) {
          var value = _ref5.value,
              modelName = _ref5.modelName;
          return _this3.writeModel(value, modelName);
        })).then(function () {
          return resolve({
            text: text,
            props: props
          });
        }, // 自身の書き出しはここで実施
        reject);
      });
    }
  }, {
    key: "_convertPropForTemplate",
    value: function _convertPropForTemplate(properties) {
      var _this4 = this;

      var dependencySchema = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return _lodash.default.map(properties, function (prop, _name) {
        var base = {
          name: function name() {
            return _this4.attributeConverter(_name);
          },
          type: _this4.generateTypeFrom(prop, dependencySchema[_name]),
          alias: prop['x-attribute-as'],
          required: prop.required === true,
          nullable: prop.nullable === true,
          isEnum: Boolean(prop.enum),
          isValueString: prop.type === 'string',
          propertyName: _name,
          enumObjects: _this4.getEnumObjects(_this4.attributeConverter(_name), prop.enum, prop['x-enum-key-attributes']),
          enumType: _this4._getEnumTypes(prop.type),
          items: prop.items
        }; // @ts-expect-error プロパティ 'templatePropNames' は型 'Function' に存在しません。

        return _this4.constructor.templatePropNames.reduce(function (ret, key) {
          ret[key] = ret[key] || properties[_name][key];
          return ret;
        }, base);
      });
    }
  }, {
    key: "getEnumConstantName",
    value: function getEnumConstantName(enumName, propertyName) {
      var convertedName = _lodash.default.upperCase(propertyName).split(' ').join('_');

      var convertedkey = _lodash.default.upperCase("".concat(enumName)).split(' ').join('_'); // enumNameがマイナスの数値の時


      var resolvedkey = typeof enumName === 'number' && enumName < 0 ? "MINUS_".concat(convertedkey) : convertedkey;
      return "".concat(convertedName, "_").concat(resolvedkey);
    }
  }, {
    key: "getEnumLiteralTypeName",
    value: function getEnumLiteralTypeName(enumName, propertyName) {
      var convertedName = _lodash.default.startCase(propertyName).split(' ').join('');

      var convertedkey = _lodash.default.startCase("".concat(enumName)).split(' ').join(''); // enumNameがマイナスの数値の時


      var resolvedkey = typeof enumName === 'number' && enumName < 0 ? "Minus".concat(convertedkey) : convertedkey;
      return "".concat(convertedName).concat(resolvedkey);
    }
  }, {
    key: "getEnumObjects",
    value: function getEnumObjects(name, enums) {
      var _this5 = this;

      var enumKeyAttributes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
      if (!enums) return false;
      return enums.map(function (current, index) {
        var enumName = enumKeyAttributes[index] || current;
        return {
          name: _this5.getEnumConstantName(enumName, name),
          literalTypeName: _this5.getEnumLiteralTypeName(enumName, name),
          value: current
        };
      });
    }
  }, {
    key: "_getEnumTypes",
    value: function _getEnumTypes(type) {
      switch (type) {
        case 'integer':
        case 'number':
          return 'number';

        default:
          return type;
      }
    }
  }, {
    key: "generateTypeFrom",
    value: function generateTypeFrom(prop, definition) {
      var _this6 = this;

      if (prop && prop.oneOf) {
        var candidates = prop.oneOf.map(function (obj) {
          var modelName = (0, _utils.getModelName)(obj);
          return modelName ? {
            isModel: true,
            type: modelName
          } : {
            isModel: false,
            type: obj.type
          };
        });
        return {
          propType: "PropTypes.oneOfType([".concat(_lodash.default.uniq(candidates.map(function (c) {
            return c.isModel ? "".concat(c.type, "PropType") : _getPropTypes(c.type);
          })).join(', '), "])"),
          typeScript: _lodash.default.uniq(candidates.map(function (c) {
            return _this6._getEnumTypes(c.type);
          })).join(' | ')
        };
      }

      if (prop.type === 'array' && prop.items && prop.items.oneOf) {
        var _this$generateTypeFro = this.generateTypeFrom(prop.items, definition),
            propType = _this$generateTypeFro.propType,
            typeScript = _this$generateTypeFro.typeScript;

        return {
          propType: "ImmutablePropTypes.listOf(".concat(propType, ")"),
          typeScript: typeScript ? "List<(".concat(typeScript, ")>") : ''
        };
      }

      if (definition) {
        return {
          propType: this._generatePropTypeFromDefinition(definition),
          typeScript: this._generateTypeScriptTypeFromDefinition(definition)
        };
      }
      /* 上記の分岐でcomponentsに定義されている型の配列のパターンは吸収されるため、*/

      /* ここではプリミティブ型の配列のパターンを扱う */


      if (prop.type === 'array' && prop.items && prop.items.type) {
        return {
          propType: "ImmutablePropTypes.listOf(".concat(_getPropTypes(prop.items.type), ")"),
          typeScript: "List<".concat(this._getEnumTypes(prop.items.type), ">")
        };
      }

      if (prop.type === 'object' && prop.properties) {
        if (!this.importImmutableMap) this.importImmutableMap = true;

        var props = _lodash.default.reduce(prop.properties, function (acc, value, key) {
          acc[_this6.attributeConverter(key)] = _getPropTypes(value.type, value.enum);
          return acc;
        }, {});

        return {
          propType: "ImmutablePropTypes.mapContains(".concat(JSON.stringify(props).replace(/"/g, ''), ")"),
          typeScript: 'Map<any, any>'
        };
      }
    }
  }, {
    key: "_generatePropTypeFromDefinition",
    value: function _generatePropTypeFromDefinition(definition) {
      var _this7 = this;

      var def;

      if (_lodash.default.isString(definition)) {
        def = definition.replace(/Schema$/, '');
        return "".concat(def, "PropType");
      }

      if (_lodash.default.isArray(definition)) {
        def = definition[0];

        var type = this._generatePropTypeFromDefinition(def);

        return "ImmutablePropTypes.listOf(".concat(type, ")");
      } else if (_lodash.default.isObject(definition)) {
        var _type = _lodash.default.reduce(definition, function (acc, value, key) {
          acc[key] = _this7._generatePropTypeFromDefinition(value);
          return acc;
        }, {});

        return "ImmutablePropTypes.mapContains(".concat(JSON.stringify(_type).replace(/"/g, ''), ")");
      }
    }
  }, {
    key: "_generateTypeScriptTypeFromDefinition",
    value: function _generateTypeScriptTypeFromDefinition(definition) {
      var def;

      if (_lodash.default.isString(definition)) {
        return definition.replace(/Schema$/, '');
      }

      if (_lodash.default.isArray(definition)) {
        def = definition[0];

        var type = this._generateTypeScriptTypeFromDefinition(def);

        return "List<".concat(type, ">");
      } else if (_lodash.default.isObject(definition)) {
        return 'Map<any, any>';
      }
    }
  }, {
    key: "_renderOverrideModel",
    value: function _renderOverrideModel(name, fileName, _ref6) {
      var props = _ref6.props;
      var enums = props.filter(function (prop) {
        return prop.enumObjects;
      }).reduce(function (acc, prop) {
        return acc.concat(prop.enumObjects.reduce(function (acc, eo) {
          return acc.concat(eo.name);
        }, []));
      }, []);
      var _this$templates2 = this.templates,
          override = _this$templates2.override,
          head = _this$templates2.head;
      if (!override || !head) return;
      return (0, _utils.render)(override, {
        name: name,
        fileName: fileName,
        enums: enums,
        usePropTypes: this.usePropType
      }, {
        head: head
      });
    }
  }], [{
    key: "templatePropNames",
    get: function get() {
      return ['type', 'default', 'enum'];
    }
  }]);

  return ModelGenerator;
}();

exports.default = ModelGenerator;

function getPropTypes() {
  // @ts-expect-error 'this' は型として注釈を持たないため、暗黙的に型 'any' になります。
  return _getPropTypes(this.type, this.enum, this.enumObjects);
}

function _getPropTypes(type, enums, enumObjects) {
  if (enumObjects) {
    var nameMap = enumObjects.map(function (current) {
      return current.name;
    });
    return "PropTypes.oneOf([".concat(nameMap.join(', '), "])");
  } else if (enums) {
    return "PropTypes.oneOf([".concat(enums.map(function (n) {
      return type === 'string' ? "'".concat(n, "'") : n;
    }).join(', '), "])");
  }

  switch (type) {
    case 'integer':
    case 'number':
      return 'PropTypes.number';

    case 'string':
      return 'PropTypes.string';

    case 'boolean':
      return 'PropTypes.bool';

    case 'array':
      return 'PropTypes.array';

    default:
      return type && type.propType ? type.propType : 'PropTypes.any';
  }
}

function getTypeScriptTypes() {
  // @ts-expect-error 'this' は型として注釈を持たないため、暗黙的に型 'any' になります。
  return _getTypeScriptTypes(this.type, this.enumObjects);
}

function _getTypeScriptTypes(type, enumObjects) {
  if (enumObjects) {
    var literalTypeNames = enumObjects.map(function (current) {
      return current.literalTypeName;
    });
    return "".concat(literalTypeNames.join(' | '));
  }

  switch (type) {
    case 'integer':
    case 'number':
      return 'number';

    case 'string':
      return 'string';

    case 'boolean':
      return 'boolean';

    default:
      return type && type.typeScript ? type.typeScript : 'any';
  }
}

function getDefaults() {
  // @ts-expect-error 'this' は型として注釈を持たないため、暗黙的に型 'any' になります。
  if (_lodash.default.isUndefined(this.default)) {
    return 'undefined';
  } // @ts-expect-error 'this' は型として注釈を持たないため、暗黙的に型 'any' になります。


  var enumObjects = this.enumObjects;

  if (enumObjects) {
    var _iterator = _createForOfIteratorHelper(enumObjects),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var enumObject = _step.value;
        // @ts-expect-error 'this' は型として注釈を持たないため、暗黙的に型 'any' になります。
        if (enumObject.value === this.default) return enumObject.name;
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  } // @ts-expect-error 'this' は型として注釈を持たないため、暗黙的に型 'any' になります。


  return this.type === 'string' ? "'".concat(this.default, "'") : this.default;
}