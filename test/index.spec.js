import assert from 'assert';
import fs from 'fs';
import iReal2MusicXML from '../src/index';

describe('iReal2MusicXML', function() {
  it('should convert an iReal Pro song to MusicXML', function() {
    const result = iReal2MusicXML.convert(fs.readFileSync('test/data/playlist.html', 'utf-8'));
    assert.strictEqual(result.name, 'Jazz Combo')
    assert.strictEqual(result.songs.length, 6);
    assert.notStrictEqual(result.songs[0].musicxml, '');
  });
});
