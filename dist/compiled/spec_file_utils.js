"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const merge_1 = __importDefault(require("lodash/merge"));
const noop_1 = __importDefault(require("lodash/noop"));
const isArray_1 = __importDefault(require("lodash/isArray"));
const isObject_1 = __importDefault(require("lodash/isObject"));
const each_1 = __importDefault(require("lodash/each"));
const uniq_1 = __importDefault(require("lodash/uniq"));
const flatten_1 = __importDefault(require("lodash/flatten"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const json_schema_ref_parser_1 = __importDefault(require("json-schema-ref-parser"));
exports.ALTERNATIVE_REF_KEY = '__$ref__';
exports.MODEL_DEF_KEY = 'x-model-name';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isOperation = (obj) => 'tags' in obj;
const methodNames = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
const isMethodName = (str) => methodNames.includes(str);
function dereferenceSchema(spec) {
    return json_schema_ref_parser_1.default.dereference(spec);
}
exports.dereferenceSchema = dereferenceSchema;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function walkSchema(spec, callback = noop_1.default) {
    if (isArray_1.default(spec)) {
        return spec.forEach((item) => walkSchema(item, callback));
    }
    else if (isObject_1.default(spec)) {
        callback(spec);
        return each_1.default(spec, (value) => walkSchema(value, callback));
    }
}
exports.walkSchema = walkSchema;
function getRefFilesPath(spec) {
    const paths = [];
    walkSchema(spec, (obj) => {
        if (obj.$ref) {
            const matches = obj.$ref.match(/^([^#].*)#/);
            if (matches)
                paths.push(matches[1]);
        }
    });
    return paths;
}
function getPreparedSpec(specFiles, tags = []) {
    const readFiles = {};
    const allFiles = uniq_1.default(getAllRelatedFiles(specFiles));
    return merge_1.default({}, ...specFiles.concat(allFiles).map((p) => {
        const spec = js_yaml_1.default.safeLoad(fs_1.default.readFileSync(p).toString());
        if (specFiles.includes(p)) {
            removeUnusableOperation(spec);
        }
        else {
            delete spec.paths; // 指定されたspecファイル以外のpath情報は不要
        }
        applyAlternativeRef(spec);
        const schemas = spec.components && spec.components.schemas;
        if (schemas) {
            each_1.default(schemas, (model, name) => {
                model[exports.MODEL_DEF_KEY] = name;
            });
        }
        return spec;
    }));
    function isUsableOperation(operationTags) {
        if (tags.length === 0)
            return true;
        return operationTags && tags.some((t) => operationTags.includes(t));
    }
    function removeUnusableOperation(spec) {
        each_1.default(spec.paths, (operations) => {
            each_1.default(operations, (operation, method) => {
                if (isOperation(operation) && isMethodName(method) && !isUsableOperation(operation.tags)) {
                    delete operations[method];
                }
            });
        });
    }
    function getAllRelatedFiles(files) {
        return files.reduce((acc, filePath) => {
            const spec = js_yaml_1.default.safeLoad(fs_1.default.readFileSync(filePath).toString());
            const refFilesPaths = uniq_1.default(getRefFilesPath(spec));
            const relatedFilesPaths = flatten_1.default(refFilesPaths.map((p) => {
                const refSpecPath = path_1.default.join(path_1.default.dirname(filePath), p);
                if (readFiles[refSpecPath]) {
                    return refSpecPath;
                }
                else {
                    readFiles[refSpecPath] = true;
                    const relatedFiles = getAllRelatedFiles([refSpecPath]);
                    return [refSpecPath].concat(relatedFiles);
                }
            }));
            return acc.concat(relatedFilesPaths);
        }, []);
    }
    function applyAlternativeRef(spec) {
        walkSchema(spec, (obj) => {
            if (obj.$ref) {
                // mergeされるので内部refに変換
                const index = obj.$ref.indexOf('#');
                obj.$ref = obj.$ref.slice(index);
                obj[exports.ALTERNATIVE_REF_KEY] = obj.$ref;
            }
        });
        return spec;
    }
}
exports.getPreparedSpec = getPreparedSpec;
