const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const _ = require('lodash');
const mustache = require('mustache');
const cwd = process.cwd();
const now = new Date();
const { MODEL_DEF_KEY, ALTERNATIVE_REF_KEY } = require('./spec_file_utils');

function schemaName(modelName) {
  return `${modelName}Schema`;
}

function getModelName(schema) {
  return schema && schema[MODEL_DEF_KEY];
}

function applyIf(data, applyFn = (val) => val) {
  return data && applyFn(data);
}

function getRef(schema) {
  return schema.$ref || schema.$$ref || schema[ALTERNATIVE_REF_KEY]; // $$ref by swagger-client
}

function parseOneOf(schema, onSchema) {
  const {propertyName, mapping} = schema.discriminator;
  const ret = {propertyName};
  const components = schema.oneOf.map((model) => {
    const modelName = getModelName(model);
    onSchema({type: 'model', value: model});
    return {name: modelName, schemaName: schemaName(modelName), value: model};
  });

  if (mapping) {
    ret.mapping = _.reduce(mapping, (acc, model, key) => {
      const { schemaName } = _.find(components, ({ value }) => getRef(value) === model);
      acc[key] = schemaName;
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

function parseSchema(schema, onSchema) {
  if (!_.isObject(schema)) return;

  const modelName = getModelName(schema);
  if (modelName && getIdAttribute(schema)) {
    return onSchema({type: 'model', value: schema});
  } else if (schema.oneOf && schema.discriminator) {
    return onSchema({type: 'oneOf', value: parseOneOf(schema, onSchema)});
  } else if (schema.type === 'object') {
    return applyIf(parseSchema(schema.properties, onSchema));
  } else if (schema.type === 'array') {
    return applyIf(parseSchema(schema.items, onSchema), (val) => [val]);
  } else {
    const reduced =_.reduce(schema, (ret, val, key) => {
      const tmp = parseSchema(val, onSchema);
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

function writeFile(path, data) {
  return fs.writeFileSync(path, data);
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
      console.warn(`${name} is not model definition.`); // eslint-disable-line no-console
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

function getModelDefinitions(spec) {
  return _.reduce(spec.components.schemas, (acc, model) => {
    const modelName = getModelName(model);
    if (modelName) {
      acc[modelName] = model;
    }
    return acc;
  }, {});
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
  changeFormat,
  getIdAttribute,
  getModelName,
  writeFile,
  getModelDefinitions,
};
