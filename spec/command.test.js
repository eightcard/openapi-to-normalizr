import config from '../config/parser-config-default';
import rimraf from 'rimraf';
import fs from 'fs';
import path from 'path';
import main from '../src/tools/main';

const outputDir = config.modelsDir;
const dir = __dirname;

const walk = (p, fileCallback) => {
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

const snapshot = (files, customConfigFilePath) => {
  const customConfigOption = customConfigFilePath
    ? require(path.join(dir, customConfigFilePath)) // eslint-disable-line global-require
    : null;
  main(files.map((f) => path.join(dir, f)).join(' '), customConfigOption || config);
  walk(outputDir, (path) => {
    const output = fs.readFileSync(path, 'utf8');
    expect({ path, output }).toMatchSnapshot();
  });
};

describe('schema generator spec', () => {
  beforeEach(() => new Promise((resolve) => rimraf(outputDir, resolve)));

  test('from json schema ref', () => {
    snapshot(['json_schema_ref.yml']);
  });

  test('from one of check', () => {
    snapshot(['one_of.yml']);
  });

  test('from one of other spec file  check', () => {
    snapshot(['one_of_from_other_file.yml']);
  });

  test('from json schema ref TS', () => {
    snapshot(['json_schema_ref.yml'], './config_ts.js');
  });

  test('from one of check TS', () => {
    snapshot(['one_of.yml'], './config_ts.js');
  });

  test('from one of other spec file  check TS', () => {
    snapshot(['one_of_from_other_file.yml'], './config_ts.js');
  });
});
