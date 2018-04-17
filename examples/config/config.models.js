function snakeToCamel(str) {
  return str.replace(/_./g, (s) => s.charAt(1).toUpperCase());
}

module.exports = {
  outputDir: './tmp/models',
  attributeConverter: snakeToCamel,
};
