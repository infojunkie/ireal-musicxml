import assert from 'assert';
import fs from 'fs';
import iReal2MusicXML from '../src/index';

describe('iReal2MusicXML', function() {
  it('should convert an iReal Pro song to MusicXML', function() {
    const playlist = fs.readFileSync('test/playlist.html', 'utf-8');
    console.log(iReal2MusicXML);
    assert.notDeepStrictEqual(iReal2MusicXML.convert(playlist), []);
  });
});
