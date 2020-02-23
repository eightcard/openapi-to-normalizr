"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mkdirp_1 = __importDefault(require("mkdirp"));
const lodash_1 = __importDefault(require("lodash"));
const mustache_1 = __importDefault(require("mustache"));
const spec_file_utils_1 = require("./spec_file_utils");
const cwd = process.cwd();
const now = new Date();
function schemaName(modelName) {
    return `${modelName}Schema`;
}
exports.schemaName = schemaName;
function getModelName(schema) {
    return schema && schema[spec_file_utils_1.MODEL_DEF_KEY];
}
exports.getModelName = getModelName;
function applyIf(data, applyFn = (val) => val) {
    return data && applyFn(data);
}
exports.applyIf = applyIf;
function getRef(schema) {
    return schema.$ref || schema.$$ref || schema[spec_file_utils_1.ALTERNATIVE_REF_KEY]; // $$ref by swagger-client
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
        ret.mapping = lodash_1.default.reduce(mapping, (acc, model, key) => {
            const { schemaName } = lodash_1.default.find(components, ({ value }) => getRef(value) === model);
            acc[key] = schemaName;
            return acc;
        }, {});
    }
    else {
        ret.mapping = lodash_1.default.reduce(components, (acc, { name, schemaName }) => {
            acc[name] = schemaName;
            return acc;
        }, {});
    }
    return ret;
}
function parseSchema(schema, onSchema) {
    if (!lodash_1.default.isObject(schema))
        return;
    const modelName = getModelName(schema);
    if (modelName && getIdAttribute(schema)) {
        return onSchema({
            type: 'model',
            value: schema,
        });
    }
    else if (schema.oneOf && schema.discriminator) {
        return onSchema({
            type: 'oneOf',
            value: parseOneOf(schema, onSchema),
        });
    }
    else if (schema.type === 'object') {
        return applyIf(parseSchema(schema.properties, onSchema));
    }
    else if (schema.type === 'array') {
        return applyIf(parseSchema(schema.items, onSchema), (val) => [val]);
    }
    else {
        const reduced = lodash_1.default.reduce(schema, (ret, val, key) => {
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
exports.parseSchema = parseSchema;
function isFileExistPromise(path) {
    return new Promise((resolve, reject) => {
        fs_1.default.access(path, (err) => {
            if (!err) {
                resolve(true); // file is exist.
                return;
            }
            if (err.code === 'ENOENT') {
                // file is not exist.
                resolve(false);
            }
            else {
                reject(err);
            }
        });
    });
}
exports.isFileExistPromise = isFileExistPromise;
function applyRequired(props, requiredList) {
    if (!lodash_1.default.isArray(requiredList)) {
        return props;
    }
    return lodash_1.default.reduce(props, (ret, prop, key) => {
        ret[key] = prop;
        if (requiredList.includes(key)) {
            prop.required = true;
        }
        return ret;
    }, {});
}
exports.applyRequired = applyRequired;
function resolvePath(str) {
    return path_1.default.isAbsolute(str) ? str : path_1.default.join(cwd, str);
}
exports.resolvePath = resolvePath;
function mkdirpPromise(dir) {
    return mkdirp_1.default(dir);
}
exports.mkdirpPromise = mkdirpPromise;
function writeFilePromise(path, data) {
    return new Promise((resolve, reject) => fs_1.default.writeFile(path, data, (err) => (err ? reject(err) : resolve())));
}
exports.writeFilePromise = writeFilePromise;
function writeFile(path, data) {
    return fs_1.default.writeFileSync(path, data);
}
exports.writeFile = writeFile;
function readTemplates(keys = [], templatePath) {
    return keys.reduce((ret, key) => {
        ret[key] = fs_1.default.readFileSync(templatePath[key], 'utf8');
        return ret;
    }, {});
}
exports.readTemplates = readTemplates;
function render(template, data = {}, option = {}) {
    if (option.withDate) {
        data.date = now;
        delete option.withDate;
    }
    return mustache_1.default.render(template, data, option);
}
exports.render = render;
function objectToTemplateValue(object) {
    if (!lodash_1.default.isObject(object)) {
        return;
    }
    return JSON.stringify(object, null, 2).replace(/"/g, '');
}
exports.objectToTemplateValue = objectToTemplateValue;
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
    }
    else {
        return obj;
    }
}
exports.changeFormat = changeFormat;
function getIdAttribute(model, name) {
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
exports.getIdAttribute = getIdAttribute;
function getModelDefinitions(spec) {
    return lodash_1.default.reduce(spec.components.schemas, (acc, model) => {
        const modelName = getModelName(model);
        if (modelName) {
            acc[modelName] = model;
        }
        return acc;
    }, {});
}
exports.getModelDefinitions = getModelDefinitions;
