import fs from 'fs';
import os from 'os';
import path from 'path';
import mkdirp from 'mkdirp';
import merge from 'lodash/merge';
import noop from 'lodash/noop';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import each from 'lodash/each';
import uniq from 'lodash/uniq';
import flatten from 'lodash/flatten';
import jsYaml from 'js-yaml';
import $RefParser from 'json-schema-ref-parser';
import { OpenAPIV3 } from 'openapi-types';

const ALTERNATIVE_REF_KEY = '__$ref__';
const MODEL_DEF_KEY = 'x-model-name';

/* library alias */

type Document = OpenAPIV3.Document;
type Operation = OpenAPIV3.OperationObject;
type Schema =
  | OpenAPIV3.ReferenceObject
  | OpenAPIV3.ArraySchemaObject
  | OpenAPIV3.NonArraySchemaObject;
type Model = Schema & {
  [MODEL_DEF_KEY]?: string;
};

const isOperation = (obj: any): obj is Operation => 'tags' in obj;

const methodNames = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;

// メソッド名の Union String Literal Types = 'get' | 'put' | ... | 'trace';
type MethodName = (typeof methodNames)[number];

const isMethodName = (str: string): str is MethodName => methodNames.includes(str as any);

function readSpecFilePromise(path: string, options: OptionObject = {}) {
  const data = fs.readFileSync(path, 'utf8');
  const original: Document = jsYaml.safeLoad(data);
  if (!options.dereference) return Promise.resolve(original);
  return new Promise((resolve, reject) => {
    $RefParser.dereference(path, (err, schema) => {
      schema = merge(original, schema);
      if (err) {
        reject(err);
        return;
      }
      resolve(schema);
    });
  });
}

function walkSchema(spec: any, callback: (s: any) => void = noop): any {
  if (isArray(spec)) {
    return spec.forEach((item) => walkSchema(item, callback));
  } else if (isObject(spec)) {
    callback(spec);
    return each(spec, (value) => walkSchema(value, callback));
  }
}

function getRefFilesPath(spec: Document) {
  const paths: string[] = [];
  walkSchema(spec, (obj) => {
    if (obj.$ref) {
      const matches = obj.$ref.match(/^([^#].*)#/);
      if (matches) paths.push(matches[1]);
    }
  });
  return paths;
}

function applyAlternativeRef(spec: Document) {
  walkSchema(spec, (obj) => {
    if (obj.$ref) {
      obj[ALTERNATIVE_REF_KEY] = obj.$ref;
    }
  });
  return spec;
}

function convertToLocalDefinition(spec: Document) {
  walkSchema(spec, (obj) => {
    if (obj.$ref) {
      const index = obj.$ref.indexOf('#');
      obj.$ref = obj.$ref.slice(index);
    }
  });
  return spec;
}

function getPreparedSpecFilePaths(specFiles: string[], tags: string[] = []) {
  const readFiles: { [key: string]: boolean } = {};
  const tmpDir = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), '__openapi_to_normalizr__'),
  );
  const allFiles = uniq(getAllRelatedFiles(specFiles));

  return specFiles.concat(allFiles).map((p) => {
    const target = path.join(tmpDir, p);
    mkdirp.sync(path.dirname(target));
    const spec: Document = jsYaml.safeLoad(fs.readFileSync(p).toString());
    if (specFiles.includes(p)) {
      removeUnusableOperation(spec);
    } else {
      delete spec.paths; // 指定されたspecファイル以外のpath情報は不要
    }
    applyAlternativeRef(spec);
    const schemas = spec.components && spec.components.schemas;
    if (schemas) {
      each(schemas, (model: Model, name) => {
        model[MODEL_DEF_KEY] = name;
      });
    }
    fs.writeFileSync(target, jsYaml.safeDump(spec));
    return target;
  });

  function isUsableOperation(operationTags?: string[]) {
    if (tags.length === 0) return true;
    return operationTags && tags.some((t) => operationTags.includes(t));
  }

  function removeUnusableOperation(spec: Document) {
    each(spec.paths, (operations) => {
      each(operations, (operation, method) => {
        if (isOperation(operation) && isMethodName(method) && !isUsableOperation(operation.tags)) {
          delete operations[method];
        }
      });
    });
  }

  function getAllRelatedFiles(files: string[]): string[] {
    return files.reduce((acc: string[], filePath) => {
      const spec: Document = jsYaml.safeLoad(fs.readFileSync(filePath).toString());
      const refFilesPaths = uniq(getRefFilesPath(spec));
      const relatedFilesPaths = flatten(
        refFilesPaths.map((p: string): string | string[] => {
          const refSpecPath = path.join(path.dirname(filePath), p);
          if (readFiles[refSpecPath]) {
            return refSpecPath;
          } else {
            readFiles[refSpecPath] = true;
            const relatedFiles = getAllRelatedFiles([refSpecPath]);
            return [refSpecPath].concat(relatedFiles);
          }
        }),
      );
      return acc.concat(relatedFilesPaths);
    }, []);
  }
}

module.exports = {
  readSpecFilePromise,
  getPreparedSpecFilePaths,
  convertToLocalDefinition,
  walkSchema,
  ALTERNATIVE_REF_KEY,
  MODEL_DEF_KEY,
};
