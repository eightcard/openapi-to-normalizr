// @ts-nocheck
import fs from 'fs';
import path from 'path';
import reduce from 'lodash/reduce';
import find from 'lodash/find';
import isObject from 'lodash/isObject';
import isArray from 'lodash/isArray';
import mkdirp from 'mkdirp';
import mustache from 'mustache';
import { MODEL_DEF_KEY, ALTERNATIVE_REF_KEY } from './spec_file_utils';

const cwd = process.cwd();
const now = new Date();

export function schemaName(modelName) {
  return `${modelName}Schema`;
}

export function getModelName(schema) {
  return schema && schema[MODEL_DEF_KEY];
}

export function applyIf(data, applyFn = (val) => val) {
  return data && applyFn(data);
}

function getRef(schema) {
  return schema.$ref || schema.$$ref || schema[ALTERNATIVE_REF_KEY]; // $$ref by swagger-client
}

function parseOneOf(schema, onSchema) {
  const { propertyName, mapping } = schema.discriminator;
  const ret = {
    propertyName,
  };
  const components = schema.oneOf.map((model) => {
    const modelName = getModelName(model);
    onSchema({
      type: 'model',
      value: model,
    });
    return {
      name: modelName,
      schemaName: schemaName(modelName),
      value: model,
    };
  });

  if (mapping) {
    ret.mapping = reduce(
      mapping,
      (acc, model, key) => {
        const { schemaName } = find(components, ({ value }) => getRef(value) === model);
        acc[key] = schemaName;
        return acc;
      },
      {},
    );
  } else {
    ret.mapping = reduce(
      components,
      (acc, { name, schemaName }) => {
        acc[name] = schemaName;
        return acc;
      },
      {},
    );
  }
  return ret;
}

export function parseSchema(schema, onSchema) {
  if (!isObject(schema)) return;

  const modelName = getModelName(schema);
  if (modelName && getIdAttribute(schema)) {
    return onSchema({
      type: 'model',
      value: schema,
    });
  } else if (schema.oneOf && schema.discriminator) {
    return onSchema({
      type: 'oneOf',
      value: parseOneOf(schema, onSchema),
    });
  } else if (schema.type === 'object') {
    return applyIf(parseSchema(schema.properties, onSchema));
  } else if (schema.type === 'array') {
    return applyIf(parseSchema(schema.items, onSchema), (val) => [val]);
  } else {
    const reduced = reduce(
      schema,
      (ret, val, key) => {
        const tmp = parseSchema(val, onSchema);
        if (tmp) {
          ret[key] = tmp;
        }
        return ret;
      },
      {},
    );
    if (Object.keys(reduced).length > 0) {
      return reduced;
    }
  }
}

export function isFileExistPromise(path) {
  return new Promise((resolve, reject) => {
    fs.access(path, (err) => {
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

export function applyRequired(props, requiredList) {
  if (!isArray(requiredList)) {
    return props;
  }
  return reduce(
    props,
    (ret, prop, key) => {
      ret[key] = prop;
      if (requiredList.includes(key)) {
        prop.required = true;
      }
      return ret;
    },
    {},
  );
}

export function resolvePath(str) {
  return path.isAbsolute(str) ? str : path.join(cwd, str);
}

export function mkdirpPromise(dir) {
  return mkdirp(dir);
}

export function writeFilePromise(path: string, data: string) {
  return new Promise<void>((resolve, reject) =>
    fs.writeFile(path, data, (err) => (err ? reject(err) : resolve())),
  );
}

export function writeFile(path, data) {
  return fs.writeFileSync(path, data);
}

export function readTemplates(keys: string[] = [], templatePath: TemplatePath = {}) {
  return keys.reduce((ret: { [key: string]: string }, key) => {
    ret[key] = fs.readFileSync(templatePath[key], 'utf8');
    return ret;
  }, {});
}

export function render(
  template: string,
  data: { [key: string]: TODO } = {},
  option: { [key: string]: string } = {},
) {
  if (option.withDate) {
    data.date = now;
    delete option.withDate;
  }
  return mustache.render(template, data, option);
}

export function objectToTemplateValue(object) {
  if (!isObject(object)) {
    return;
  }
  return JSON.stringify(object, null, 2).replace(/"/g, '');
}

export function changeFormat(obj, transformer) {
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

export function getIdAttribute(model, name) {
  const { properties } = model;
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

export function getModelDefinitions(spec) {
  return reduce(
    spec.components.schemas,
    (acc, model) => {
      const modelName = getModelName(model);
      if (modelName) {
        acc[modelName] = model;
      }
      return acc;
    },
    {},
  );
}
