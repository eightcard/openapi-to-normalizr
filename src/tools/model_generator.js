const _ = require('lodash'); // eslint-disable-line implicit-arrow-linebreak
const path = require('path');
const {
  parseSchema, schemaName, render, objectToTemplateValue, applyRequired, getIdAttribute,
  readTemplates, isFileExistPromise, writeFilePromise, changeFormat, parseModelName,
} = require('./utils');

/**
 * モデル定義からモデルファイルを作成
 */

class ModelGenerator {
  constructor({outputDir = '', templatePath = {}, specName, isV2, useFlow, usePropType, attributeConverter = str => str}) {
    this.outputDir = outputDir;
    this.templatePath = templatePath;
    this.specName = specName;
    this.isV2 = isV2;
    this.useFlow = useFlow;
    this.usePropType = usePropType;
    this.attributeConverter = attributeConverter;
    this.templates = readTemplates(['model', 'models', 'override', 'head', 'dependency', 'oneOf'], this.templatePath);
  }

  /**
   * モデル定義ごとに呼び出し
   * - モデルファイルを書き出す
   * - Promiseでモデル名(Petなど)を返す
   */
  writeModel(model, name) {
    const {properties, required} = model;
    const fileName = _.snakeCase(name);
    const idAttribute = getIdAttribute(model, name);
    if (!idAttribute) return;

    const coreText = this._renderBaseModel(name, applyRequired(properties, required), idAttribute);
    return writeFilePromise(path.join(this.outputDir, `_${fileName}.js`), coreText).then(() => {
      return this._writeOverrideModel(name, fileName).then(() => name);
    });
  }

  writeIndex(modelNameList) {
    const text = render(this.templates.models, {
      models: _.uniq(modelNameList).map((name) => ({fileName: _.snakeCase(name), name})),
      specName: this.specName,
    }, {
      head: this.templates.head,
    });
    return writeFilePromise(path.join(this.outputDir, 'index.js'), text);
  }

  _writeOverrideModel(name, fileName) {
    const overrideText = this._renderOverrideModel(name, fileName);
    const filePath = path.join(this.outputDir, `${fileName}.js`);
    return isFileExistPromise(filePath).then((isExist) => isExist || writeFilePromise(filePath, overrideText));
  }

