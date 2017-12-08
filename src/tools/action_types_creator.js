const path = require('path');
const { writeFilePromise, readTemplates, render } = require('./utils');

class ActionTypesCreator {
  constructor({outputDir = '', schemasDir, templatePath = {}, operationIdList = [], specName}) {
    this.outputDir = outputDir;
    this.schemasDir = schemasDir;
    this.templatePath = templatePath;
    this.specName = specName;
    this.operationIdList = operationIdList;
    this.templates = readTemplates(['head', 'actionTypes'], this.templatePath);
    this.appendId = this.appendId.bind(this);
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
      schemasDir: path.relative(this.outputDir, this.schemasDir),
      specName: this.specName,
    }, {
      head: this.templates.head,
    });
    return writeFilePromise(path.join(this.outputDir, 'actionTypes.js'), text);
  }
}

module.exports = ActionTypesCreator;
