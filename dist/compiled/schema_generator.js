"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const each_1 = __importDefault(require("lodash/each"));
const snakeCase_1 = __importDefault(require("lodash/snakeCase"));
const uniqBy_1 = __importDefault(require("lodash/uniqBy"));
const reduce_1 = __importDefault(require("lodash/reduce"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
/**
 * レスポンス定義からnormalizr用のschemaを作成
 * content-typeはjsonのみサポート
 */
class SchemaGenerator {
    constructor({ outputPath = '', templatePath = {}, modelGenerator, modelsDir, attributeConverter = (str) => str, useTypeScript, extension = 'js', }) {
        this.outputPath = outputPath;
        const { dir, name } = path_1.default.parse(this.outputPath);
        this.outputDir = dir;
        this.outputFileName = `${name}.${extension}`;
        this.templatePath = templatePath;
        this.modelGenerator = modelGenerator;
        this.modelsDir = modelsDir;
        this.attributeConverter = attributeConverter;
        this.templates = utils_1.readTemplates(['schema', 'head', 'oneOf'], this.templatePath);
        this.parsedObjects = {};
        this._importModels = [];
        this.oneOfs = [];
        this.parse = this.parse.bind(this);
        this.write = this.write.bind(this);
        this.useTypeScript = useTypeScript;
    }
    /**
     * API(id)ごとのスキーマをパース
     * - 内部でモデル情報をメモ
     */
    parse(id, responses) {
        each_1.default(responses, (response, code) => {
            const contents = SchemaGenerator.getJsonContents(response);
            if (!contents) {
                console.warn(`${id}:${code} does not have content.`);
                return;
            }
            const onSchema = ({ type, value }) => {
                if (type === 'model') {
                    const modelName = utils_1.getModelName(value);
                    if (utils_1.getIdAttribute(value, modelName)) {
                        this._importModels.push({
                            modelName,
                            model: value,
                        });
                        return utils_1.schemaName(modelName);
                    }
                }
                if (type === 'oneOf') {
                    const count = this.oneOfs.length + 1;
                    const key = `oneOfSchema${count}`;
                    value.key = key;
                    this.oneOfs.push(value);
                    return key;
                }
            };
            const data = utils_1.parseSchema(contents.schema, onSchema);
            utils_1.applyIf(data, (val) => {
                this.parsedObjects[id] = this.parsedObjects[id] || {};
                this.parsedObjects[id][code] = val;
            });
        });
    }
    /**
     * パース情報とテンプレートからschema.jsとmodels/index.js書き出し
     */
    write() {
        return Promise.all([
            this._writeSchemaFile(),
            this.importModels.map(({ modelName, model }) => this.modelGenerator.writeModel(model, modelName)),
        ]).then(() => {
            this.modelGenerator.writeIndex();
        });
    }
    _writeSchemaFile() {
        const oneOfs = this.oneOfs.map((obj) => Object.assign(obj, {
            mapping: utils_1.objectToTemplateValue(obj.mapping),
            propertyName: `'${this.attributeConverter(obj.propertyName)}'`,
        }));
        const text = utils_1.render(this.templates.schema, {
            importList: this._prepareImportList(),
            data: utils_1.objectToTemplateValue(this.formattedSchema),
            hasOneOf: oneOfs.length > 0,
            oneOfs,
            useTypeScript: this.useTypeScript,
        }, {
            head: this.templates.head,
            oneOf: this.templates.oneOf,
        });
        return utils_1.writeFilePromise(path_1.default.join(this.outputDir, this.outputFileName), text);
    }
    _prepareImportList() {
        const relative = path_1.default.relative(this.outputDir, this.modelsDir);
        return this.importModels.map(({ modelName }) => {
            return {
                name: utils_1.schemaName(modelName),
                path: path_1.default.join(relative, snakeCase_1.default(modelName)),
            };
        });
    }
    get importModels() {
        return uniqBy_1.default(this._importModels, 'modelName');
    }
    get formattedSchema() {
        return reduce_1.default(this.parsedObjects, (acc, schema, key) => {
            acc[key] = utils_1.changeFormat(schema, this.attributeConverter);
            return acc;
        }, {});
    }
    static getJsonContents(response) {
        // ResponseObject
        if ('content' in response) {
            return response.content && response.content['application/json'];
        }
    }
}
exports.default = SchemaGenerator;
