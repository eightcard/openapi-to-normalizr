"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
class ActionTypesGenerator {
    constructor({ outputPath = '', schemasFilePath = '', templatePath = {}, operationIdList = [], useTypeScript = false, extension = 'js', }) {
        this.outputPath = outputPath;
        const { dir, name, ext } = path_1.default.parse(this.outputPath);
        this.outputDir = dir;
        this.outputFileName = `${name}.${extension}`;
        this.schemasFilePath = schemasFilePath.replace(ext, '');
        this.templatePath = templatePath;
        this.operationIdList = operationIdList;
        this.templates = utils_1.readTemplates(['head', 'actionTypes'], this.templatePath);
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
        const text = utils_1.render(this.templates.actionTypes, {
            operationIdList: this.operationIdList,
            schemasFile: path_1.default.relative(this.outputDir, this.schemasFilePath),
            useTypeScript: this.useTypeScript,
        }, {
            head: this.templates.head,
        });
        return utils_1.writeFilePromise(path_1.default.join(this.outputDir, this.outputFileName), text);
    }
}
exports.default = ActionTypesGenerator;
