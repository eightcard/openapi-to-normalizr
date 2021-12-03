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

  private get useTypeScript() {
    return Boolean(this._config.useTypeScript);
  }

  private get useTypeScriptAction() {
    const { useTypeScriptAction } = this._config;
    return typeof useTypeScriptAction === 'undefined'
      ? this.useTypeScript
      : Boolean(useTypeScriptAction);
  }

  private get useTypeScriptModel() {
    const { useTypeScriptModel } = this._config;
    return typeof useTypeScriptModel === 'undefined'
      ? this.useTypeScript
      : Boolean(useTypeScriptModel);
  }

  private get useTypeScriptSchema() {
    const { useTypeScriptSchema } = this._config;
    return typeof useTypeScriptSchema === 'undefined'
      ? this.useTypeScript
      : Boolean(useTypeScriptSchema);
  }

  private get useTypeScriptSpec() {
    const { useTypeScriptSpec } = this._config;
    return typeof useTypeScriptSpec === 'undefined'
      ? this.useTypeScript
      : Boolean(useTypeScriptSpec);
  }

  private getExtension(useTypeScript: boolean) {
    return useTypeScript ? 'ts' : 'js';
  }

  formatForModelGenerator() {
    const { templates: templatePath, usePropType } = this._config;
    return {
      outputDir: this.modelsDir,
      templatePath,
      usePropType,
      useTypeScript: this.useTypeScriptModel,
      attributeConverter: this.attributeConverter,
      extension: this.getExtension(this.useTypeScriptModel),
    } as const;
  }

  formatForActionTypesGenerator() {
    const { outputPath, templates: templatePath } = this._config;
    const operationIdList: string[] = [];
    return {
      outputPath: outputPath.actions,
      schemasFilePath: outputPath.schemas,
      templatePath,
      operationIdList,
      useTypeScript: this.useTypeScriptAction,
      extension: this.getExtension(this.useTypeScriptAction),
    } as const;
  }

  formatForSchemaGenerator() {
    const { outputPath, templates: templatePath } = this._config;
    return {
      templatePath,
      outputPath: outputPath.schemas,
      modelsDir: this.modelsDir,
      attributeConverter: this.attributeConverter,
      useTypeScript: this.useTypeScriptSchema,
      extension: this.getExtension(this.useTypeScriptSchema),
    } as const;
  }

  formatForJsSpecGenerator() {
    const { templates: templatePath, outputPath } = this._config;
    return {
      templatePath,
      outputPath: outputPath.jsSpec,
      extension: this.getExtension(this.useTypeScriptSpec),
    } as const;
  }
}
