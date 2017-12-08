const path = require('path');
const { writeFilePromise, readTemplates, render } = require('./utils');

class JsSpecCreator {
  constructor({outputDir = '', templatePath, spec, specName}) {
    this.outputDir = outputDir;
    this.templatePath = templatePath;
    this.spec = spec;
    this.specName = specName;
    this.templates = readTemplates(['spec'], this.templatePath);
  }

  write(spec = this.spec) {
    const text = render(this.templates.spec, {
      spec: JSON.stringify(spec, null, 2),
      specName: this.specName,
    }, {
      head: this.templates.head,
    });
    return writeFilePromise(path.join(this.outputDir, this.specName.replace(/\.ya*ml$/, '.js')), text);
  }
}

module.exports = JsSpecCreator;
