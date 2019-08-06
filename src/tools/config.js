class Config {
  constructor(config) {
    this._config = config;
    this.attributeConverter = config.attributeConverter ? config.attributeConverter : (str) => str;
    this.modelsDir = config.modelsDir || 'dist';
  }

  get tags() {
    return this._config.tags;
  }

  get outputPath() {
    return this._config.outputPath;
  }

  get useTypeScript() {
    return this._config.useTypeScript;
  }

  get extension() {
    return this._config.useTypeScript ? 'ts' : 'js';
  }

  formatForModelGenerator() {
    const {
      modelsDir: outputDir,
      templates: templatePath,
      usePropType,
      useFlow,
      useTypeScript,
      attributeConverter,
    } = this._config;
    return {
      outputDir,
      templatePath,
      usePropType,
      useFlow,
      useTypeScript,
      attributeConverter,
      extension: this.extension,
    };
  }

  formatForActionTypesGenerator() {
    const { outputPath, templates: templatePath, useTypeScript } = this._config;
    return {
      templatePath,
      outputPath: outputPath.actions,
      schemasFilePath: outputPath.schemas,
      useTypeScript,
      extension: this.extension,
    };
  }

  formatForSchemaGenerator() {
    const {
      outputPath,
      templates: templatePath,
      modelsDir,
      attributeConverter,
      useTypeScript,
    } = this._config;
    return {
      templatePath,
      outputPath: outputPath.schemas,
      modelsDir,
      attributeConverter,
      useTypeScript,
      extension: this.extension,
    };
  }

  formatForJsSpecGenerator() {
    const { templates: templatePath, outputPath } = this._config;
    return {
      templatePath,
      outputPath: outputPath.jsSpec,
      extension: this.extension,
    };
  }
}

module.exports = Config;
