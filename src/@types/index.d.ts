// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare type TODO = any;

declare module 'swagger-client';

declare interface OptionObject {
  dereference?: boolean;
}

declare type AttributeConverter = (s: string) => string;

declare type SchemasFilePath = string;
declare type Actions = string;
declare type TemplatePath = {
  model?: string;
  override?: string;
  schema?: string;
  head?: string;
  dependency?: string;
  models?: string;
  actionTypes?: string;
  spec?: string;
  oneOf?: string;
};
declare type Templates = {
  [key in keyof TemplatePath]: string;
};
declare type UsePropType = boolean;
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
