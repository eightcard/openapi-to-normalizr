// @ts-nocheck
import path from 'path';
import Swagger from 'swagger-client';
import _ from 'lodash';
import { mkdirpPromise, getModelDefinitions } from './utils';
import {
  readSpecFilePromise,
  getPreparedSpecFilePaths,
  convertToLocalDefinition,
} from './spec_file_utils';
import ModelGenerator from './model_generator';
import SchemaGenerator from './schema_generator';
import ActionTypesGenerator from './action_types_generator';
import JsSpecGenerator from './js_spec_generator';
import Config from './config';

export default function main(specFiles, c) {
  const config = new Config(c);
  const filePaths = getPreparedSpecFilePaths(specFiles, config.tags);

  Promise.all(
    filePaths.map((file) =>
      readSpecFilePromise(file, {
        dereference: true,
      }),
    ),
  )
    .then((schemas) => {
      const spec = _.merge(...schemas);

      let actionTypesGenerator, modelGenerator, schemaGenerator;
      const [actionsDir, schemasDir, specDir] = ['actions', 'schemas', 'jsSpec'].map((key) =>
        path.dirname(config.outputPath[key]),
      );
      const baseModelsDir = `${config.modelsDir}/base`;
      const prepareDirs = [
        actionsDir,
        schemasDir,
        specDir,
        config.modelsDir,
        baseModelsDir,
      ].map((p) => mkdirpPromise(p));

      return Swagger({
        spec,
      })
        .then(({ spec }) => {
          // refとOpenAPI記法(oneOfなど)解決済みのspecからモデル定義を取得
          const definitions = getModelDefinitions(spec);

          return Promise.all(prepareDirs).then(() => {
            const configForModelGenerator = Object.assign(
              {
                outputBaseDir: baseModelsDir,
                definitions,
              },
              config.formatForModelGenerator(),
            );

            modelGenerator = new ModelGenerator(configForModelGenerator);
            actionTypesGenerator = new ActionTypesGenerator(config.formatForActionTypesGenerator());

            const configForSchemaGenerator = Object.assign(
              {
                modelGenerator,
              },
              config.formatForSchemaGenerator(),
            );
            schemaGenerator = new SchemaGenerator(configForSchemaGenerator);
            walkResponses(spec.paths, [schemaGenerator.parse, actionTypesGenerator.appendId]);
            return Promise.all([schemaGenerator, actionTypesGenerator].map((g) => g.write()));
          });
        })
        .catch((e) => {
          console.error(`Failed: ${e}`);
          throw e;
        });
    })
    .then(() => {
      // no need dereference for js spec file
      return Promise.all(
        filePaths.map((file) =>
          readSpecFilePromise(file, {
            dereference: false,
          }),
        ),
      ).then((schemas) => {
        const spec = convertToLocalDefinition(_.merge(...schemas));
        return new JsSpecGenerator(config.formatForJsSpecGenerator()).write(spec);
      });
    })
    .catch((e) => {
      console.error(`Failed: ${e}`);
      throw e;
    });

  function opId(operation, path, method) {
    return Swagger.helpers.opId(operation, path, method);
  }

  function walkResponses(paths, onResponses = []) {
    _.each(paths, (operations, path) => {
      _.each(operations, (operation, method) => {
        if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
          // use only RESTful methods
          return;
        }
        if (!_.isObject(operation)) {
          console.warn(`not processed. path:${path}, method:${method}`);
          return;
        }
        if (operation.operationId) {
          console.info(
            `no use specified operationId. path:${path}, method:${method}, operationId:${operation.operationId}`,
          );
          delete operation.operationId;
        }
        const response = operation.responses;
        const id = opId(operation, path, method);
        onResponses.forEach((onResponse) =>
          onResponse(id, response, {
            path,
            method,
            operation,
          }),
        );
      });
    });
  }
}
