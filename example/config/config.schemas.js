function snakeToCamel(str) {
  return str.replace(/_./g, (s) => s.charAt(1).toUpperCase());
}

module.exports = {
  outputPath: {
    schemas: `${__dirname}/../src/autoGen/schemas/sample_schema.{ext}`,
    actions: `${__dirname}/../src/autoGen/action_types/sample.{ext}`,
    jsSpec: `${__dirname}/../src/autoGen/sample_api.{ext}`,
  },
  modelsDir: `${__dirname}/../src/autoGen/models`,
  attributeConverter: snakeToCamel,
  useTypeScript: true,
  // useTypeScriptAction: true,
  // useTypeScriptModel: true,
  // useTypeScriptSchema: true,
  // useTypeScriptSpec: true,
};
