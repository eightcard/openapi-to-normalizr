function snakeToCamel(str) {
  return str.replace(/_./g, (s) => s.charAt(1).toUpperCase());
}

module.exports = {
  outputPath: {
    schemas: './tmp/schemas/sample_schema.js',
    actions: './tmp/action_types/sample.js',
    jsSpec: './tmp/sample_api.js',
  },
  modelsDir: './tmp/models',
  attributeConverter: snakeToCamel,
};
