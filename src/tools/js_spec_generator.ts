import path from 'path';
import _ from 'lodash';
import { writeFilePromise, readTemplates, render } from './utils';
import { walkSchema, MODEL_DEF_KEY, ALTERNATIVE_REF_KEY } from './spec_file_utils';

const UNNECESSARY_PROPS = [
  ALTERNATIVE_REF_KEY,
  'description',
  'info',
  MODEL_DEF_KEY,
  'x-id-attribute',
  'x-attribute-as',
  'x-enum-key-attributes',
];

export default class JsSpecGenerator {
  outputPath: string;

  templatePath: TemplatePath;

  templates: Templates;

  outputDir: string;

  outputFileName: string;

  constructor({
    outputPath = '',
    templatePath,
    extension = 'js',
  }: {
    outputPath?: string;
    templatePath: TemplatePath;
    extension?: Extension;
  }) {
    this.outputPath = outputPath;
    this.templatePath = templatePath;
    this.templates = readTemplates(['spec', 'head'], this.templatePath);
    const { dir, name } = path.parse(this.outputPath);
    this.outputDir = dir;
    this.outputFileName = `${name}.${extension}`;
    this.write = this.write.bind(this);
  }

  write(specData: TODO) {
    this.deleteUnnecessaryProps(specData);
    this.deleteUnusedComponents(specData);
    const { spec, head } = this.templates;
    if (!spec || !head) return;
    const text = render(
      spec,
      {
        spec: JSON.stringify(spec, null, 2),
      },
      {
        head,
      },
    );
    return writeFilePromise(path.join(this.outputDir, this.outputFileName), text);
  }

  deleteUnnecessaryProps(spec: TODO) {
    walkSchema(spec, (obj) => {
      UNNECESSARY_PROPS.forEach((key) => delete obj[key]);
    });
  }

  deleteUnusedComponents(spec: TODO) {
    const useRefs: TODO = {};

    // pathから利用しているrefを取得
    walkSchema(spec.paths, (obj) => {
      if (obj.$ref) useRefs[obj.$ref] = true;
    });
    // pathで利用しているrefから芋づる式に利用しているrefを取得
    _.each(useRefs, (_bool, ref) => checkRef(ref));

    // ↑で取得した以外のcomponents情報を削除
    _.each(spec.components, (schemas, key) => {
      _.each(schemas, (_obj, name) => {
        const p = `#/components/${key}/${name}`;
        if (!useRefs[p]) delete schemas[name];
      });
    });

    function checkRef(targetRef: TODO) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [, components, group, name, ...rest] = targetRef.split('/');
      walkSchema(spec[components][group][name], (obj) => {
        if (obj.$ref) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [hash, components, group, name, ...rest] = obj.$ref.split('/');
          const ref = [hash, components, group, name].join('/');
          useRefs[ref] = true;
          checkRef(ref);
        }
      });
    }
  }
}
