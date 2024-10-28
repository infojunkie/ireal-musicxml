import assert from 'node:assert';
import { describe, it } from 'node:test';
import util from 'util';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const exec = util.promisify(require('child_process').exec);

describe('cli', () => {
  it('should run successfully', async () => {
    const execResult = await exec('node src/cli/cli.js test/data/jazz1460.txt --songs=Blues');
    const output = execResult.stderr;
    console.log(output);
    assert.match(output, /Generating 502 Blues/g);
  })
})
