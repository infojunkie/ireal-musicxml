import assert from 'assert';
import fs from 'fs';
import regeneratorRuntime from 'regenerator-runtime';
import {validateXMLWithXSD} from 'validate-with-xmllint';
import select from 'xpath.js';
import {DOMParser} from 'xmldom';
import {Playlist} from '../src/parser';
import {MusicXML} from '../src/musicxml';

describe('MusicXML', function() {
  it('should validate MusicXML files', async function() {
    await validateXMLWithXSD(
      fs.readFileSync('test/data/bolivia.musicxml', 'utf-8'),
      'test/data/musicxml.xsd'
    );
    let failed = false;
    try {
      await validateXMLWithXSD(
        fs.readFileSync('test/data/invalid.musicxml', 'utf-8'),
        'test/data/musicxml.xsd'
      );
    }
    catch {
      failed = true;
    }
    assert.strictEqual(failed, true, 'Expected XML validator to fail for invalid.xml');
  });

  it('should extract information from MusicXML files', function () {
    const doc = new DOMParser().parseFromString(fs.readFileSync('test/data/bolivia.musicxml', 'utf-8'));
    const composer = select(doc, '//creator[@type="composer"]/text()');
    assert.strictEqual(composer.length, 1);
    assert.strictEqual(composer[0].toString(), "Cedar Walton");
  });

  it('should create a valid, complete and correct MusicXML for an iReal song', async function() {
    const playlist = new Playlist(fs.readFileSync('test/data/playlist.html', 'utf-8'));
    const musicxml = MusicXML.convert(playlist.songs[0]);
    console.log(musicxml);
    await validateXMLWithXSD(musicxml, 'test/data/musicxml.xsd');
    const doc = new DOMParser().parseFromString(musicxml);
    const composer = select(doc, '//creator[@type="composer"]/text()');
    assert.strictEqual(composer[0].toString(), "Cedar Extra Name Walton");
    const firstMeasureDivisions = select(doc, '//measure/attributes/divisions/text()');
    assert.strictEqual(firstMeasureDivisions[0].toString(), "768");
    const firstChord = select(doc, '//measure/harmony/root/root-step/text()');
    assert.strictEqual(firstChord[0].toString(), "G");
    const keyFifths = select(doc, '//measure/attributes/key/fifths/text()');
    assert.strictEqual(keyFifths[0].toString(), "2");
    const clefSign = select(doc, '//measure/attributes/clef/sign/text()');
    assert.strictEqual(clefSign[0].toString(), "G");
    const barlineRepeat = select(doc, '//measure/barline/repeat/@direction');
    assert.strictEqual(barlineRepeat[0].toString(), "forward");
  });
});
