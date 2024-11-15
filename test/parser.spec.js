import assert from 'node:assert';
import { describe, it } from 'node:test';
import fs from 'fs';
import { Playlist } from '../src/lib/parser.js';

describe('Parser', function() {
  it('should parse an iReal Pro exported playlist', function() {
    const playlist = new Playlist(fs.readFileSync('test/data/playlist.html', 'utf-8'));
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

  it('should parse the iReal Pro Jazz playlist', function() {
    const playlist = new Playlist(fs.readFileSync('test/data/jazz1460.txt', 'utf-8'));
    assert.strictEqual(playlist.songs.length, 1459);
  });

  it('should parse the irealbook:// format', function() {
    const playlist = new Playlist(fs.readFileSync('test/data/irealbook.txt', 'utf-8'));
    assert.strictEqual(playlist.songs.length, 1);
  });

  it('should concatenate multi-part songs', function() {
    const playlist = new Playlist(fs.readFileSync('test/data/pop400.txt', 'utf-8'));
    const songs = playlist.songs.filter(song => song.title.includes('She\'s Always A Woman'));
    assert.strictEqual(songs.length, 1);
  });
});
