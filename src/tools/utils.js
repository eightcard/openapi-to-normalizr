const fs = require('fs');
const os = require('os');
const path = require('path');
const mkdirp = require('mkdirp');
const _ = require('lodash');
const mustache = require('mustache');
const jsYaml = require('js-yaml');
const $RefParser = require('json-schema-ref-parser');
const cwd = process.cwd();
const now = new Date();

function schemaName(modelName) {
  return `${modelName}Schema`;
}

function getModelName(schema) {
  return schema && schema['x-model-name'];
}

function applyIf(data, applyFn = (val) => val) {
  return data && applyFn(data);
}

function getSchemaDir(isV2) {
  return isV2 ? '#/definitions/' : '#/components/schemas/';
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
      const { schemaName } = _.find(components, ({ value }) => value['$ref'] === model || value['$$ref'] === model);
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

function parseSchema(schema, onSchema, isV2) {
  if (!_.isObject(schema)) return;

  const modelName = getModelName(schema);
  if (modelName && getIdAttribute(schema)) {
    return onSchema({type: 'model', value: schema});
  } else if (schema.oneOf && schema.discriminator) {
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

function readSpecFilePromise(path, options = {}) {
  const data = fs.readFileSync(path, 'utf8');
  const original = jsYaml.safeLoad(data);
  if (!options.dereference) return Promise.resolve(original);
  return new Promise((resolve, reject) => {
    $RefParser.dereference(path, (err, schema) => {
      schema = _.merge(original, schema);
      if (err) {
        reject(err);
        return;
      }
      resolve(schema);
    });
  });
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

function getRefFilesPath(spec) {
  if (_.isArray(spec)) {
    return spec.reduce((acc, item) => acc.concat(getRefFilesPath(item) || []), []);
  } else if (_.isObject(spec)) {
    if (spec.$ref) {
      const matches = spec.$ref.match(/^([^#].*)#/);
      if (matches) return [matches[1]];
    }
    return Object.keys(spec).reduce((acc, key) => acc.concat(getRefFilesPath(spec[key]) || []), []);
  }
}

function getPreparedSpecFiles(specFiles) {
  const readFiles = {};
  const definitions = {};
  const tmpDir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), '__openapi_to_normalizr__'));
  const allFiles = _.uniq(_.flattenDeep(getAllRelatedFiles(specFiles)));

  specFiles.concat(allFiles).forEach((p) => {
    const target = path.join(tmpDir, p);
    mkdirp.sync(path.dirname(target));

    const spec = jsYaml.safeLoad(fs.readFileSync(p));
    const schemas = spec.components && spec.components.schemas;
    if (schemas) {
      _.each(schemas, (model, name) => {
        model['x-model-name'] = name;
        definitions[name] = model;
      });
    }
    fs.writeFileSync(target, jsYaml.safeDump(spec));
  });
  return {
    filesPath: specFiles.map((p) => path.join(tmpDir, p)),
    definitions,
  };

  function getAllRelatedFiles(files) {
    return files.reduce((acc, filePath) => {
      const spec = jsYaml.safeLoad(fs.readFileSync(filePath));
      return acc.concat(_.uniq(getRefFilesPath(spec)).map((p) => {
        const refSpecPath = path.join(path.dirname(filePath), p);
        if (readFiles[refSpecPath]) {
          return refSpecPath;
        } else {
          readFiles[refSpecPath] = true;
          return [refSpecPath].concat(getAllRelatedFiles([refSpecPath]));
        }
      }));
    }, []);
  }
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
  readSpecFilePromise,
  getSchemaDir,
  changeFormat,
  getIdAttribute,
  getModelName,
  writeFile,
  getPreparedSpecFiles,
};
