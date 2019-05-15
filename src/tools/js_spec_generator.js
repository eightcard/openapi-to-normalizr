const path = require('path');
const { writeFilePromise, readTemplates, render } = require('./utils');

class JsSpecGenerator {
  constructor({outputPath = '', templatePath, spec}) {
    this.outputPath = outputPath;
    this.spec = spec;
    this.templatePath = templatePath;
    this.templates = readTemplates(['spec', 'head'], this.templatePath);
    const {dir, name, ext} = path.parse(this.outputPath);
    this.outputDir = dir;
    this.outputFileName = `${name}${ext}`;
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
