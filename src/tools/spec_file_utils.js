const fs = require('fs');
const os = require('os');
const path = require('path');
const mkdirp = require('mkdirp');
const _ = require('lodash');
const jsYaml = require('js-yaml');
const $RefParser = require('json-schema-ref-parser');
const ALTERNATIVE_REF_KEY = '__$ref__';
const MODEL_DEF_KEY = 'x-model-name';

function readSpecFilePromise(path, options = {}) {
  const data = fs.readFileSync(path, 'utf8');
  const original = jsYaml.safeLoad(data);
  if (!options.dereference) return Promise.resolve(original);
  return new Promise((resolve, reject) => {
    $RefParser.dereference(path, (err, schema) => {
      schema = _.merge(original, schema);
      if (err) {
        reject(err);
        return;
      }
      resolve(schema);
    });
  });
}

function walkSchema(spec, cb = _.noop) {
  if (_.isArray(spec)) {
    return spec.forEach((item) => walkSchema(item, cb));
  } else if (_.isObject(spec)) {
    cb(spec);
    return _.each(spec, (value) => walkSchema(value, cb));
  }
}

function getRefFilesPath(spec) {
  const paths = [];
  walkSchema(spec, (obj) => {
    if (obj.$ref) {
      const matches = obj.$ref.match(/^([^#].*)#/);
      if (matches) paths.push(matches[1]);
    }
  });
  return paths;
}

function applyAlternativeRef(spec) {
  walkSchema(spec, (obj) => {
    if (obj.$ref) {
      obj[ALTERNATIVE_REF_KEY] = obj.$ref;
    }
  });
  return spec;
}

function convertToLocalDefinition(spec) {
  walkSchema(spec, (obj) => {
    if (obj.$ref) {
      const index = obj.$ref.indexOf('#');
      obj.$ref = obj.$ref.slice(index);
    }
  });
  return spec;
}

function getPreparedSpecFilePaths(specFiles, tags = []) {
  const readFiles = {};
  const tmpDir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), '__openapi_to_normalizr__'));
  const allFiles = _.uniq(_.flattenDeep(getAllRelatedFiles(specFiles)));

  return specFiles.concat(allFiles).map((p) => {
    const target = path.join(tmpDir, p);
    mkdirp.sync(path.dirname(target));

    const spec = jsYaml.safeLoad(fs.readFileSync(p));
    if (specFiles.includes(p)) {
      removeUnusableOperation(spec);
    } else {
      delete spec.paths; // 指定されたspecファイル以外のpath情報は不要
    }
    applyAlternativeRef(spec);
    const schemas = spec.components && spec.components.schemas;
    if (schemas) {
      _.each(schemas, (model, name) => {
        model[MODEL_DEF_KEY] = name;
      });
    }
    fs.writeFileSync(target, jsYaml.safeDump(spec));
    return target;
  });

  function isUsableOperation(operationTags) {
    if (tags.length === 0) return true;
    return operationTags && tags.some((t) => operationTags.includes(t))
  }

  function removeUnusableOperation(spec) {
    _.each(spec.paths, (operations) => {
      _.each(operations, (operation, method) => {
        if (!isUsableOperation(operation.tags)) delete operations[method];
      });
    });
  }

  function getAllRelatedFiles(files) {
    return files.reduce((acc, filePath) => {
      const spec = jsYaml.safeLoad(fs.readFileSync(filePath));
      return acc.concat(_.uniq(getRefFilesPath(spec)).map((p) => {
        const refSpecPath = path.join(path.dirname(filePath), p);
        if (readFiles[refSpecPath]) {
          return refSpecPath;
        } else {
          readFiles[refSpecPath] = true;
          return [refSpecPath].concat(getAllRelatedFiles([refSpecPath]));
        }
      }));
    }, []);
  }
}

module.exports = {
  readSpecFilePromise,
  getPreparedSpecFilePaths,
  convertToLocalDefinition,
  walkSchema,
  ALTERNATIVE_REF_KEY,
  MODEL_DEF_KEY,
};
