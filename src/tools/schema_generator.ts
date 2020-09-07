import each from 'lodash/each';
import snakeCase from 'lodash/snakeCase';
import uniqBy from 'lodash/uniqBy';
import reduce from 'lodash/reduce';
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
import ModelGenerator from './model_generator';
import { OpenAPIV3 } from 'openapi-types';

/**
 * レスポンス定義からnormalizr用のschemaを作成
 * content-typeはjsonのみサポート
 */

export default class SchemaGenerator {
  outputPath: Actions;

  outputDir: string;

  outputFileName: string;

  templatePath: TemplatePath;

  modelGenerator: ModelGenerator;

  modelsDir: string;

  attributeConverter: AttributeConverter;

  templates: Templates;

  parsedObjects: { [key: string]: TODO };

  _importModels: {
    modelName?: string;
    model: TODO;
  }[];

  oneOfs: TODO[];

  useTypeScript: UseTypeScript;

  constructor({
    outputPath = '',
    templatePath = {},
    modelGenerator,
    modelsDir,
    attributeConverter = (str) => str,
    useTypeScript,
    extension = 'js',
  }: {
    outputPath: Actions;
    templatePath: TemplatePath;
    modelGenerator: ModelGenerator;
    modelsDir: string;
    attributeConverter: AttributeConverter;
    useTypeScript: UseTypeScript;
    extension: Extension;
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
  parse(id: string, responses: OpenAPIV3.ResponsesObject) {
    each(responses, (response, code) => {
      const contents = SchemaGenerator.getJsonContents(response);
      if (!contents) {
        console.warn(`${id}:${code} does not have content.`);
        return;
      }

      const onSchema = ({ type, value }: { type: string; value: TODO }) => {
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

      const data = parseSchema(contents.schema, onSchema);
      applyIf(data, (val) => {
        this.parsedObjects[id] = this.parsedObjects[id] || {};
        this.parsedObjects[id][code] = val;
      });
    });
  }

  /**
   * パース情報とテンプレートからschema.jsとmodels/index.js書き出し
   */
  write() {
    return Promise.all<void | string>([
      this._writeSchemaFile(),
      ...this.importModels.map(({ modelName, model }) =>
        // @ts-expect-error utilsのgetModelNameで生成されるmodelNameがundefinedの可能性がある
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
    const { schema, head, oneOf } = this.templates;
    if (!schema || !head || !oneOf) return Promise.reject();
    const text = render(
      schema,
      {
        importList: this._prepareImportList(),
        data: objectToTemplateValue(this.formattedSchema),
        hasOneOf: oneOfs.length > 0,
        oneOfs,
        useTypeScript: this.useTypeScript,
      },
      {
        head,
        oneOf,
      },
    );
    return writeFilePromise(path.join(this.outputDir, this.outputFileName), text);
  }

  _prepareImportList() {
    const relative = path.relative(this.outputDir, this.modelsDir);
    return this.importModels.map(({ modelName }) => {
      return {
        name: schemaName(modelName),
        path: path.join(relative, snakeCase(modelName)),
      };
    });
  }

  get importModels() {
    return uniqBy(this._importModels, 'modelName');
  }

  get formattedSchema() {
    return reduce(
      this.parsedObjects,
      (
        acc: {
          [key: string]: TODO;
        },
        schema,
        key,
      ) => {
        acc[key] = changeFormat(schema, this.attributeConverter);
        return acc;
      },
      {},
    );
  }

  static getJsonContents(response: OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject) {
    // ResponseObject
    if ('content' in response) {
      return response.content && response.content['application/json'];
    }
  }
}
