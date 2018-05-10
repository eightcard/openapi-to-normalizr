const _ = require('lodash');
const path = require('path');
const {
  parseSchema, schemaName, render, objectToTemplateValue, applyRequired, getIdAttribute,
  readTemplates, isFileExistPromise, writeFilePromise, changeFormat, parseModelName,
} = require('./utils');

/**
 * モデル定義からモデルファイルを作成
 */

class ModelGenerator {
  constructor({outputDir = '', outputBaseDir = '', templatePath = {}, isV2, useFlow, usePropType, attributeConverter = str => str}) {
    this.outputDir = outputDir;
    this.outputBaseDir = outputBaseDir;
    this.templatePath = templatePath;
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

    const {text, props} = this._renderBaseModel(name, applyRequired(properties, required), idAttribute);
    return writeFilePromise(path.join(this.outputBaseDir, `${fileName}.js`), text).then(() => {
      return this._writeOverrideModel(name, fileName, props).then(() => name);
    });
  }

  writeIndex(modelNameList) {
    const text = render(this.templates.models, {
      models: _.uniq(modelNameList).map((name) => ({fileName: _.snakeCase(name), name})),
    }, {
      head: this.templates.head,
    });
    return writeFilePromise(path.join(this.outputDir, 'index.js'), text);
  }

  _writeOverrideModel(name, fileName, props) {
    const overrideText = this._renderOverrideModel(name, fileName, props);
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

    const props = {
      name, idAttribute: this._prepareIdAttribute(idAttribute),
      usePropTypes: this.usePropType,
      useFlow: this.useFlow,
      props: this._convertPropForTemplate(properties, dependencySchema),
      schema: objectToTemplateValue(changeFormat(dependencySchema, this.attributeConverter)),
      oneOfs: oneOfs.map((obj) => Object.assign(obj, {mapping: objectToTemplateValue(obj.mapping), propertyName: this._prepareIdAttribute(obj.propertyName)})),
      importList: this._prepareImportList(importList),
      getFlowTypes, getPropTypes, getDefaults,
    };

    const text = render(this.templates.model, props, {
      head: this.templates.head,
      dependency: this.templates.dependency,
      oneOf: this.templates.oneOf,
    });

    return {text, props};
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
        isEnum: Boolean(prop.enum),
        isValueString: prop.type === 'string',
        propertyName: name,
        enumObjects: this.getEnumObjects(this.attributeConverter(name), prop.enum, prop['x-enum-key-attributes']),
      };
      return this.constructor.templatePropNames.reduce((ret, key) => {
        ret[key] = ret[key] || properties[name][key];
        return ret;
      }, base);
    });
  }

  getEnumConstantName(enumName, propertyName) {
    const convertedName = _.upperCase(propertyName).split(' ').join('_');
    const convertedkey = _.upperCase(enumName).split(' ').join('_');
    return `${convertedName}_${convertedkey}`;
  }

  getEnumObjects(name, enums, enumKeyAttributes = []) {
    if (!enums) return false;
    return enums.map((current, index) => {
      const enumName = enumKeyAttributes[index] || current;
      return {
        'name': this.getEnumConstantName(enumName, name),
        'value': current,
      };
    });
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

    if (prop.type === 'array' && prop.items && prop.items.type) {
      return {
        propType: `ImmutablePropTypes.listOf(${_getPropTypes(prop.items.type)})`,
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

function getPropTypes() {
  return _getPropTypes(this.type, this.enum, this.enumObjects);
}

function _getPropTypes(type, enums, enumObjects) {
  if (enumObjects) {
    const nameMap = enumObjects.map(current => current.name);
    return `PropTypes.oneOf([${nameMap.join(', ')}])`;
  } else if (enums) {
    return `PropTypes.oneOf([${enums.map(n => type === 'string' ? `'${n}'` : n).join(', ')}])`;
  }
  switch (type) {
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
  switch (this.type) {
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
  if (this.enumObjects) {
    for (const enumObject of this.enumObjects) {
      if (enumObject.value === this.default) return enumObject.name;
    }
  }
  return this.type === 'string' ? `'${this.default}'` : this.default;
}

module.exports = ModelGenerator;
