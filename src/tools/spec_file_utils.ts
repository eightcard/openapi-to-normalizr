import fs from 'fs';
import path from 'path';
import merge from 'lodash/merge';
import noop from 'lodash/noop';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import each from 'lodash/each';
import uniq from 'lodash/uniq';
import flatten from 'lodash/flatten';
import jsYaml from 'js-yaml';
import $RefParser from '@apidevtools/json-schema-ref-parser';
import { OpenAPIV3 } from 'openapi-types';

export const ALTERNATIVE_REF_KEY = '__$ref__';
export const MODEL_DEF_KEY = 'x-model-name';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isDocument = (obj: any): obj is Document =>
  'openapi' in obj && 'info' in obj && 'paths' in obj;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isOperation = (obj: any): obj is Operation => 'tags' in obj;

const methodNames = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;

// メソッド名の Union String Literal Types = 'get' | 'put' | ... | 'trace';
type MethodName = (typeof methodNames)[number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isMethodName = (str: string): str is MethodName => methodNames.includes(str as any);

export function dereferenceSchema(spec: Document) {
  return $RefParser.dereference(spec);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function walkSchema(spec: any, callback: (s: any) => void = noop): any {
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

export function getPreparedSpec(specFiles: string[] = [], tags: string[] = []) {
  const readFiles: { [key: string]: boolean } = {};
  const allFiles = uniq(getAllRelatedFiles(specFiles));

  return merge(
    {},
    ...specFiles.concat(allFiles).map((p) => {
      const spec = jsYaml.load(fs.readFileSync(p).toString());
      if (isDocument(spec)) {
        if (specFiles.includes(p)) {
          removeUnusableOperation(spec);
        } else {
          // 指定されたspecファイル以外のpath情報は不要
          spec.paths = {};
        }
        applyAlternativeRef(spec);
        const schemas = spec.components && spec.components.schemas;
        if (schemas) {
          each(schemas, (model: Model, name) => {
            model[MODEL_DEF_KEY] = name;
          });
        }
      }
      return spec;
    }),
  );

  function isUsableOperation(operationTags?: string[]) {
    if (tags.length === 0) return true;
    return operationTags && tags.some((t) => operationTags.includes(t));
  }

  function removeUnusableOperation(spec: Document) {
    each(spec.paths, (operations) => {
      if (!operations) return;
      each(operations, (operation, method) => {
        if (isOperation(operation) && isMethodName(method) && !isUsableOperation(operation.tags)) {
          delete operations[method];
        }
      });
    });
  }

  function getAllRelatedFiles(files: string[]): string[] {
    return files.reduce((acc: string[], filePath) => {
      const spec = jsYaml.load(fs.readFileSync(filePath).toString());
      const refFilesPaths = isDocument(spec) ? uniq(getRefFilesPath(spec)) : [];
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

  function applyAlternativeRef(spec: Document) {
    walkSchema(spec, (obj) => {
      if (obj.$ref) {
        // mergeされるので内部refに変換
        const index = obj.$ref.indexOf('#');
        obj.$ref = obj.$ref.slice(index);
        obj[ALTERNATIVE_REF_KEY] = obj.$ref;
      }
    });
    return spec;
  }
}
