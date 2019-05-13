function snakeToCamel(str) {
  return str.replace(/_./g, (s) => s.charAt(1).toUpperCase());
}

module.exports = {
  outputPath: {
    schemas: './examples/tmp/schemas/sample_schema.js',
    actions: './examples/tmp/action_types/sample.js',
    jsSpec: './examples/tmp/sample_api.js',
  },
  modelsDir: './examples/tmp/models',
  attributeConverter: snakeToCamel,
};
