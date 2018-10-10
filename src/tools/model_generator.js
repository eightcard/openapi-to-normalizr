const snakeCase = require('lodash.snakecase');
const uniq = require('lodash.uniq');
const map = require('lodash.map');
const upperCase = require('lodash.uppercase');
const path = require('path');
const {
  parseSchema, schemaName, render, objectToTemplateValue, applyRequired, getIdAttribute,
  readTemplates, isFileExistPromise, writeFilePromise, changeFormat,
} = require('./utils');
const { TypeGenerator, getFlowTypes, getPropTypes, getEnumTypes } = require('./type_generator');

/**
 * モデル定義からモデルファイルを作成
 */

class ModelGenerator {
  static get templatePropNames() {
    return [
      'type',
      'default',
      'enum'
    ];
  }

  static getEnumConstantName(enumName, propertyName) {
    const convertedName = upperCase(propertyName).split(' ').join('_');
    const convertedkey = upperCase(enumName).split(' ').join('_');
    return `${convertedName}_${convertedkey}`;
  }

  constructor({outputDir = '', outputBaseDir = '', templatePath = {}, isV2, useFlow, usePropType, attributeConverter = str => str}) {
    this.outputDir = outputDir;
    this.outputBaseDir = outputBaseDir;
    this.templatePath = templatePath;
    this.isV2 = isV2;
    this.useFlow = useFlow;
    this.usePropType = usePropType;
    this.attributeConverter = attributeConverter;
    this.templates = readTemplates(['model', 'models', 'override', 'head', 'dependency', 'oneOf'], this.templatePath);
    this.typeGenerator = new TypeGenerator({attributeConverter});
  }

  /**
   * モデル定義ごとに呼び出し
   * - モデルファイルを書き出す
   * - Promiseでモデル名(Petなど)を返す
   */
  writeModel(model, name) {
    const {properties, required} = model;
    const fileName = snakeCase(name);
    const idAttribute = getIdAttribute(model, name);
    if (!idAttribute) return;

    const {text, props} = this._renderBaseModel(name, applyRequired(properties, required), idAttribute);
    return writeFilePromise(path.join(this.outputBaseDir, `${fileName}.js`), text).then(() => {
      return this._writeOverrideModel(name, fileName, props).then(() => name);
    });
  }

  writeIndex(modelNameList) {
    const text = render(this.templates.models, {
      models: uniq(modelNameList).map((name) => ({fileName: snakeCase(name), name})),
    }, {
      head: this.templates.head,
    });
    return writeFilePromise(path.join(this.outputDir, 'index.js'), text);
  }

  getEnumObjects(name, enums, enumKeyAttributes = []) {
    if (!enums) return false;
    return enums.map((current, index) => {
      const enumName = enumKeyAttributes[index] || current;
      return {
        'name': this.constructor.getEnumConstantName(enumName, name),
        'value': current,
      };
    });
  }

  // private

  _writeOverrideModel(name, fileName, props) {
    const overrideText = this._renderOverrideModel(name, fileName, props);
    const filePath = path.join(this.outputDir, `${fileName}.js`);
    return isFileExistPromise(filePath).then((isExist) => isExist || writeFilePromise(filePath, overrideText));
  }

  _prepareImportList(importList) {
    return uniq(importList).map(({modelName, filePath}) => {
      return {
        name: modelName,
        schemaName: schemaName(modelName),
        filePath: filePath ? filePath : snakeCase(modelName),
      }
    });
  }

  _prepareIdAttribute(idAttribute) {
    const splits = idAttribute.split('.');
    if (splits[0] === 'parent') {
      splits.shift();
      return `(value, parent) => parent${splits.map(str => `['${this.attributeConverter(str)}']`).join('')}`
    }
    if (splits.length === 1) {
      return `'${this.attributeConverter(splits[0])}'`;
    }
    return `(value) => value${splits.map(str => `['${this.attributeConverter(str)}']`).join('')}`
  }

  _renderBaseModel(name, properties, idAttribute) {
    const importList = [];
    const oneOfs = [];
    let oneOfsCounter = 1;
    const dependencySchema = parseSchema(properties, ({type, value}) => {
      if (type === 'model') {
        importList.push({modelName: value});
        return schemaName(value);
      }
      if (type === 'oneOf') {
        const key = `oneOfSchema${oneOfsCounter++}`;
        value.key = key;
        oneOfs.push(value);
        return key;
      }
    }, this.isV2);

    const props = {
      name, idAttribute: this._prepareIdAttribute(idAttribute),
      usePropTypes: this.usePropType,
      useFlow: this.useFlow,
      props: this._convertPropForTemplate(properties, dependencySchema),
      schema: objectToTemplateValue(changeFormat(dependencySchema, this.attributeConverter)),
      oneOfs: oneOfs.map((obj) => Object.assign(obj, {mapping: objectToTemplateValue(obj.mapping), propertyName: this._prepareIdAttribute(obj.propertyName)})),
      importList: this._prepareImportList(importList),
      getFlowTypes, getPropTypes, getDefaults
    };

    const text = render(this.templates.model, props, {
      head: this.templates.head,
      dependency: this.templates.dependency,
      oneOf: this.templates.oneOf,
    });

    return {text, props};
  }

  _convertPropForTemplate(properties, dependencySchema = {}) {
    return map(properties, (prop, name) => {
      const base = {
        name: () => this.attributeConverter(name),
        type: this.typeGenerator.generateTypeFrom(prop, dependencySchema[name]),
        alias: prop['x-attribute-as'],
        required: prop.required === true,
        isEnum: Boolean(prop.enum),
        isValueString: prop.type === 'string',
        propertyName: name,
        enumObjects: this.getEnumObjects(this.attributeConverter(name), prop.enum, prop['x-enum-key-attributes']),
        enumType: getEnumTypes(prop.type),
        items: prop.items
      };
      return this.constructor.templatePropNames.reduce((ret, key) => {
        ret[key] = ret[key] || properties[name][key];
        return ret;
      }, base);
    });
  }

  _renderOverrideModel(name, fileName, {props}) {
    const enums = props.filter((prop) => prop.enumObjects).reduce((acc, prop) => acc.concat(prop.enumObjects.reduce((acc, eo) => acc.concat(eo.name), [])), []);
    return render(this.templates.override, {
      name, fileName, enums,
      usePropTypes: this.usePropType,
    }, {
      head: this.templates.head,
    });
  }
}

function getDefaults() {
  if (!this.default) { return 'undefined'; }
  if (this.enumObjects) {
    for (const enumObject of this.enumObjects) {
      if (enumObject.value === this.default) return enumObject.name;
    }
  }
  return this.type === 'string' ? `'${this.default}'` : this.default;
}

module.exports = ModelGenerator;
