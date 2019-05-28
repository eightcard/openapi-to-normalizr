const path = require('path');
const { writeFilePromise, readTemplates, render, getExtensionByTypeScriptFlag } = require('./utils');

class ActionTypesGenerator {
  constructor({outputPath = '', schemasFilePath = '', templatePath = {}, operationIdList = [], useTypeScript = false}) {
    this.outputPath = outputPath;
    const {dir, name} = path.parse(this.outputPath);
    this.outputDir = dir;
    this.outputFileName = `${name}.${getExtensionByTypeScriptFlag(useTypeScript)}`;
    this.schemasFilePath = schemasFilePath;
    this.templatePath = templatePath;
    this.operationIdList = operationIdList;
    this.templates = readTemplates(['head', 'actionTypes'], this.templatePath);
    this.appendId = this.appendId.bind(this);
    this.write = this.write.bind(this);
    this.useTypeScript = useTypeScript;
  }

  appendId(id) {
    this.operationIdList.push(id.toUpperCase());
  }

  /**
   * actionTypes.jsを書き出し
   */
  write() {
    const text = render(this.templates.actionTypes, {
      operationIdList: this.operationIdList,
      schemasFile: path.relative(this.outputDir, this.schemasFilePath).replace(/\.\w+$/, ''),
      useTypeScript: this.useTypeScript,
    }, {
      head: this.templates.head,
    });
    return writeFilePromise(path.join(this.outputDir, this.outputFileName), text);
  }
}

module.exports = ActionTypesGenerator;
