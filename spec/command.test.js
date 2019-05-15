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

const snapshot = (command, files) => {
  execSync(`${dir}/../bin/${command} --config ${dir}/../config/parser-config-default.js ${files.map(file => `${dir}/${file}`).join(' ')}`);
  walk(outputDir, (path) => {
    const output = fs.readFileSync(path, 'utf8');
    expect({ path, output }).toMatchSnapshot();
  });
}

describe('schema generator spec', () => {
  beforeEach(() => new Promise((resolve) => rimraf(outputDir, resolve)));

  test('from json schema ref', () => {
    snapshot('generateschemas', ['json_schema_ref.yml'])
  });

  test('from one of check', () => {
    snapshot('generateschemas', ['one_of.yml'])
  });
});
