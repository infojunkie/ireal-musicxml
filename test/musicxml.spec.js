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

  it('should create a valid, complete and correct MusicXML for Bolivia', async function() {
    const playlist = new Playlist(fs.readFileSync('test/data/playlist.html', 'utf-8'));
    const bolivia = MusicXML.convert(playlist.songs[0]);
    await validateXMLWithXSD(bolivia, 'test/data/musicxml.xsd');
    const doc = new DOMParser().parseFromString(bolivia);
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
    assert.strictEqual(barlineRepeat[3].value, "forward");
    assert.strictEqual(barlineRepeat[2].value, "backward");
    const segno = select(doc, '//direction/direction-type/segno');
    assert.strictEqual(segno.length, 1);
    const words = select(doc, '//direction/direction-type/words/text()');
    assert.strictEqual(words[0].toString(), 'Fine');
  });

  it('should create a valid, complete and correct MusicXML for Moanin\'', async function() {
    const playlist = new Playlist(fs.readFileSync('test/data/playlist.html', 'utf-8'));
    const moanin = MusicXML.convert(playlist.songs[1]);
    console.log(moanin);
    await validateXMLWithXSD(moanin, 'test/data/musicxml.xsd');
    const doc = new DOMParser().parseFromString(moanin);
    const keyMode = select(doc, '//measure/attributes/key/mode/text()');
    assert.strictEqual(keyMode[0].toString(), "minor");
  });

  it('should create a valid, complete and correct MusicXML for New Bolero', async function() {
    const playlist = new Playlist(fs.readFileSync('test/data/playlist.html', 'utf-8'));
    const bolero = MusicXML.convert(playlist.songs[2]);
    await validateXMLWithXSD(bolero, 'test/data/musicxml.xsd');
    const doc = new DOMParser().parseFromString(doc);
  });

  it('should create a valid, complete and correct MusicXML for Girl From Ipanema', async function() {
    const playlist = new Playlist(fs.readFileSync('test/data/playlist.html', 'utf-8'));
    const ipanema = MusicXML.convert(playlist.songs[3]);
    await validateXMLWithXSD(ipanema, 'test/data/musicxml.xsd');
    const doc = new DOMParser().parseFromString(ipanema);
  });

  it('should create a valid, complete and correct MusicXML for Song For My Father', async function() {
    const playlist = new Playlist(fs.readFileSync('test/data/playlist.html', 'utf-8'));
    const father = MusicXML.convert(playlist.songs[4]);
    await validateXMLWithXSD(father, 'test/data/musicxml.xsd');
    const doc = new DOMParser().parseFromString(father);
  });

  it('should create a valid, complete and correct MusicXML for All Blues', async function() {
    const playlist = new Playlist(fs.readFileSync('test/data/playlist.html', 'utf-8'));
    const blues = MusicXML.convert(playlist.songs[5]);
    await validateXMLWithXSD(blues, 'test/data/musicxml.xsd');
    const doc = new DOMParser().parseFromString(blues);
  });
});
