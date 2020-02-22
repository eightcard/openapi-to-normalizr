// @ts-nocheck
import _ from 'lodash';
import path from 'path';
import {
  applyIf,
  schemaName,
  parseSchema,
  objectToTemplateValue,
  getModelName,
  readTemplates,
  writeFilePromise,
  render,
  changeFormat,
  getIdAttribute,
} from './utils';

/**
 * レスポンス定義からnormalizr用のschemaを作成
 * content-typeはjsonのみサポート
 */

class SchemaGenerator {
  constructor({
    outputPath = '',
    templatePath = {},
    modelGenerator,
    modelsDir,
    attributeConverter = (str) => str,
    useTypeScript,
    extension = 'js',
  }) {
    this.outputPath = outputPath;
    const { dir, name } = path.parse(this.outputPath);
    this.outputDir = dir;
    this.outputFileName = `${name}.${extension}`;
    this.templatePath = templatePath;
    this.modelGenerator = modelGenerator;
    this.modelsDir = modelsDir;
    this.attributeConverter = attributeConverter;
    this.templates = readTemplates(['schema', 'head', 'oneOf'], this.templatePath);
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
    _.each(responses, (response, code) => {
      const contents = SchemaGenerator.getJsonContents(response);
      if (!contents) {
        console.warn(`${id}:${code} does not have content.`); // eslint-disable-line no-console
        return;
      }

      const onSchema = ({ type, value }) => {
        if (type === 'model') {
          const modelName = getModelName(value);
          if (getIdAttribute(value, modelName)) {
            this._importModels.push({
              modelName,
              model: value,
            });
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
      applyIf(parseSchema(contents.schema, onSchema), (val) => {
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
      this.importModels.map(({ modelName, model }) =>
        this.modelGenerator.writeModel(model, modelName),
      ),
    ]).then(() => {
      this.modelGenerator.writeIndex();
    });
  }

  _writeSchemaFile() {
    const oneOfs = this.oneOfs.map((obj) =>
      Object.assign(obj, {
        mapping: objectToTemplateValue(obj.mapping),
        propertyName: `'${this.attributeConverter(obj.propertyName)}'`,
      }),
    );
    const text = render(
      this.templates.schema,
      {
        importList: this._prepareImportList(),
        data: objectToTemplateValue(this.formattedSchema),
        hasOneOf: oneOfs.length > 0,
        oneOfs,
        useTypeScript: this.useTypeScript,
      },
      {
        head: this.templates.head,
        oneOf: this.templates.oneOf,
      },
    );
    return writeFilePromise(path.join(this.outputDir, this.outputFileName), text);
  }

  _prepareImportList() {
    const relative = path.relative(this.outputDir, this.modelsDir);
    return this.importModels.map(({ modelName }) => {
      return {
        name: schemaName(modelName),
        path: path.join(relative, _.snakeCase(modelName)),
      };
    });
  }

  get importModels() {
    return _.uniqBy(this._importModels, 'modelName');
  }

  get formattedSchema() {
    return _.reduce(
      this.parsedObjects,
      (acc, schema, key) => {
        acc[key] = changeFormat(schema, this.attributeConverter);
        return acc;
      },
      {},
    );
  }

  static getJsonContents(response) {
    return response.content && response.content['application/json'];
  }
}

module.exports = SchemaGenerator;
