const path = require('path');
const templates = {
  model: 'templates/model_template.mustache',
  override: 'templates/override_template.mustache',
  schema: 'templates/schema_template.mustache',
  head: 'templates/head_template.mustache',
  dependency: 'templates/dependency_template.mustache',
  models: 'templates/models_template.mustache',
  actionTypes: 'templates/action_types_template.mustache',
  spec: 'templates/spec_template.mustache',
  oneOf: 'templates/one_of_template.mustache',
};
module.exports = {
  templates: Object.keys(templates).reduce((acc, key) => {
    acc[key] = path.join(__dirname, '../', templates[key]);
    return acc;
  }, {}),
  modelsDir: 'tmp',
  outputDir: 'tmp',
  useFlow: true,
  usePropType: true,
};
