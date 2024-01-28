import * as assert from 'assert';
import * as fs from 'fs';
import * as iReal2MusicXML from '../lib/ireal-musicxml';

describe('iReal2MusicXML using TypeScript', function() {
  it('accesses the library version', function() {
    assert.strictEqual(iReal2MusicXML.Version.name, 'ireal-musicxml');
  });

  it('converts an iReal Pro song to MusicXML synchronously', function() {
    const result: iReal2MusicXML.Playlist = iReal2MusicXML.convertSync(fs.readFileSync('test/data/playlist.html', 'utf-8'), {
      notation: "rhythmic",
      logLevel: iReal2MusicXML.LogLevel.None
    });
    assert.strictEqual(result.name, 'Jazz Combo')
    assert.strictEqual(result.songs.length, 6);
    assert.notStrictEqual(result.songs[0].musicXml, '');
  });

  it('converts an iReal Pro song to MusicXML asynchronously', async function() {
    const result: iReal2MusicXML.Playlist = await iReal2MusicXML.convert(fs.readFileSync('test/data/playlist.html', 'utf-8'), {
      notation: "slash",
      logLevel: iReal2MusicXML.LogLevel.Error
    });
    assert.strictEqual(result.name, 'Jazz Combo')
    assert.strictEqual(result.songs.length, 6);
    assert.notStrictEqual(result.songs[0].musicXml, '');
  });

  it('parses and exports a playlist manually', function() {
    const playlist: iReal2MusicXML.Playlist = new iReal2MusicXML.Playlist(fs.readFileSync('test/data/playlist.html', 'utf-8'));
    assert.strictEqual(playlist.name, 'Jazz Combo')
    assert.strictEqual(playlist.songs.length, 6);
    const musicXml: string = iReal2MusicXML.MusicXML.convert(playlist.songs[0]);
    assert.notStrictEqual(musicXml, '');
  });
});
