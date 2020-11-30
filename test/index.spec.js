import assert from 'assert';
import fs from 'fs';
import * as iReal2MusicXML from '../src/index';

describe('iReal2MusicXML', function() {
  it('converts an iReal Pro song to MusicXML synchronously', function() {
    const result = iReal2MusicXML.convertSync(fs.readFileSync('test/data/playlist.html', 'utf-8'));
    assert.strictEqual(result.name, 'Jazz Combo')
    assert.strictEqual(result.songs.length, 6);
    assert.notStrictEqual(result.songs[0].musicXml, '');
  });

  it('converts an iReal Pro song to MusicXML asynchronously', async function() {
    const result = await iReal2MusicXML.convert(fs.readFileSync('test/data/playlist.html', 'utf-8'));
    assert.strictEqual(result.name, 'Jazz Combo')
    assert.strictEqual(result.songs.length, 6);
    assert.notStrictEqual(result.songs[0].musicXml, '');
  });

  it('parses and exports a playlist manually', function() {
    const playlist = new iReal2MusicXML.Playlist(fs.readFileSync('test/data/playlist.html', 'utf-8'));
    assert.strictEqual(playlist.name, 'Jazz Combo')
    assert.strictEqual(playlist.songs.length, 6);
    const musicXml = iReal2MusicXML.MusicXML.convert(playlist.songs[0]);
    assert.notStrictEqual(musicXml, '');
  });
});
