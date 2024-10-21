import { strict as assert } from 'assert';
import { describe, it } from 'node:test';
import fs from 'fs';
import {
  Version,
  convertSync,
  LogLevel,
  convert,
  Playlist,
  Converter
} from '../build/ireal-musicxml.js';

describe('ireal-musicxml using TypeScript', () => {
  it('accesses the library version', () => {
    assert.strictEqual(Version.name, 'ireal-musicxml');
  });

  it('converts an iReal Pro song to MusicXML synchronously', () => {
    const result: Playlist = convertSync(fs.readFileSync('test/data/playlist.html', 'utf-8'), {
      notation: "rhythmic",
      logLevel: LogLevel.None
    });
    assert.strictEqual(result.name, 'Jazz Combo');
    assert.strictEqual(result.songs.length, 6);
    assert.notStrictEqual(result.songs[0].musicXml, '');
  });

  it('converts an iReal Pro song to MusicXML asynchronously', async () => {
    const result: Playlist = await convert(fs.readFileSync('test/data/playlist.html', 'utf-8'), {
      notation: "slash",
      logLevel: LogLevel.Error
    });
    assert.strictEqual(result.name, 'Jazz Combo');
    assert.strictEqual(result.songs.length, 6);
    assert.notStrictEqual(result.songs[0].musicXml, '');
  });

  it('parses and exports a playlist manually', () => {
    const playlist: Playlist = new Playlist(fs.readFileSync('test/data/playlist.html', 'utf-8'));
    assert.strictEqual(playlist.name, 'Jazz Combo')
    assert.strictEqual(playlist.songs.length, 6);
    const musicXml: string = Converter.convert(playlist.songs[0]);
    assert.notStrictEqual(musicXml, '');
  });
});
