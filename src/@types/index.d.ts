// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare type TODO = any;

declare interface OptionObject {
  dereference?: boolean;
}

declare type AttributeConverter = (s: string) => string;

declare type SchemasFilePath = string;
declare type Actions = string;
declare type TemplatePath = { [K: string]: string };
declare type UseTypeScript = boolean;
declare interface ConfigObject {
  templates: TemplatePath;
  outputPath: {
    schemas: SchemasFilePath;
    actions: Actions;
    jsSpec: string;
  };
  modelsDir?: string;
  tags?: string[];
  attributeConverter?: AttributeConverter;
  usePropType: boolean;
  useTypeScript: UseTypeScript;
}

declare type Extension = 'ts' | 'js';
