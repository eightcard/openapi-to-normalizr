"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const path_1 = __importDefault(require("path"));
const lodash_1 = __importDefault(require("lodash"));
const utils_1 = require("./utils");
const spec_file_utils_1 = require("./spec_file_utils");
const UNNECESSARY_PROPS = [
    spec_file_utils_1.ALTERNATIVE_REF_KEY,
    'description',
    'info',
    spec_file_utils_1.MODEL_DEF_KEY,
    'x-id-attribute',
    'x-attribute-as',
    'x-enum-key-attributes',
];
class JsSpecGenerator {
    constructor({ outputPath = '', templatePath, extension = 'js' }) {
        this.outputPath = outputPath;
        this.templatePath = templatePath;
        this.templates = utils_1.readTemplates(['spec', 'head'], this.templatePath);
        const { dir, name } = path_1.default.parse(this.outputPath);
        this.outputDir = dir;
        this.outputFileName = `${name}.${extension}`;
        this.write = this.write.bind(this);
    }
    write(spec) {
        this.deleteUnnecessaryProps(spec);
        this.deleteUnusedComponents(spec);
        const text = utils_1.render(this.templates.spec, {
            spec: JSON.stringify(spec, null, 2),
        }, {
            head: this.templates.head,
        });
        return utils_1.writeFilePromise(path_1.default.join(this.outputDir, this.outputFileName), text);
    }
    deleteUnnecessaryProps(spec) {
        spec_file_utils_1.walkSchema(spec, (obj) => {
            UNNECESSARY_PROPS.forEach((key) => delete obj[key]);
        });
    }
    deleteUnusedComponents(spec) {
        const useRefs = {};
        // pathから利用しているrefを取得
        spec_file_utils_1.walkSchema(spec.paths, (obj) => {
            if (obj.$ref)
                useRefs[obj.$ref] = true;
        });
        // pathで利用しているrefから芋づる式に利用しているrefを取得
        lodash_1.default.each(useRefs, (_bool, ref) => checkRef(ref));
        // ↑で取得した以外のcomponents情報を削除
        lodash_1.default.each(spec.components, (schemas, key) => {
            lodash_1.default.each(schemas, (_obj, name) => {
                const p = `#/components/${key}/${name}`;
                if (!useRefs[p])
                    delete schemas[name];
            });
        });
        function checkRef(targetRef) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [, components, group, name, ...rest] = targetRef.split('/');
            spec_file_utils_1.walkSchema(spec[components][group][name], (obj) => {
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
exports.default = JsSpecGenerator;
