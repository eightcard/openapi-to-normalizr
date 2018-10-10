const isString = require('lodash.isstring');
const isObject = require('lodash.isobject');
const reduce = require('lodash.reduce');
const { parseModelName } = require('./utils');

/**
 * generator for only Types (PropTypes, FlowTypes)
 */
class TypeGenerator {
  constructor({isV2, attributeConverter = str => str}) {
    this.isV2 = isV2;
    this.attributeConverter = attributeConverter;
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

    /* 上記の分岐でcomponentsに定義されている型の配列のパターンは吸収されるため、*/
    /* ここではプリミティブ型の配列のパターンを扱う */
    if (prop.type === 'array' && prop.items && prop.items.type) {
      return {
        propType: `ImmutablePropTypes.listOf(${_getPropTypes(prop.items.type)})`,
        flow: `${getEnumTypes(prop.items.type)}[]`,
      };
    }

    if (prop.type === 'object' && prop.properties) {
      const props = reduce(prop.properties, (acc, value, key) => {
        acc[this.attributeConverter(key)] = _getPropTypes(value.type, value.enum);
        return acc;
      }, {});
      return {
        propType: `ImmutablePropTypes.mapContains(${JSON.stringify(props).replace(/"/g, '')})`
      }
    }
  }

  // private

  _generatePropTypeFromDefinition(definition) {
    let def;
    if (isString(definition)) {
      def = definition.replace(/Schema$/, '');
      return `${def}PropType`;
    }
    if (Array.isArray(definition)) {
      def = definition[0];
      const type = this._generatePropTypeFromDefinition(def);
      return `ImmutablePropTypes.listOf(${type})`;
    } else if (isObject(definition)) {
      const type = reduce(definition, (acc, value, key) => {
        acc[key] = this._generatePropTypeFromDefinition(value);
        return acc;
      }, {});
      return `ImmutablePropTypes.mapContains(${JSON.stringify(type).replace(/"/g, '')})`;
    }
  }

  _generateFlowTypeFromDefinition(definition) {
    let def;
    if (isString(definition)) {
      return definition.replace(/Schema$/, '');
    }
    if (Array.isArray(definition)) {
      def = definition[0];
      const type = this._generateFlowTypeFromDefinition(def);
      return `${type}[]`;
    } else if (isObject(definition)) {
      return reduce(definition, (acc, value, key) => {
        acc[key] = this._generateFlowTypeFromDefinition(value);
        return acc;
      }, {});
    }
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
    case 'array':
      return 'PropTypes.array';
    default:
      return type && type.propType ? type.propType : 'PropTypes.any';
  }
}

function getFlowTypes() {
  return _getFlowTypes(this.type, this.enum)
}

function _getFlowTypes(type, enums) {
  if (enums) {
    const typeList = enums.map(() => _getFlowTypes(type));
    return typeList.join(' | ');
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
      return type && type.flow ? type.flow : 'any';
  }
}

function getEnumTypes(type) {
  switch (type) {
    case 'integer':
    case 'number':
      return 'number';
    default:
      return type;
  }
}

exports.getEnumTypes = getEnumTypes;
exports.getPropTypes = getPropTypes;
exports.getFlowTypes = getFlowTypes;
exports.TypeGenerator = TypeGenerator;
