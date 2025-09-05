const assert = require('node:assert');
const { describe, it } = require('node:test');
const fs = require('fs');
const {
  Version,
  convertSync,
  LogLevel,
  convert,
  Playlist,
  Converter
} = require('../build/ireal-musicxml.cjs');

describe('ireal-musicxml using CommonJS', () => {
  it('accesses the library version', () => {
    assert.strictEqual(Version.name, '@music-i18n/ireal-musicxml');
  });

  it('converts an iReal Pro song to MusicXML synchronously', () => {
    const result = convertSync(fs.readFileSync('test/data/playlist.html', 'utf-8'), {
      notation: "rhythmic",
      logLevel: LogLevel.None
    });
    assert.strictEqual(result.name, 'Jazz Combo');
    assert.strictEqual(result.songs.length, 6);
    assert.notStrictEqual(result.songs[0].musicXml, '');
  });

  it('converts an iReal Pro song to MusicXML asynchronously', async () => {
    const result = await convert(fs.readFileSync('test/data/playlist.html', 'utf-8'), {
      notation: "slash",
      logLevel: LogLevel.Error
    });
    assert.strictEqual(result.name, 'Jazz Combo');
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
