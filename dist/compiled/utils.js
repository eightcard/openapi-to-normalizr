"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.schemaName = schemaName;
exports.getModelName = getModelName;
exports.applyIf = applyIf;
exports.parseSchema = parseSchema;
exports.isFileExistPromise = isFileExistPromise;
exports.applyRequired = applyRequired;
exports.resolvePath = resolvePath;
exports.mkdirpPromise = mkdirpPromise;
exports.writeFilePromise = writeFilePromise;
exports.writeFile = writeFile;
exports.readTemplates = readTemplates;
exports.render = render;
exports.objectToTemplateValue = objectToTemplateValue;
exports.changeFormat = changeFormat;
exports.getIdAttribute = getIdAttribute;
exports.getModelDefinitions = getModelDefinitions;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _mkdirp = _interopRequireDefault(require("mkdirp"));

var _lodash = _interopRequireDefault(require("lodash"));

var _mustache = _interopRequireDefault(require("mustache"));

var _spec_file_utils = require("./spec_file_utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var cwd = process.cwd();
var now = new Date();

function schemaName(modelName) {
  return "".concat(modelName, "Schema");
}

function getModelName(schema) {
  return schema && schema[_spec_file_utils.MODEL_DEF_KEY];
}

function applyIf(data) {
  var applyFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (val) {
    return val;
  };
  return data && applyFn(data);
}

function getRef(schema) {
  return schema.$ref || schema.$$ref || schema[_spec_file_utils.ALTERNATIVE_REF_KEY]; // $$ref by swagger-client
}

function parseOneOf(schema, onSchema) {
  var _schema$discriminator = schema.discriminator,
      propertyName = _schema$discriminator.propertyName,
      mapping = _schema$discriminator.mapping;
  var ret = {
    propertyName: propertyName
  };
  var components = schema.oneOf.map(function (model) {
    var modelName = getModelName(model);
    onSchema({
      type: 'model',
      value: model
    });
    return {
      name: modelName,
      schemaName: schemaName(modelName),
      value: model
    };
  });

  if (mapping) {
    ret.mapping = _lodash.default.reduce(mapping, function (acc, model, key) {
      var _$find = _lodash.default.find(components, function (_ref) {
        var value = _ref.value;
        return getRef(value) === model;
      }),
          schemaName = _$find.schemaName;

      acc[key] = schemaName;
      return acc;
    }, {});
  } else {
    ret.mapping = _lodash.default.reduce(components, function (acc, _ref2) {
      var name = _ref2.name,
          schemaName = _ref2.schemaName;
      acc[name] = schemaName;
      return acc;
    }, {});
  }

  return ret;
}

function parseSchema(schema, onSchema) {
  if (!_lodash.default.isObject(schema)) return;
  var modelName = getModelName(schema);

  if (modelName && getIdAttribute(schema)) {
    return onSchema({
      type: 'model',
      value: schema
    });
  } else if (schema.oneOf && schema.discriminator) {
    return onSchema({
      type: 'oneOf',
      value: parseOneOf(schema, onSchema)
    });
  } else if (schema.type === 'object') {
    return applyIf(parseSchema(schema.properties, onSchema));
  } else if (schema.type === 'array') {
    return applyIf(parseSchema(schema.items, onSchema), function (val) {
      return [val];
    });
  } else {
    var reduced = _lodash.default.reduce(schema, function (ret, val, key) {
      var tmp = parseSchema(val, onSchema);

      if (tmp) {
        ret[key] = tmp;
      }

      return ret;
    }, {});

    if (Object.keys(reduced).length > 0) {
      return reduced;
    }
  }
}

function isFileExistPromise(path) {
  return new Promise(function (resolve, reject) {
    _fs.default.access(path, function (err) {
      if (!err) {
        resolve(true); // file is exist.

        return;
      }

      if (err.code === 'ENOENT') {
        // file is not exist.
        resolve(false);
      } else {
        reject(err);
      }
    });
  });
}

function applyRequired(props, requiredList) {
  if (!_lodash.default.isArray(requiredList)) {
    return props;
  }

  return _lodash.default.reduce(props, function (ret, prop, key) {
    ret[key] = prop;

    if (requiredList.includes(key)) {
      prop.required = true;
    }

    return ret;
  }, {});
}

function resolvePath(str) {
  return _path.default.isAbsolute(str) ? str : _path.default.join(cwd, str);
}

function mkdirpPromise(dir) {
  return (0, _mkdirp.default)(dir);
}

function writeFilePromise(path, data) {
  return new Promise(function (resolve, reject) {
    return _fs.default.writeFile(path, data, function (err) {
      return err ? reject(err) : resolve();
    });
  });
}

function writeFile(path, data) {
  return _fs.default.writeFileSync(path, data);
}

function readTemplates() {
  var keys = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var templatePath = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return keys.reduce(function (ret, key) {
    ret[key] = _fs.default.readFileSync(templatePath[key], 'utf8');
    return ret;
  }, {});
}

function render(template) {
  var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var option = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (option.withDate) {
    data.date = now;
    delete option.withDate;
  }

  return _mustache.default.render(template, data, option);
}

function objectToTemplateValue(object) {
  if (!_lodash.default.isObject(object)) {
    return;
  }

  return JSON.stringify(object, null, 2).replace(/"/g, '');
}

function changeFormat(obj, transformer) {
  if (_typeof(obj) === 'object') {
    if (obj === null) {
      return obj;
    }

    var formattedObj = Array.isArray(obj) ? [] : {};
    var keys = Object.keys(obj);
    keys.forEach(function (key) {
      var value = obj[key];
      formattedObj[transformer(key)] = changeFormat(value, transformer);
    });
    return formattedObj;
  } else {
    return obj;
  }
}

function getIdAttribute(model, name) {
  var properties = model.properties;

  if (!properties) {
    if (name) {
      console.warn("".concat(name, " is not model definition.")); // eslint-disable-line no-console
    }

    return false;
  }

  var idAttribute = model['x-id-attribute'] ? model['x-id-attribute'] : 'id';

  if (!idAttribute.includes('.') && !properties[idAttribute]) {
    if (name) {
      console.warn("".concat(name, " is not generated without id attribute.")); // eslint-disable-line no-console
    }

    return false;
  }

  return idAttribute;
}

function getModelDefinitions(spec) {
  return _lodash.default.reduce(spec.components.schemas, function (acc, model) {
    var modelName = getModelName(model);

    if (modelName) {
      acc[modelName] = model;
    }

    return acc;
  }, {});
}