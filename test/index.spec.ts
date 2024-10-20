import assert from 'node:assert';
import { describe, it } from 'node:test';
import * as fs from 'fs';
import * as iRealMusicXml from '../src/types/ireal-musicxml.js';

describe('iRealMusicXml using TypeScript', function() {
  it('accesses the library version', function() {
    assert.strictEqual(iRealMusicXml.Version.name, 'ireal-musicxml');
  });

  it('converts an iReal Pro song to MusicXML synchronously', function() {
    const result: iRealMusicXml.Playlist = iRealMusicXml.convertSync(fs.readFileSync('test/data/playlist.html', 'utf-8'), {
      notation: "rhythmic",
      logLevel: iRealMusicXml.LogLevel.None
    });
    assert.strictEqual(result.name, 'Jazz Combo')
    assert.strictEqual(result.songs.length, 6);
    assert.notStrictEqual(result.songs[0].musicXml, '');
  });

  it('converts an iReal Pro song to MusicXML asynchronously', async function() {
    const result: iRealMusicXml.Playlist = await iRealMusicXml.convert(fs.readFileSync('test/data/playlist.html', 'utf-8'), {
      notation: "slash",
      logLevel: iRealMusicXml.LogLevel.Error
    });
    assert.strictEqual(result.name, 'Jazz Combo')
    assert.strictEqual(result.songs.length, 6);
    assert.notStrictEqual(result.songs[0].musicXml, '');
  });

  it('parses and exports a playlist manually', function() {
    const playlist: iRealMusicXml.Playlist = new iRealMusicXml.Playlist(fs.readFileSync('test/data/playlist.html', 'utf-8'));
    assert.strictEqual(playlist.name, 'Jazz Combo')
    assert.strictEqual(playlist.songs.length, 6);
    const musicXml: string = iRealMusicXml.Converter.convert(playlist.songs[0]);
    assert.notStrictEqual(musicXml, '');
  });
});
