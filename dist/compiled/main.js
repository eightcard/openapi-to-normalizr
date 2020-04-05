"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const path_1 = __importDefault(require("path"));
const swagger_client_1 = __importDefault(require("swagger-client"));
const lodash_1 = __importDefault(require("lodash"));
const utils_1 = require("./utils");
const spec_file_utils_1 = require("./spec_file_utils");
const model_generator_1 = __importDefault(require("./model_generator"));
const schema_generator_1 = __importDefault(require("./schema_generator"));
const action_types_generator_1 = __importDefault(require("./action_types_generator"));
const js_spec_generator_1 = __importDefault(require("./js_spec_generator"));
const config_1 = __importDefault(require("./config"));
async function main(specFiles, c) {
    const config = new config_1.default(c);
    const spec = spec_file_utils_1.getPreparedSpec(specFiles, config.tags);
    const copiedSpec = JSON.stringify(spec); // dereferenceが内部状態を変えてしまうためcopy
    await spec_file_utils_1.dereferenceSchema(spec)
        .then((spec) => {
        let actionTypesGenerator, modelGenerator, schemaGenerator;
        const [actionsDir, schemasDir, specDir] = ['actions', 'schemas', 'jsSpec'].map((key) => path_1.default.dirname(config.outputPath[key]));
        const baseModelsDir = `${config.modelsDir}/base`;
        const prepareDirs = [
            actionsDir,
            schemasDir,
            specDir,
            config.modelsDir,
            baseModelsDir,
        ].map((p) => utils_1.mkdirpPromise(p));
        return swagger_client_1.default({
            spec,
        })
            .then(({ spec }) => {
            // refとOpenAPI記法(oneOfなど)解決済みのspecからモデル定義を取得
            const definitions = utils_1.getModelDefinitions(spec);
            return Promise.all(prepareDirs).then(() => {
                const configForModelGenerator = Object.assign({
                    outputBaseDir: baseModelsDir,
                    definitions,
                }, config.formatForModelGenerator());
                modelGenerator = new model_generator_1.default(configForModelGenerator);
                actionTypesGenerator = new action_types_generator_1.default(config.formatForActionTypesGenerator());
                const configForSchemaGenerator = Object.assign({
                    modelGenerator,
                }, config.formatForSchemaGenerator());
                schemaGenerator = new schema_generator_1.default(configForSchemaGenerator);
                walkResponses(spec.paths, [schemaGenerator.parse, actionTypesGenerator.appendId]);
                return Promise.all([schemaGenerator, actionTypesGenerator].map((g) => g.write()));
            });
        })
            .catch((e) => {
            console.error(`Failed: ${e}`);
            throw e;
        });
    })
        .then(() => new js_spec_generator_1.default(config.formatForJsSpecGenerator()).write(JSON.parse(copiedSpec)))
        .catch((e) => {
        console.error(`Failed: ${e}`);
        throw e;
    });
    function opId(operation, path, method) {
        return swagger_client_1.default.helpers.opId(operation, path, method);
    }
    function walkResponses(paths, onResponses = []) {
        lodash_1.default.each(paths, (operations, path) => {
            lodash_1.default.each(operations, (operation, method) => {
                if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
                    // use only RESTful methods
                    return;
                }
                if (!lodash_1.default.isObject(operation)) {
                    console.warn(`not processed. path:${path}, method:${method}`);
                    return;
                }
                if (operation.operationId) {
                    console.info(`no use specified operationId. path:${path}, method:${method}, operationId:${operation.operationId}`);
                    delete operation.operationId;
                }
                const response = operation.responses;
                const id = opId(operation, path, method);
                onResponses.forEach((onResponse) => onResponse(id, response, {
                    path,
                    method,
                    operation,
                }));
            });
        });
    }
}
exports.default = main;
