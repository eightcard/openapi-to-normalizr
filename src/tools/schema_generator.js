const _ = require('lodash');
const path = require('path');
const {
  applyIf, schemaName, parseSchema, objectToTemplateValue,
  readTemplates, writeFilePromise, render, changeFormat,
} = require('./utils');

/**
 * レスポンス定義からnormalizr用のschemaを作成
 * content-typeはjsonのみサポート
 */

class SchemaGenerator {
  constructor({outputPath = '', templatePath = {}, modelNameList = [], modelsDir, isV2, attributeConverter = str => str}) {
    this.outputPath = outputPath;
    const {dir, name, ext} = path.parse(this.outputPath);
    this.outputDir = dir;
    this.outputFileName = `${name}${ext}`;
    this.templatePath = templatePath;
    this.modelNameList = modelNameList; // 利用できるモデル一覧
    this.modelsDir = modelsDir;
    this.isV2 = isV2;
    this.attributeConverter = attributeConverter;
    this.templates = readTemplates(['schema', 'head', 'oneOf'], this.templatePath);
    this.parsedObjects = {};
    this.importList = [];
    this.oneOfs = [];
    this.parse = this.parse.bind(this);
    this.write = this.write.bind(this);
  }

  /**
   * API(id)ごとのスキーマをパース
   */
  parse(id, responses) {
    if (this.modelNameList.length === 0) {
      console.warn('need available models list'); // eslint-disable-line no-console
      return;
    }
    _.each(responses, (response, code) => {
      const contents = this.isV2 ? response : SchemaGenerator.getJsonContents(response);
      if (!contents) {
        console.warn(`${id}:${code} does not have content.`); // eslint-disable-line no-console
        return;
      }

      const onSchema = ({type, value}) => {
        if (type === 'model' && this.modelNameList.includes(value)) {
          this.importList.push(value);
          return schemaName(value);
        }
        if (type === 'oneOf') {
          const count = this.oneOfs.length + 1;
          const key = `oneOfSchema${count}`;
          value.key = key;
          this.oneOfs.push(value);
          return key;
        }
      };
      applyIf(parseSchema(contents.schema, onSchema, this.isV2), (val) => {
        this.parsedObjects[id] = this.parsedObjects[id] || {};
        this.parsedObjects[id][code] = val;
      });
    });
  }

  /**
   * パース情報とテンプレートからschema.jsを書き出し
   */
  write() {
    const oneOfs = this.oneOfs.map((obj) => Object.assign(obj, {mapping: objectToTemplateValue(obj.mapping), propertyName: `'${this.attributeConverter(obj.propertyName)}'`}));
    const text = render(this.templates.schema, {
      importList: this._prepareImportList(),
      data: objectToTemplateValue(this.formattedSchema),
      hasOneOf: oneOfs.length > 0,
      oneOfs,
    }, {
      head: this.templates.head,
      oneOf: this.templates.oneOf,
    });
    return writeFilePromise(path.join(this.outputDir, this.outputFileName), text);
  }

  _prepareImportList() {
    const relative = path.relative(this.outputDir, this.modelsDir);
    return _.uniq(this.importList).map((modelName) => {
      return {
        name: schemaName(modelName),
        path: path.join(relative, _.snakeCase(modelName)),
      }
    });
  }

  get formattedSchema() {
    return _.reduce(this.parsedObjects, (acc, schema, key) => {
      acc[key] = changeFormat(schema, this.attributeConverter);
      return acc;
    }, {});
  }

  static getJsonContents(response) {
    return response.content && response.content['application/json'];
  }
}

module.exports = SchemaGenerator;
