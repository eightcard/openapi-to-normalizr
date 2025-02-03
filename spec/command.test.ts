// @ts-expect-error configファイルの想定する型がまだわかりきってない。書くならindex.d.tsに
import defaultConfig from '../config/parser-config-default';
import { rimrafSync } from 'rimraf';
import fs from 'fs';
import path from 'path';
import main from '../src/tools/main';

const outputDir: string = defaultConfig.modelsDir;
const dir = __dirname;

const walk = (p: string, fileCallback: (fp: string) => void) => {
  const files = fs.readdirSync(p);
  files.forEach((f) => {
    const fp = path.join(p, f);
    if (fs.statSync(fp).isDirectory()) {
      walk(fp, fileCallback);
    } else {
      fileCallback(fp);
    }
  });
};

const snapshot = async (files: string[], customConfigFilePath?: string) => {
  const customConfigOption = customConfigFilePath
    ? require(path.join(dir, customConfigFilePath)) // eslint-disable-line global-require
    : {};
  const config = Object.assign({}, defaultConfig, customConfigOption);
  await main(
    files.map((f) => path.join(dir, f)),
    config,
  );
  walk(outputDir, (path: string) => {
    const output = fs.readFileSync(path, 'utf8');
    expect({ path, output }).toMatchSnapshot();
  });
};

describe('schema generator spec', () => {
  beforeEach(() => rimrafSync(outputDir));

  test('from json schema ref', () => snapshot(['json_schema_ref.yml']));

  test('from one of check', () => snapshot(['one_of.yml']));

  test('from one of other spec file  check', () => snapshot(['one_of_from_other_file.yml']));

  test('from json schema ref TS', () => snapshot(['json_schema_ref.yml'], './config_ts.js'));

  test('from one of check TS', () => snapshot(['one_of.yml'], './config_ts.js'));

  test('from one of other spec file  check TS', () =>
    snapshot(['one_of_from_other_file.yml'], './config_ts.js'));
});
