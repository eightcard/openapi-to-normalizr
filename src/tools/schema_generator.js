const _ = require('lodash');
const path = require('path');
const {
  applyIf, schemaName, parseSchema, objectToTemplateValue,
  readTemplates, writeFilePromise, render, changeFormat, getIdAttribute,
} = require('./utils');

/**
 * レスポンス定義からnormalizr用のschemaを作成
 * content-typeはjsonのみサポート
 */

class SchemaGenerator {
  constructor({outputPath = '', templatePath = {}, modelGenerator, modelsDir, isV2, attributeConverter = str => str}) {
    this.outputPath = outputPath;
    const {dir, name, ext} = path.parse(this.outputPath);
    this.outputDir = dir;
    this.outputFileName = `${name}${ext}`;
    this.templatePath = templatePath;
    this.modelGenerator = modelGenerator;
    this.modelsDir = modelsDir;
    this.isV2 = isV2;
    this.attributeConverter = attributeConverter;
    this.templates = readTemplates(['schema', 'head', 'oneOf'], this.templatePath);
    this.parsedObjects = {};
    this.modelNameList = [];
    this.oneOfs = [];
    this.parse = this.parse.bind(this);
    this.write = this.write.bind(this);
  }

  /**
   * API(id)ごとのスキーマをパース
   * - 内部でモデルは書き出し
   */
  parse(id, responses) {
    _.each(responses, (response, code) => {
      const contents = this.isV2 ? response : SchemaGenerator.getJsonContents(response);
      if (!contents) {
        console.warn(`${id}:${code} does not have content.`); // eslint-disable-line no-console
        return;
      }

      const onSchema = ({type, value}) => {
        if (type === 'model') {
          const modelName = value.__modelName;
          if (getIdAttribute(value, modelName)) {
            this.modelNameList.push(modelName);
            this.modelGenerator.writeModel(value, modelName); // できれば準備処理だけにしてwriteで結果を書き出したい
            return schemaName(modelName);
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
      applyIf(parseSchema(contents.schema, onSchema, this.isV2), (val) => {
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
      this.modelGenerator.writeIndex(this.modelNameList),
    ]);
  }

  _writeSchemaFile() {
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
    return _.uniq(this.modelNameList).map((modelName) => {
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
