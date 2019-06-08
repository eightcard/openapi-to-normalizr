const path = require('path');
const { writeFilePromise, readTemplates, render, walkSchema } = require('./utils');

const UNNECESSARY_PROPS = [
  '__$ref__', 'description', 'info',
  'x-model-name', 'x-id-attribute', 'x-attribute-as', 'x-enum-key-attributes',
];

class JsSpecGenerator {
  constructor({outputPath = '', templatePath, extension = 'js'}) {
    this.outputPath = outputPath;
    this.templatePath = templatePath;
    this.templates = readTemplates(['spec', 'head'], this.templatePath);
    const {dir, name} = path.parse(this.outputPath);
    this.outputDir = dir;
    this.outputFileName = `${name}.${extension}`;
    this.write = this.write.bind(this);
  }

  write(spec) {
    this.reduceUnnecessaryProps(spec);
    const text = render(this.templates.spec, {
      spec: JSON.stringify(spec, null, 2),
    }, {
      head: this.templates.head,
    });
    return writeFilePromise(path.join(this.outputDir, this.outputFileName), text);
  }

  reduceUnnecessaryProps(spec) {
    walkSchema(spec, (obj) => {
      UNNECESSARY_PROPS.forEach((key) => delete obj[key]);
    });
  }
}

module.exports = JsSpecGenerator;
