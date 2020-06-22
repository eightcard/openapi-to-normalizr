export default class Config {
  _config: ConfigObject;

  attributeConverter: AttributeConverter;

  modelsDir: string;

  constructor(config: ConfigObject) {
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
    const { templates: templatePath, usePropType, useTypeScript } = this._config;
    return {
      outputDir: this.modelsDir,
      templatePath,
      usePropType,
      useTypeScript,
      attributeConverter: this.attributeConverter,
      extension: this.extension,
    } as const;
  }

  formatForActionTypesGenerator() {
    const { outputPath, templates: templatePath, useTypeScript } = this._config;
    const operationIdList: string[] = [];
    return {
      outputPath: outputPath.actions,
      schemasFilePath: outputPath.schemas,
      templatePath,
      operationIdList,
      useTypeScript,
      extension: this.extension,
    } as const;
  }

  formatForSchemaGenerator() {
    const { outputPath, templates: templatePath, useTypeScript } = this._config;
    return {
      templatePath,
      outputPath: outputPath.schemas,
      modelsDir: this.modelsDir,
      attributeConverter: this.attributeConverter,
      useTypeScript,
      extension: this.extension,
    } as const;
  }

  formatForJsSpecGenerator() {
    const { templates: templatePath, outputPath } = this._config;
    return {
      templatePath,
      outputPath: outputPath.jsSpec,
      extension: this.extension,
    } as const;
  }
}
