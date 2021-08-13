import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import _ from 'lodash';
import mustache from 'mustache';
import { MODEL_DEF_KEY, ALTERNATIVE_REF_KEY } from './spec_file_utils';

const cwd = process.cwd();
const now = new Date();

export function schemaName(modelName: string | undefined): string {
  return `${modelName}Schema`;
}

export function getModelName(schema: TODO): string | undefined {
  return schema && schema[MODEL_DEF_KEY];
}

export function applyIf<Data>(data: Data, applyFn: (val: Data) => TODO = (val) => val) {
  return data && applyFn(data);
}

function getRef(schema: TODO) {
  return schema.$ref || schema.$$ref || schema[ALTERNATIVE_REF_KEY]; // $$ref by swagger-client
}

function parseOneOf(schema: TODO, onSchema: TODO) {
  const { propertyName, mapping } = schema.discriminator;
  const ret: { [key: string]: TODO } = {
    propertyName,
  };
  const components = schema.oneOf.map((model: TODO) => {
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
    ret.mapping = _.reduce(
      mapping,
      (acc: { [key: string]: TODO }, model, key) => {
        const { schemaName } = _.find(components, ({ value }) => getRef(value) === model);
        acc[key] = schemaName;
        return acc;
      },
      {},
    );
  } else {
    ret.mapping = _.reduce(
      components,
      (acc: { [key: string]: TODO }, { name, schemaName }) => {
        acc[name] = schemaName;
        return acc;
      },
      {},
    );
  }
  return ret;
}

export function parseSchema(schema: TODO, onSchema: TODO): TODO {
  if (!_.isObject(schema)) return;

  const modelName = getModelName(schema);
  if (modelName && getIdAttribute(schema)) {
    return onSchema({
      type: 'model',
      value: schema,
    });

    // @ts-expect-error oneOfやdiscriminatorがあると認識されていない
  } else if (schema.oneOf && schema.discriminator) {
    return onSchema({
      type: 'oneOf',
      value: parseOneOf(schema, onSchema),
    });

    // @ts-expect-error typeがあると認識されていない
  } else if (schema.type === 'object') {
    // @ts-expect-error propertiesがあると認識されていない
    return applyIf(parseSchema(schema.properties, onSchema));

    // @ts-expect-error typeがあると認識されていない
  } else if (schema.type === 'array') {
    // @ts-expect-error itemsがあると認識されていない
    return applyIf(parseSchema(schema.items, onSchema), (val) => [val]);
  } else {
    const reduced = _.reduce(
      schema,
      (ret: { [key: string]: TODO }, val, key) => {
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

export function isFileExistPromise(path: string) {
  return new Promise((resolve, reject) => {
    fs.access(path, (err) => {
      if (!err) {
        // file is exist.
        resolve(true);
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

export function applyRequired(props: TODO, requiredList: TODO[]) {
  if (!_.isArray(requiredList)) {
    return props;
  }
  return _.reduce(
    props,
    (ret: { [key: string]: TODO }, prop, key) => {
      ret[key] = prop;
      if (requiredList.includes(key)) {
        prop.required = true;
      }
      return ret;
    },
    {},
  );
}

export function resolvePath(str: string) {
  return path.isAbsolute(str) ? str : path.join(cwd, str);
}

export function mkdirpPromise(dir: string) {
  return mkdirp(dir);
}

export function writeFilePromise(path: string, data?: string) {
  if (!data) return Promise.resolve();
  return new Promise<void>((resolve, reject) =>
    fs.writeFile(path, data, (err) => (err ? reject(err) : resolve())),
  );
}

export function writeFile(path: string, data: TODO) {
  return fs.writeFileSync(path, data);
}

export function readTemplates(keys: (keyof TemplatePath)[] = [], templatePath: TemplatePath = {}) {
  return keys.reduce((ret: Templates, key) => {
    const path = templatePath[key];
    if (path) {
      ret[key] = fs.readFileSync(path, 'utf8');
    }
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

export function objectToTemplateValue(object: TODO) {
  if (!_.isObject(object)) {
    return;
  }
  return JSON.stringify(object, null, 2).replace(/"/g, '');
}

export function changeFormat(obj: TODO, transformer: TODO) {
  if (typeof obj === 'object') {
    if (obj === null) {
      return obj;
    }
    const formattedObj: TODO = Array.isArray(obj) ? [] : {};
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

export function getIdAttribute(model: TODO, name?: string) {
  const { properties } = model;
  if (!properties) {
    if (name) {
      console.warn(`${name} is not model definition.`); // eslint-disable-line no-console
    }
    return false;
  }
  const idAttribute = model['x-id-attribute'] || 'id';
  if (!idAttribute.includes('.') && !properties[idAttribute]) {
    if (name) {
      console.warn(`${name} is not generated without id attribute.`); // eslint-disable-line no-console
    }
    return false;
  }
  return idAttribute;
}

export function getModelDefinitions(spec: TODO) {
  return _.reduce(
    spec.components.schemas,
    (acc: { [key: string]: TODO }, model) => {
      const modelName = getModelName(model);
      if (modelName) {
        acc[modelName] = model;
      }
      return acc;
    },
    {},
  );
}
