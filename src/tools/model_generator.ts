/* eslint-disable max-lines */
import _ from 'lodash';
import path from 'path';
import {
  parseSchema,
  schemaName,
  render,
  objectToTemplateValue,
  applyRequired,
  getIdAttribute,
  readTemplates,
  isFileExistPromise,
  writeFilePromise,
  changeFormat,
  getModelName,
  writeFile,
} from './utils';

/**
 * モデル定義からモデルファイルを作成
 */

export default class ModelGenerator {
  outputDir: string;

  outputBaseDir: string;

  templatePath: TODO;

  usePropType: UsePropType;

  useTypeScript: UseTypeScript;

  attributeConverter: AttributeConverter;

  definitions: TODO;

  extension: Extension;

  templates: TODO;

  _modelNameList: TODO[];

  importImmutableMap: boolean;

  constructor({
    outputDir = '',
    outputBaseDir = '',
    templatePath = {},
    usePropType = false,
    useTypeScript = false,
    attributeConverter = (str: string) => str,
    definitions = {},
    extension = 'js',
  }: {
    outputDir?: string;
    outputBaseDir: string;
    templatePath?: TODO;
    usePropType?: UsePropType;
    useTypeScript?: UseTypeScript;
    attributeConverter?: AttributeConverter;
    definitions?: TODO;
    extension?: Extension;
  }) {
    this.outputDir = outputDir;
    this.outputBaseDir = outputBaseDir;
    this.templatePath = templatePath;
    this.usePropType = usePropType;
    this.useTypeScript = useTypeScript;
    this.attributeConverter = attributeConverter;
    this.definitions = definitions;
    this.extension = extension;
    this.templates = readTemplates(
      ['model', 'models', 'override', 'head', 'dependency', 'oneOf'],
      this.templatePath,
    );
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
  writeModel(model: TODO, name: string) {
    const { properties } = model; // dereferenced
    const fileName = _.snakeCase(name);
    const idAttribute = getIdAttribute(model, name);
    if (!idAttribute) return;
    // requiredはモデル定義のものを使う
    const required = this.definitions[name] && this.definitions[name].required;

    if (this._modelNameList.includes(name)) return;
    this._modelNameList.push(name);

    return this._renderBaseModel(name, applyRequired(properties, required), idAttribute).then(
      ({ text, props }: TODO) => {
        writeFile(path.join(this.outputBaseDir, `${fileName}.${this.extension}`), text);
        return this._writeOverrideModel(name, fileName, props).then(() => name);
      },
    );
  }

  writeIndex(modelNameList = this._modelNameList) {
    const text = render(
      this.templates.models,
      {
        models: _.uniq(modelNameList).map((name) => ({ fileName: _.snakeCase(name), name })),
      },
      {
        head: this.templates.head,
      },
    );
    return writeFilePromise(path.join(this.outputDir, `index.${this.extension}`), text);
  }

  _writeOverrideModel(name: TODO, fileName: string, props: TODO) {
    const overrideText = this._renderOverrideModel(name, fileName, props);
    const filePath = path.join(this.outputDir, `${fileName}.${this.extension}`);
    return isFileExistPromise(filePath).then(
      (isExist) => isExist || writeFilePromise(filePath, overrideText),
    );
  }

  _prepareImportList(importList: TODO) {
    return _.uniqBy(importList, 'modelName').map(({ modelName, filePath }: TODO) => {
      return {
        name: modelName,
        schemaName: schemaName(modelName),
        filePath: filePath ? filePath : _.snakeCase(modelName),
      };
    });
  }

  _prepareIdAttribute(idAttribute: string) {
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

  _renderBaseModel(name: string, properties: TODO, idAttribute: TODO) {
    return new Promise((resolve, reject) => {
      const importList: TODO[] = [];
      const oneOfs: TODO[] = [];
      let oneOfsCounter = 1;
      // @ts-expect-error
      const dependencySchema = parseSchema(properties, ({ type, value }) => {
        if (type === 'model') {
          const modelName = getModelName(value);
          if (getIdAttribute(value, modelName)) {
            importList.push({ modelName, value });
            return schemaName(modelName);
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
        schema: objectToTemplateValue(changeFormat(dependencySchema, this.attributeConverter)),
        oneOfs: oneOfs.map((obj) =>
          Object.assign(obj, {
            mapping: objectToTemplateValue(obj.mapping),
            propertyName: this._prepareIdAttribute(obj.propertyName),
          }),
        ),
        importList: this._prepareImportList(importList),
        getPropTypes,
        getTypeScriptTypes,
        getDefaults,
        importImmutableMap: this.importImmutableMap,
      };

      const text = render(this.templates.model, props, {
        head: this.templates.head,
        dependency: this.templates.dependency,
        oneOf: this.templates.oneOf,
      });

      // import先のモデルを書き出し
      Promise.all(importList.map(({ value, modelName }) => this.writeModel(value, modelName))).then(
        () => resolve({ text, props }), // 自身の書き出しはここで実施
        reject,
      );
    });
  }

  static get templatePropNames() {
    return ['type', 'default', 'enum'];
  }

  _convertPropForTemplate(properties: TODO, dependencySchema: { [key: string]: TODO } = {}) {
    return _.map(properties, (prop, name) => {
      const base = {
        name: () => this.attributeConverter(name),
        type: this.generateTypeFrom(prop, dependencySchema[name]),
        alias: prop['x-attribute-as'],
        required: prop.required === true,
        isEnum: Boolean(prop.enum),
        isValueString: prop.type === 'string',
        propertyName: name,
        enumObjects: this.getEnumObjects(
          this.attributeConverter(name),
          prop.enum,
          prop['x-enum-key-attributes'],
        ),
        enumType: this._getEnumTypes(prop.type),
        items: prop.items,
      };
      // @ts-expect-error
      return this.constructor.templatePropNames.reduce(
        (ret: { [key: string]: TODO }, key: TODO) => {
          ret[key] = ret[key] || properties[name][key];
          return ret;
        },
        base,
      );
    });
  }

  getEnumConstantName(enumName: string | number, propertyName: string) {
    const convertedName = _.upperCase(propertyName).split(' ').join('_');
    const convertedkey = _.upperCase(`${enumName}`).split(' ').join('_');
    // enumNameがマイナスの数値の時
    const resolvedkey =
      typeof enumName === 'number' && enumName < 0 ? `MINUS_${convertedkey}` : convertedkey;
    return `${convertedName}_${resolvedkey}`;
  }

  getEnumLiteralTypeName(enumName: string | number, propertyName: string) {
    const convertedName = _.startCase(propertyName).split(' ').join('');
    const convertedkey = _.startCase(`${enumName}`).split(' ').join('');
    // enumNameがマイナスの数値の時
    const resolvedkey =
      typeof enumName === 'number' && enumName < 0 ? `Minus${convertedkey}` : convertedkey;
    return `${convertedName}${resolvedkey}`;
  }

  getEnumObjects(name: string, enums?: TODO[], enumKeyAttributes: TODO[] = []) {
    if (!enums) return false;
    return enums.map((current, index) => {
      const enumName = enumKeyAttributes[index] || current;
      return {
        name: this.getEnumConstantName(enumName, name),
        literalTypeName: this.getEnumLiteralTypeName(enumName, name),
        value: current,
      };
    });
  }

  _getEnumTypes(type: TODO) {
    switch (type) {
      case 'integer':
      case 'number':
        return 'number';
      default:
        return type;
    }
  }

  generateTypeFrom(prop: TODO, definition: TODO): TODO {
    if (prop && prop.oneOf) {
      const candidates = prop.oneOf.map((obj: TODO) => {
        const modelName = getModelName(obj);
        return modelName ? { isModel: true, type: modelName } : { isModel: false, type: obj.type };
      });
      return {
        propType: `PropTypes.oneOfType([${_.uniq(
          candidates.map((c: TODO) => (c.isModel ? `${c.type}PropType` : _getPropTypes(c.type))),
        ).join(', ')}])`,
        typeScript: _.uniq(candidates.map((c: TODO) => this._getEnumTypes(c.type))).join(' | '),
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
      if (!this.importImmutableMap) this.importImmutableMap = true;
      const props = _.reduce(
        prop.properties,
        (acc: { [key: string]: TODO }, value, key) => {
          acc[this.attributeConverter(key)] = _getPropTypes(value.type, value.enum);
          return acc;
        },
        {},
      );
      return {
        propType: `ImmutablePropTypes.mapContains(${JSON.stringify(props).replace(/"/g, '')})`,
        typeScript: 'Map<any, any>',
      };
    }
  }

  _generatePropTypeFromDefinition(definition: TODO): TODO {
    let def;
    if (_.isString(definition)) {
      def = definition.replace(/Schema$/, '');
      return `${def}PropType`;
    }
    if (_.isArray(definition)) {
      def = definition[0];
      const type = this._generatePropTypeFromDefinition(def);
      return `ImmutablePropTypes.listOf(${type})`;
    } else if (_.isObject(definition)) {
      const type = _.reduce(
        definition,
        (acc: { [key: string]: TODO }, value, key) => {
          acc[key] = this._generatePropTypeFromDefinition(value);
          return acc;
        },
        {},
      );
      return `ImmutablePropTypes.mapContains(${JSON.stringify(type).replace(/"/g, '')})`;
    }
  }

  _generateTypeScriptTypeFromDefinition(definition: TODO): TODO {
    let def;
    if (_.isString(definition)) {
      return definition.replace(/Schema$/, '');
    }
    if (_.isArray(definition)) {
      def = definition[0];
      const type = this._generateTypeScriptTypeFromDefinition(def);
      return `List<${type}>`;
    } else if (_.isObject(definition)) {
      return 'Map<any, any>';
    }
  }

  _renderOverrideModel(name: string, fileName: string, { props }: TODO) {
    const enums = props
      .filter((prop: TODO) => prop.enumObjects)
      .reduce(
        (acc: TODO[], prop: TODO) =>
          acc.concat(prop.enumObjects.reduce((acc: TODO[], eo: TODO) => acc.concat(eo.name), [])),
        [],
      );
    return render(
      this.templates.override,
      {
        name,
        fileName,
        enums,
        usePropTypes: this.usePropType,
      },
      {
        head: this.templates.head,
      },
    );
  }
}

function getPropTypes() {
  // @ts-expect-error
  return _getPropTypes(this.type, this.enum, this.enumObjects);
}

function _getPropTypes(type: TODO, enums?: TODO[], enumObjects?: TODO[]) {
  if (enumObjects) {
    const nameMap = enumObjects.map((current: { [key: string]: string }) => current.name);
    return `PropTypes.oneOf([${nameMap.join(', ')}])`;
  } else if (enums) {
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
  // @ts-expect-error
  return _getTypeScriptTypes(this.type, this.enumObjects);
}

function _getTypeScriptTypes(type: TODO, enumObjects: TODO[]) {
  if (enumObjects) {
    const literalTypeNames = enumObjects.map((current: TODO) => current.literalTypeName);
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
  // @ts-expect-error
  if (_.isUndefined(this.default)) {
    return 'undefined';
  }
  // @ts-expect-error
  if (this.enumObjects) {
    // @ts-expect-error
    for (const enumObject of this.enumObjects) {
      // @ts-expect-error
      if (enumObject.value === this.default) return enumObject.name;
    }
  }
  // @ts-expect-error
  return this.type === 'string' ? `'${this.default}'` : this.default;
}
