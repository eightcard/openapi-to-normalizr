import config from '../config/parser-config-default';
import rimraf from 'rimraf';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

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

const snapshot = (command, files, customConfigFilePath) => {
  const customConfigOption = customConfigFilePath
    ? `--config ${path.join(dir, customConfigFilePath)}`
    : '';
  execSync(
    `${dir}/../bin/${command} ${customConfigOption} ${files
      .map((file) => `${dir}/${file}`)
      .join(' ')}`,
  );
  walk(outputDir, (path) => {
    const output = fs.readFileSync(path, 'utf8');
    expect({ path, output }).toMatchSnapshot();
  });
};

describe('schema generator spec', () => {
  beforeEach(() => new Promise((resolve) => rimraf(outputDir, resolve)));

  test('from json schema ref', () => {
    snapshot('generateschemas', ['json_schema_ref.yml']);
  });

  test('from one of check', () => {
    snapshot('generateschemas', ['one_of.yml']);
  });

  test('from one of other spec file  check', () => {
    snapshot('generateschemas', ['one_of_from_other_file.yml']);
  });

  test('from json schema ref TS', () => {
    snapshot('generateschemas', ['json_schema_ref.yml'], './config_ts.js');
  });

  test('from one of check TS', () => {
    snapshot('generateschemas', ['one_of.yml'], './config_ts.js');
  });

  test('from one of other spec file  check TS', () => {
    snapshot('generateschemas', ['one_of_from_other_file.yml'], './config_ts.js');
  });
});
