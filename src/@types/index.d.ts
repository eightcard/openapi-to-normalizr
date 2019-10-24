declare type AttributeConverter = (s: string) => string;

declare interface ConfigObject {
  templates: {
    [K: string]: string;
  };
  outputPath: {
    [K: string]: string;
  };
  modelsDir?: string;
  tags?: string[];
  attributeConverter?: AttributeConverter;
  usePropType: boolean;
  useTypeScript: boolean;
}
