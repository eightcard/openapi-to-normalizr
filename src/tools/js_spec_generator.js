const path = require('path');
const { writeFilePromise, readTemplates, render, getExtensionByTypeScriptFlag } = require('./utils');

class JsSpecGenerator {
  constructor({outputPath = '', templatePath, spec, useTypeScript = false}) {
    this.outputPath = outputPath;
    this.spec = spec;
    this.templatePath = templatePath;
    this.templates = readTemplates(['spec', 'head'], this.templatePath);
    const {dir, name} = path.parse(this.outputPath);
    this.outputDir = dir;
    this.outputFileName = `${name}.${getExtensionByTypeScriptFlag(useTypeScript)}`;
    this.write = this.write.bind(this);
  }

  write(spec = this.spec) {
    const text = render(this.templates.spec, {
      spec: JSON.stringify(spec, null, 2),
    }, {
      head: this.templates.head,
    });
    return writeFilePromise(path.join(this.outputDir, this.outputFileName), text);
  }
}

module.exports = JsSpecGenerator;
