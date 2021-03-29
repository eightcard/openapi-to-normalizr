import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import Swagger from 'swagger-client';
import _ from 'lodash';
import { mkdirpPromise, getModelDefinitions } from './utils';
import { getPreparedSpec, dereferenceSchema } from './spec_file_utils';
import ModelGenerator from './model_generator';
import SchemaGenerator from './schema_generator';
import ActionTypesGenerator from './action_types_generator';
import JsSpecGenerator from './js_spec_generator';
import Config from './config';

export default async function main(specFiles: TODO, c: TODO) {
  const config = new Config(c);
  const spec = getPreparedSpec(specFiles, config.tags);

  // dereferenceが内部状態を変えてしまうためcopy
  const copiedSpec = JSON.parse(JSON.stringify(spec));

  await dereferenceSchema(spec)
    .then((spec) => {
      let actionTypesGenerator, modelGenerator, schemaGenerator;
      const [actionsDir, schemasDir, specDir] = ([
        'actions',
        'schemas',
        'jsSpec',
      ] as const).map((key) => path.dirname(config.outputPath[key]));
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
        .then(({ spec }: { spec: TODO }) => {
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
        .catch((e: Error) => {
          console.error(`Failed: ${e}`);
          throw e;
        });
    })
    .then(() => new JsSpecGenerator(config.formatForJsSpecGenerator()).write(copiedSpec))
    .catch((e) => {
      console.error(`Failed: ${e}`);
      throw e;
    });

  function opId(operation: TODO, path: TODO, method: TODO) {
    return Swagger.helpers.opId(operation, path, method);
  }

  function walkResponses(paths: TODO, onResponses: TODO[] = []) {
    _.each(paths, (operations, path) => {
      _.each(operations, (operation: TODO, method) => {
        if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
          // use only RESTful methods
          return;
        }
        if (!_.isObject(operation)) {
          console.warn(`not processed. path:${path}, method:${method}`);
          return;
        }

        // @ts-expect-error operationIdがあると認識されていない
        const operationId = operation.operationId;
        if (operationId) {
          console.info(
            `no use specified operationId. path:${path}, method:${method}, operationId:${operationId}`,
          );

          // @ts-expect-error operationIdがあると認識されていない
          delete operation.operationId;
        }

        // @ts-expect-error responsesがあると認識されていない
        const response = operation.responses;
        const id = opId(operation, path, method);
        onResponses.forEach((onResponse: TODO) =>
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
