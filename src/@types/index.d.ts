// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare type TODO = any;

declare interface OptionObject {
  dereference?: boolean;
}

declare type AttributeConverter = (s: string) => string;

declare interface ConfigObject {
  templates: {
    [K: string]: string;
  };
  outputPath: {
    schemas: string;
    actions: string;
    jsSpec: string;
  };
  modelsDir?: string;
  tags?: string[];
  attributeConverter?: AttributeConverter;
  usePropType: boolean;
  useTypeScript: boolean;
}

declare type SchemasFilePath = ConfigObject['outputPath']['schemas'];
declare type Actions = ConfigObject['outputPath']['actions'];
declare type TemplatePath = ConfigObject['templates'];
declare type UseTypeScript = ConfigObject['useTypeScript'];

declare type Extension = 'ts' | 'js';
