import assert from 'node:assert';
import { describe, it } from 'node:test';
import fs from 'fs';
import {
  convertSync,
  convert,
  Playlist,
  Converter
} from '../src/lib/index.js';

describe('ireal-musicxml', () => {
  it('converts an iReal Pro song to MusicXML synchronously', () => {
    const result = convertSync(fs.readFileSync('test/data/playlist.html', 'utf-8'));
    assert.strictEqual(result.name, 'Jazz Combo')
    assert.strictEqual(result.songs.length, 6);
    assert.notStrictEqual(result.songs[0].musicXml, '');
  });

  it('converts an iReal Pro song to MusicXML asynchronously', async () => {
    const result = await convert(fs.readFileSync('test/data/playlist.html', 'utf-8'));
    assert.strictEqual(result.name, 'Jazz Combo')
    assert.strictEqual(result.songs.length, 6);
    assert.notStrictEqual(result.songs[0].musicXml, '');
  });

  it('parses and exports a playlist manually', () => {
    const playlist = new Playlist(fs.readFileSync('test/data/playlist.html', 'utf-8'));
    assert.strictEqual(playlist.name, 'Jazz Combo')
    assert.strictEqual(playlist.songs.length, 6);
    const musicXml = Converter.convert(playlist.songs[0]);
    assert.notStrictEqual(musicXml, '');
  });
});
