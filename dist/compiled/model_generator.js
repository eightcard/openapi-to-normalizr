var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "lodash", "path", "./utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /* eslint-disable */
    // @ts-nocheck
    const lodash_1 = __importDefault(require("lodash"));
    const path_1 = __importDefault(require("path"));
    const utils_1 = require("./utils");
    /**
     * モデル定義からモデルファイルを作成
     */
    class ModelGenerator {
        constructor({ outputDir = '', outputBaseDir = '', templatePath = {}, usePropType = false, useTypeScript = false, attributeConverter = (str) => str, definitions = {}, extension = 'js', }) {
            this.outputDir = outputDir;
            this.outputBaseDir = outputBaseDir;
            this.templatePath = templatePath;
            this.usePropType = usePropType;
            this.useTypeScript = useTypeScript;
            this.attributeConverter = attributeConverter;
            this.definitions = definitions;
            this.extension = extension;
            this.templates = utils_1.readTemplates(['model', 'models', 'override', 'head', 'dependency', 'oneOf'], this.templatePath);
            this.writeModel = this.writeModel.bind(this);
            this.writeIndex = this.writeIndex.bind(this);
            this._modelNameList = [];
            this.importImmutableMap = false;
        }
        /**
         * モデル定義ごとに呼び出し
         * - モデルファイルを書き出す
         * - Promiseでモデル名(Petなど)を返す
         */
        writeModel(model, name) {
            const { properties } = model; // dereferenced
            const fileName = lodash_1.default.snakeCase(name);
            const idAttribute = utils_1.getIdAttribute(model, name);
            if (!idAttribute)
                return;
            // requiredはモデル定義のものを使う
            const required = this.definitions[name] && this.definitions[name].required;
            if (this._modelNameList.includes(name))
                return;
            this._modelNameList.push(name);
            return this._renderBaseModel(name, utils_1.applyRequired(properties, required), idAttribute).then(({ text, props }) => {
                utils_1.writeFile(path_1.default.join(this.outputBaseDir, `${fileName}.${this.extension}`), text);
                return this._writeOverrideModel(name, fileName, props).then(() => name);
            });
        }
        writeIndex(modelNameList = this._modelNameList) {
            const text = utils_1.render(this.templates.models, {
                models: lodash_1.default.uniq(modelNameList).map((name) => ({ fileName: lodash_1.default.snakeCase(name), name })),
            }, {
                head: this.templates.head,
            });
            return utils_1.writeFilePromise(path_1.default.join(this.outputDir, `index.${this.extension}`), text);
        }
        _writeOverrideModel(name, fileName, props) {
            const overrideText = this._renderOverrideModel(name, fileName, props);
            const filePath = path_1.default.join(this.outputDir, `${fileName}.${this.extension}`);
            return utils_1.isFileExistPromise(filePath).then((isExist) => isExist || utils_1.writeFilePromise(filePath, overrideText));
        }
        _prepareImportList(importList) {
            return lodash_1.default.uniqBy(importList, 'modelName').map(({ modelName, filePath }) => {
                return {
                    name: modelName,
                    schemaName: utils_1.schemaName(modelName),
                    filePath: filePath ? filePath : lodash_1.default.snakeCase(modelName),
                };
            });
        }
        _prepareIdAttribute(idAttribute) {
            const splits = idAttribute.split('.');
            if (splits[0] === 'parent') {
                splits.shift();
                return `(value, parent) => parent${splits
                    .map((str) => `['${this.attributeConverter(str)}']`)
                    .join('')}`;
            }
            if (splits.length === 1) {
                return `'${this.attributeConverter(splits[0])}'`;
            }
            return `(value) => value${splits.map((str) => `['${this.attributeConverter(str)}']`).join('')}`;
        }
        _renderBaseModel(name, properties, idAttribute) {
            return new Promise((resolve, reject) => {
                const importList = [];
                const oneOfs = [];
                let oneOfsCounter = 1;
                const dependencySchema = utils_1.parseSchema(properties, ({ type, value }) => {
                    if (type === 'model') {
                        const modelName = utils_1.getModelName(value);
                        if (utils_1.getIdAttribute(value, modelName)) {
                            importList.push({ modelName, value });
                            return utils_1.schemaName(modelName);
                        }
                    }
                    if (type === 'oneOf') {
                        const key = `oneOfSchema${oneOfsCounter++}`;
                        value.key = key;
                        oneOfs.push(value);
                        return key;
                    }
                });
                // reset
                this.importImmutableMap = false;
                const props = {
                    name,
                    idAttribute: this._prepareIdAttribute(idAttribute),
                    usePropTypes: this.usePropType,
                    useTypeScript: this.useTypeScript,
                    props: this._convertPropForTemplate(properties, dependencySchema),
                    schema: utils_1.objectToTemplateValue(utils_1.changeFormat(dependencySchema, this.attributeConverter)),
                    oneOfs: oneOfs.map((obj) => Object.assign(obj, {
                        mapping: utils_1.objectToTemplateValue(obj.mapping),
                        propertyName: this._prepareIdAttribute(obj.propertyName),
                    })),
                    importList: this._prepareImportList(importList),
                    getPropTypes,
                    getTypeScriptTypes,
                    getDefaults,
                    importImmutableMap: this.importImmutableMap,
                };
                const text = utils_1.render(this.templates.model, props, {
                    head: this.templates.head,
                    dependency: this.templates.dependency,
                    oneOf: this.templates.oneOf,
                });
                // import先のモデルを書き出し
                Promise.all(importList.map(({ value, modelName }) => this.writeModel(value, modelName))).then(() => resolve({ text, props }), // 自身の書き出しはここで実施
                reject);
            });
        }
        static get templatePropNames() {
            return ['type', 'default', 'enum'];
        }
        _convertPropForTemplate(properties, dependencySchema = {}) {
            return lodash_1.default.map(properties, (prop, name) => {
                const base = {
                    name: () => this.attributeConverter(name),
                    type: this.generateTypeFrom(prop, dependencySchema[name]),
                    alias: prop['x-attribute-as'],
                    required: prop.required === true,
                    isEnum: Boolean(prop.enum),
                    isValueString: prop.type === 'string',
                    propertyName: name,
                    enumObjects: this.getEnumObjects(this.attributeConverter(name), prop.enum, prop['x-enum-key-attributes']),
                    enumType: this._getEnumTypes(prop.type),
                    items: prop.items,
                };
                return this.constructor.templatePropNames.reduce((ret, key) => {
                    ret[key] = ret[key] || properties[name][key];
                    return ret;
                }, base);
            });
        }
        getEnumConstantName(enumName, propertyName) {
            const convertedName = lodash_1.default.upperCase(propertyName)
                .split(' ')
                .join('_');
            const convertedkey = lodash_1.default.upperCase(enumName)
                .split(' ')
                .join('_');
            // enumNameがマイナスの数値の時
            const resolvedkey = typeof enumName === 'number' && enumName < 0 ? `MINUS_${convertedkey}` : convertedkey;
            return `${convertedName}_${resolvedkey}`;
        }
        getEnumLiteralTypeName(enumName, propertyName) {
            const convertedName = lodash_1.default.startCase(propertyName)
                .split(' ')
                .join('');
            const convertedkey = lodash_1.default.startCase(enumName)
                .split(' ')
                .join('');
            // enumNameがマイナスの数値の時
            const resolvedkey = typeof enumName === 'number' && enumName < 0 ? `Minus${convertedkey}` : convertedkey;
            return `${convertedName}${resolvedkey}`;
        }
        getEnumObjects(name, enums, enumKeyAttributes = []) {
            if (!enums)
                return false;
            return enums.map((current, index) => {
                const enumName = enumKeyAttributes[index] || current;
                return {
                    name: this.getEnumConstantName(enumName, name),
                    literalTypeName: this.getEnumLiteralTypeName(enumName, name),
                    value: current,
                };
            });
        }
        _getEnumTypes(type) {
            switch (type) {
                case 'integer':
                case 'number':
                    return 'number';
                default:
                    return type;
            }
        }
        generateTypeFrom(prop, definition) {
            if (prop && prop.oneOf) {
                const candidates = prop.oneOf.map((obj) => {
                    const modelName = utils_1.getModelName(obj);
                    return modelName ? { isModel: true, type: modelName } : { isModel: false, type: obj.type };
                });
                return {
                    propType: `PropTypes.oneOfType([${lodash_1.default.uniq(candidates.map((c) => (c.isModel ? `${c.type}PropType` : _getPropTypes(c.type)))).join(', ')}])`,
                    typeScript: lodash_1.default.uniq(candidates.map((c) => this._getEnumTypes(c.type))).join(' | '),
                };
            }
            if (prop.type === 'array' && prop.items && prop.items.oneOf) {
                const { propType, typeScript } = this.generateTypeFrom(prop.items, definition);
                return {
                    propType: `ImmutablePropTypes.listOf(${propType})`,
                    typeScript: typeScript ? `List<(${typeScript})>` : '',
                };
            }
            if (definition) {
                return {
                    propType: this._generatePropTypeFromDefinition(definition),
                    typeScript: this._generateTypeScriptTypeFromDefinition(definition),
                };
            }
            /* 上記の分岐でcomponentsに定義されている型の配列のパターンは吸収されるため、*/
            /* ここではプリミティブ型の配列のパターンを扱う */
            if (prop.type === 'array' && prop.items && prop.items.type) {
                return {
                    propType: `ImmutablePropTypes.listOf(${_getPropTypes(prop.items.type)})`,
                    typeScript: `List<${this._getEnumTypes(prop.items.type)}>`,
                };
            }
            if (prop.type === 'object' && prop.properties) {
                if (!this.importImmutableMap)
                    this.importImmutableMap = true;
                const props = lodash_1.default.reduce(prop.properties, (acc, value, key) => {
                    acc[this.attributeConverter(key)] = _getPropTypes(value.type, value.enum);
                    return acc;
                }, {});
                return {
                    propType: `ImmutablePropTypes.mapContains(${JSON.stringify(props).replace(/"/g, '')})`,
                    typeScript: 'Map<any, any>',
                };
            }
        }
        _generatePropTypeFromDefinition(definition) {
            let def;
            if (lodash_1.default.isString(definition)) {
                def = definition.replace(/Schema$/, '');
                return `${def}PropType`;
            }
            if (lodash_1.default.isArray(definition)) {
                def = definition[0];
                const type = this._generatePropTypeFromDefinition(def);
                return `ImmutablePropTypes.listOf(${type})`;
            }
            else if (lodash_1.default.isObject(definition)) {
                const type = lodash_1.default.reduce(definition, (acc, value, key) => {
                    acc[key] = this._generatePropTypeFromDefinition(value);
                    return acc;
                }, {});
                return `ImmutablePropTypes.mapContains(${JSON.stringify(type).replace(/"/g, '')})`;
            }
        }
        _generateTypeScriptTypeFromDefinition(definition) {
            let def;
            if (lodash_1.default.isString(definition)) {
                return definition.replace(/Schema$/, '');
            }
            if (lodash_1.default.isArray(definition)) {
                def = definition[0];
                const type = this._generateTypeScriptTypeFromDefinition(def);
                return `List<${type}>`;
            }
            else if (lodash_1.default.isObject(definition)) {
                return 'Map<any, any>';
            }
        }
        _renderOverrideModel(name, fileName, { props }) {
            const enums = props
                .filter((prop) => prop.enumObjects)
                .reduce((acc, prop) => acc.concat(prop.enumObjects.reduce((acc, eo) => acc.concat(eo.name), [])), []);
            return utils_1.render(this.templates.override, {
                name,
                fileName,
                enums,
                usePropTypes: this.usePropType,
            }, {
                head: this.templates.head,
            });
        }
    }
    exports.default = ModelGenerator;
    function getPropTypes() {
        return _getPropTypes(this.type, this.enum, this.enumObjects);
    }
    function _getPropTypes(type, enums, enumObjects) {
        if (enumObjects) {
            const nameMap = enumObjects.map((current) => current.name);
            return `PropTypes.oneOf([${nameMap.join(', ')}])`;
        }
        else if (enums) {
            return `PropTypes.oneOf([${enums.map((n) => (type === 'string' ? `'${n}'` : n)).join(', ')}])`;
        }
        switch (type) {
            case 'integer':
            case 'number':
                return 'PropTypes.number';
            case 'string':
                return 'PropTypes.string';
            case 'boolean':
                return 'PropTypes.bool';
            case 'array':
                return 'PropTypes.array';
            default:
                return type && type.propType ? type.propType : 'PropTypes.any';
        }
    }
    function getTypeScriptTypes() {
        return _getTypeScriptTypes(this.type, this.enumObjects);
    }
    function _getTypeScriptTypes(type, enumObjects) {
        if (enumObjects) {
            const literalTypeNames = enumObjects.map((current) => current.literalTypeName);
            return `${literalTypeNames.join(' | ')}`;
        }
        switch (type) {
            case 'integer':
            case 'number':
                return 'number';
            case 'string':
                return 'string';
            case 'boolean':
                return 'boolean';
            default:
                return type && type.typeScript ? type.typeScript : 'any';
        }
    }
    function getDefaults() {
        if (lodash_1.default.isUndefined(this.default)) {
            return 'undefined';
        }
        if (this.enumObjects) {
            for (const enumObject of this.enumObjects) {
                if (enumObject.value === this.default)
                    return enumObject.name;
            }
        }
        return this.type === 'string' ? `'${this.default}'` : this.default;
    }
});
