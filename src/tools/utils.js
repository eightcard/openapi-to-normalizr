const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const _ = require('lodash');
const mustache = require('mustache');
const jsYaml = require('js-yaml');
const cwd = process.cwd();
const now = new Date();

function schemaName(modelName) {
  return `${modelName}Schema`;
}

function applyIf(data, applyFn = (val) => val) {
  return data && applyFn(data);
}

function getSchemaDir(isV2) {
  return isV2 ? '#/definitions/' : '#/components/schemas/';
}

function parseModelName(name, isV2) {
  const schemasDir = getSchemaDir(isV2);
  return name.split(schemasDir).pop();
}

function parseOneOf(schema, onSchema, isV2) {
  const {propertyName, mapping} = schema.discriminator;
  const ret = {propertyName};
  const components = schema.oneOf.map((ref) => {
    ref = ref['$$ref'] || ref['$ref'];
    const model = parseModelName(ref, isV2);
    onSchema({type: 'model', value: model}); // for import list
    return {name: model, schemaName: schemaName(model)};
  });

  if (mapping) {
    ret.mapping = _.reduce(mapping, (acc, model, key) => {
      model = parseModelName(model, isV2);
      acc[key] = schemaName(model);
      return acc;
    }, {});
  } else {
    ret.mapping = _.reduce(components, (acc, {name, schemaName}) => {
      acc[name] = schemaName;
      return acc;
    }, {});
  }
  return ret;
}

function parseSchema(schema, onSchema, isV2) {
  const schemasDir = getSchemaDir(isV2);
  if (!_.isObject(schema)) return;

  const ref = schema['$$ref'] || schema['$ref']; // $$ref is resolved reference.
  if (ref && ref.match(schemasDir) && isModelDefinition(schema)) {
    const model = parseModelName(ref, isV2);
    return onSchema({type: 'model', value: model});
  } else if (schema.oneOf) {
    return onSchema({type: 'oneOf', value: parseOneOf(schema, onSchema, isV2)});
  } else if (schema.type === 'object') {
    return applyIf(parseSchema(schema.properties, onSchema, isV2));
  } else if (schema.type === 'array') {
    return applyIf(parseSchema(schema.items, onSchema, isV2), (val) => [val]);
  } else {
    const reduced =_.reduce(schema, (ret, val, key) => {
      const tmp = parseSchema(val, onSchema, isV2);
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
  return new Promise((resolve, reject) => {
    fs.access(path, (err) => {
      if (!err) {
        resolve(true); // file is exist.
        return;
      }
      if (err.code === 'ENOENT') {  // file is not exist.
        resolve(false);
      } else {
        reject(err);
      }
    });
  });
}

function applyRequired(props, requiredList) {
  if (!_.isArray(requiredList)) {
    return props;
  }

  return _.reduce(props, (ret, prop, key) => {
    ret[key] = prop;
    if (requiredList.includes(key)) {
      prop.required = true;
    }
    return ret;
  }, {});
}

function resolvePath(str) {
  return path.isAbsolute(str) ? str : path.join(cwd, str);
}

function mkdirpPromise(dir) {
  return new Promise((resolve, reject) => mkdirp(dir, (err) => err ? reject(err) : resolve()));
}

function writeFilePromise(path, data) {
  return new Promise((resolve, reject) => fs.writeFile(path, data, (err) => err ? reject(err) : resolve()));
}

function readTemplates(keys = [], templatePath) {
  return keys.reduce((ret, key) => {
    ret[key] = fs.readFileSync(templatePath[key], 'utf8');
    return ret;
  }, {});
}

function render(template, data = {}, option = {}) {
  if (option.withDate) {
    data.date = now;
    delete option.withDate;
  }
  return mustache.render(template, data, option);
}

function objectToTemplateValue(object) {
  if (!_.isObject(object)) {
    return;
  }
  return JSON.stringify(object, null, 2).replace(/"/g, '');
}

function readSpecFile(path) {
  const data = fs.readFileSync(path, 'utf8');
  return jsYaml.safeLoad(data);
}

function changeFormat(obj, transformer) {
  if (typeof obj === 'object') {
    if (obj === null) {
      return obj;
    }
    const formattedObj = Array.isArray(obj) ? [] : {};
    const keys = Object.keys(obj);
    keys.forEach((key) => {
      const value = obj[key];
      formattedObj[transformer(key)] = changeFormat(value, transformer);
    });
    return formattedObj;
  } else {
    return obj;
  }
}

function getIdAttribute(model, name) {
  const {properties} = model;
  if (!properties) {
    if (name) {
      console.warn(`${name} does not model definition.`); // eslint-disable-line no-console
    }
    return false;
  }
  const idAttribute = model['x-id-attribute'] ? model['x-id-attribute'] : 'id';
  if (!idAttribute.includes('.') && !properties[idAttribute]) {
    if (name) {
      console.warn(`${name} is not generated without id attribute.`); // eslint-disable-line no-console
    }
    return false;
  }
  return idAttribute;
}

function getEnumKeysAttribute(model) {
  if (model['enum']) return false;
  const enumKeyAttribute = model['x-enum-key-attribute'] ? model['x-enum-key-attribute'] : undefined;
  return enumKeyAttribute;
}

function isModelDefinition(model, name) {
  if (model['$ref'] && !model['$$ref']) {
    // cannot check because of no dereferenced
    return true;
  }
  return Boolean(getIdAttribute(model, name));
}

module.exports = {
  resolvePath,
  mkdirpPromise,
  writeFilePromise,
  readTemplates,
  parseSchema,
  schemaName,
  applyIf,
  isFileExistPromise,
  applyRequired,
  render,
  objectToTemplateValue,
  readSpecFile,
  getSchemaDir,
  changeFormat,
  getIdAttribute,
  getEnumKeysAttribute,
  isModelDefinition,
  parseModelName,
};