  _prepareImportList(importList) {
    return _.uniq(importList).map(({modelName, filePath}) => {
      return {
        name: modelName,
        schemaName: schemaName(modelName),
        filePath: filePath ? filePath : _.snakeCase(modelName),
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

    return render(this.templates.model, {
      name, idAttribute: this._prepareIdAttribute(idAttribute),
      usePropTypes: this.usePropType,
      useFlow: this.useFlow,
      props: this._convertPropForTemplate(properties, dependencySchema),
      specName: this.specName,
      schema: objectToTemplateValue(changeFormat(dependencySchema, this.attributeConverter)),
      oneOfs: oneOfs.map((obj) => Object.assign(obj, {mapping: objectToTemplateValue(obj.mapping), propertyName: this._prepareIdAttribute(obj.propertyName)})),
      importList: this._prepareImportList(importList),
      getFlowTypes, getPropTypes, getDefaults,
    }, {
      head: this.templates.head,
      dependency: this.templates.dependency,
      oneOf: this.templates.oneOf,
    });
  }

  static get templatePropNames() {
    return [
      'type',
      'default',
      'enum'
    ];
  }

  _convertPropForTemplate(properties, dependencySchema = {}) {
    return _.map(properties, (prop, name) => {
      const base = {
        name: () => this.attributeConverter(name),
        type: this.generateTypeFrom(prop, dependencySchema[name]),
        alias: prop['x-attribute-as'],
        required: prop.required === true,
        isEnum: new Boolean(prop.enum),
        isValueString: prop.type === 'string',
        propertyName: name,
        enumValueNames: this.getEnumNames(this.attributeConverter(name), prop.enum),
      };
      return this.constructor.templatePropNames.reduce((ret, key) => {
        ret[key] = ret[key] || properties[name][key];
        return ret;
      }, base);
    });
  }

  getEnumNames(name, enums) {
    if(!enums) {
      return;
    }

    const nameMap = enums.map((current) => {
      return `${_.camelCase(name)}_${current}`
    });

    return nameMap;
  }

  generateTypeFrom(prop, definition) {
    if (prop && prop.oneOf) {
      // for only model (ref)
      const candidates = prop.oneOf.map((obj) => parseModelName(obj.$ref || obj.$$ref, this.isV2));
      return {
        propType: `PropTypes.oneOfType([${candidates.map(c => `${c}PropType`).join(', ')}])`,
        flow: candidates.join(' | '),
      };
    }

    if (definition) {
      return {
        propType: this._generatePropTypeFromDefinition(definition),
        flow: this._generateFlowTypeFromDefinition(definition),
      };
    }

    if (prop.type === 'object' && prop.properties) {
      const props = _.reduce(prop.properties, (acc, value, key) => {
        acc[this.attributeConverter(key)] = _getPropTypes(value.type, value.enum);
        return acc;
      }, {});
      return {
        propType: `ImmutablePropTypes.mapContains(${JSON.stringify(props).replace(/"/g, '')})`
      }
    }
  }

  _generatePropTypeFromDefinition(definition) {
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
      const type = _.reduce(definition, (acc, value, key) => {
        acc[key] = this._generatePropTypeFromDefinition(value);
        return acc;
      }, {});
      return `ImmutablePropTypes.mapContains(${JSON.stringify(type).replace(/"/g, '')})`;
    }
  }

  _generateFlowTypeFromDefinition(definition) {
    let def;
    if (_.isString(definition)) {
      return definition.replace(/Schema$/, '');
    }
    if (_.isArray(definition)) {
      def = definition[0];
      const type = this._generateFlowTypeFromDefinition(def);
      return `${type}[]`;
    } else if (_.isObject(definition)) {
      return _.reduce(definition, (acc, value, key) => {
        acc[key] = this._generateFlowTypeFromDefinition(value);
        return acc;
      }, {});
    }
  }

  _renderOverrideModel(name, fileName) {
    return render(this.templates.override, {
      name, fileName,
      specName: this.specName,
    }, {
      head: this.templates.head,
    });
  }
}

function getPropTypes() {
  return _getPropTypes(this.type, this.enum, this.enumValueNames);
}

function _getPropTypes(type, enums, enumValueNames) {
  if (enums) {
    return `PropTypes.oneOf([${enumValueNames.join(', ')}])`;
  }
  switch(type) {
    case 'integer':
    case 'number':
      return 'PropTypes.number';
    case 'string':
      return 'PropTypes.string';
    case 'boolean':
      return 'PropTypes.bool';
    default:
      return type && type.propType ? type.propType : 'PropTypes.any';
  }
}

function getFlowTypes() {
  if (this.enum) {
    const enums = this.type === 'string' ? this.enum.map((key) => `'${key}'`) : this.enum;
    return enums.join(' | ');
  }
  switch(this.type) {
    case 'integer':
    case 'number':
      return 'number';
    case 'string':
      return 'string';
    case 'boolean':
      return 'boolean';
    default:
      return this.type && this.type.flow ? this.type.flow : 'any';
  }
}

function getDefaults() {
  if (!this.default) { return 'undefined'; }
  if(this.enumValueNames) {
    for(const enumValueName of this.enumValueNames) {
      if(getPropertyName(enumValueName) === this.propertyName) return enumValueName;
    }
  }
  return this.type === 'string' ? `'${this.default}'` : this.default;
}

function getPropertyName(name) {
  const camelCaseName = name.split('_')[0];
  return _.snakeCase(camelCaseName);
}

module.exports = ModelGenerator;
