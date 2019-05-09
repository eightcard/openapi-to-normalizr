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

const snapshot = (file) => {
  execSync(`${dir}/../bin/generatemodels --config ${dir}/../config/parser-config-default.js ${dir}/${file}`);
  walk(outputDir, (path) => {
    const output = fs.readFileSync(path, 'utf8');
    expect({ path, output }).toMatchSnapshot();
  });
}

describe('model generator spec', () => {
  beforeEach(() => new Promise((resolve) => rimraf(outputDir, resolve)));

  test('from json schema ref', () => {
    snapshot('json_schema_ref.yml')
  });

  test('parse oneOf type', () => {
    snapshot('one_of.yml')
  });
});
