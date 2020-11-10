import assert from 'assert';
import fs from 'fs';
import regeneratorRuntime from 'regenerator-runtime';
import {validateXMLWithXSD} from 'validate-with-xmllint';
import {Playlist, Song} from '../src/parser';
import {MusicXML} from '../src/musicxml';

describe('MusicXML', function() {
  it('should validate MusicXML files', async function() {
    await validateXMLWithXSD(
      fs.readFileSync('test/data/bolivia.xml', 'utf-8'),
      'test/data/musicxml.xsd'
    );
    let failed = false;
    try {
      await validateXMLWithXSD(
        fs.readFileSync('test/data/invalid.xml', 'utf-8'),
        'test/data/musicxml.xsd'
      );
    }
    catch {
      failed = true;
    }
    assert.strictEqual(failed, true, 'Expected XML validator to fail for invalid.xml');
  });

  it('should create a valid MusicXML for an iReal song', async function() {
    const playlist = new Playlist(fs.readFileSync('test/data/playlist.html', 'utf-8'));
    const musicxml = MusicXML.convert(playlist.songs[0]);
    await validateXMLWithXSD(musicxml, 'test/data/musicxml.xsd');
  });
});
