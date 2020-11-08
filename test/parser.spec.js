import assert from 'assert';
import fs from 'fs';
import {Playlist} from '../src/parser';

describe('Parser', function() {
  it('should parse an iReal Pro playlist', function() {
    const playlist = new Playlist(fs.readFileSync('test/playlist.html', 'utf-8'));
    assert.strictEqual(playlist.name, "Jazz Combo");
    assert.strictEqual(playlist.songs.length, 6);
    assert.deepStrictEqual(playlist.songs.map(s => s.composer), [
      "Cedar Extra Name Walton",
      "Bobby Timmons",
      "Jeremy Udden",
      "Antônio-Carlos Jobim",
      "Horace Silver",
      "Miles Davis"
    ]);
  });
});
