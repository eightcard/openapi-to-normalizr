function snakeToCamel(str) {
  return str.replace(/_./g, (s) => s.charAt(1).toUpperCase());
}

module.exports = {
  modelsDir: './examples/tmp/models',
  attributeConverter: snakeToCamel,
  useFlow: false,
};
