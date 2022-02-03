import assert from 'assert';
import fs from 'fs';
import 'regenerator-runtime/runtime';
import {validateXMLWithXSD} from 'validate-with-xmllint';
import select from 'xpath.js';
import {DOMParser} from '@xmldom/xmldom';
import {Playlist} from '../src/parser';
import {MusicXML} from '../src/musicxml';

let jazz1350 = null;
let playlist = null;
let strange = null;

before(() => {
  jazz1350 = new Playlist(fs.readFileSync('test/data/jazz1350.txt', 'utf-8'));
  playlist = new Playlist(fs.readFileSync('test/data/playlist.html', 'utf-8'));
  strange = new Playlist(fs.readFileSync('test/data/strange.html', 'utf-8'));
})

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
    const bolivia = MusicXML.convert(playlist.songs[0]);
    await validateXMLWithXSD(bolivia, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${playlist.songs[0].title}.musicxml`, bolivia);
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
  });

  it('should create a valid, complete and correct MusicXML for Moanin\'', async function() {
    const moanin = MusicXML.convert(playlist.songs[1]);
    await validateXMLWithXSD(moanin, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${playlist.songs[1].title}.musicxml`, moanin);
    const doc = new DOMParser().parseFromString(moanin);
    const keyMode = select(doc, '//measure/attributes/key/mode/text()');
    assert.strictEqual(keyMode[0].toString(), "minor");
    const barlineRepeat = select(doc, '//measure/barline/repeat/@direction');
    assert.strictEqual(barlineRepeat[3].value, 'forward');
    assert.strictEqual(barlineRepeat[2].value, 'backward');
    const segno = select(doc, '//measure/direction/sound/@segno');
    assert.strictEqual(segno[0].value, 'segno');
  });

  it('should create a valid, complete and correct MusicXML for New Bolero', async function() {
    const bolero = MusicXML.convert(playlist.songs[2]);
    await validateXMLWithXSD(bolero, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${playlist.songs[2].title}.musicxml`, bolero);
  });

  it('should create a valid, complete and correct MusicXML for Girl From Ipanema', async function() {
    const ipanema = MusicXML.convert(playlist.songs[3]);
    await validateXMLWithXSD(ipanema, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${playlist.songs[3].title}.musicxml`, ipanema);
    const doc = new DOMParser().parseFromString(ipanema);
    const ending = select(doc, '//barline/ending/@type');
    assert.strictEqual(ending.length, 4);
  });

  it('should create a valid, complete and correct MusicXML for Song For My Father', async function() {
    const father = MusicXML.convert(playlist.songs[4]);
    await validateXMLWithXSD(father, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${playlist.songs[4].title}.musicxml`, father);
  });

  it('should create a valid, complete and correct MusicXML for All Blues', async function() {
    const blues = MusicXML.convert(playlist.songs[5]);
    await validateXMLWithXSD(blues, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${playlist.songs[5].title}.musicxml`, blues);
  });

  it('should correctly handle invisible roots', async function() {
    const song = jazz1350.songs.find(song => song.cells.some(cell => cell.chord && cell.chord.note === 'W'));
    assert.notStrictEqual(song, undefined);
    const musicXml = MusicXML.convert(song);
    await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${song.title}.musicxml`, musicXml);
  });

  it('should correctly handle uneven bar spacings', async function() {
    const song = jazz1350.songs.find(song => song.title === 'Take Five');
    assert.notStrictEqual(song, undefined);
    const musicXml = MusicXML.convert(song);
    await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${song.title}.musicxml`, musicXml);
    const doc = new DOMParser().parseFromString(musicXml);
    const ties = select(doc, '//note/tie');
    assert.strictEqual(ties.length, 2);
  });

  it('should correctly handle timing edge cases', async function() {
    const musicXml = MusicXML.convert(strange.songs[0]);
    await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${strange.songs[0].title}.musicxml`, musicXml);
  });

  it ('should correctly handle comments and repeats', async function() {
    const song = jazz1350.songs.find(song => song.title === 'Butterfly');
    assert.notStrictEqual(song, undefined);
    const musicXml = MusicXML.convert(song);
    await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${song.title}.musicxml`, musicXml);
    const doc = new DOMParser().parseFromString(musicXml);
    const chordRoots = select(doc, '//measure/harmony/root/root-step/text()');
    assert.strictEqual(chordRoots[chordRoots.length-1].toString(), 'A');
    const words = select(doc, '//measure/direction/direction-type/words');
    assert.notStrictEqual(words.length, 0);
    const coda = select(doc, '//measure/direction/sound/@coda');
    assert.strictEqual(coda.length, 1);
    const tocoda = select(doc, '//measure/direction/sound/@tocoda');
    assert.strictEqual(tocoda.length, 1);
    const fermata = select(doc, '//note/notations/fermata');
    assert.strictEqual(fermata.length, 1);
    const repeats = select(doc, '//barline/repeat/@times');
    assert.strictEqual(repeats.some(r => r.value === '3'), true);
    const fine = select(doc, '//measure/direction/sound/@fine');
    assert.strictEqual(fine.length, 1);
    const dacapo = select(doc, '//measure/direction/sound/@dacapo');
    assert.strictEqual(dacapo.length, 1);
    const dalsegno = select(doc, '//measure/direction/sound/@dalsegno');
    assert.strictEqual(dalsegno.length, 1);
  });

  it('should correctly distinguish between rhythmic notation and slash notation', async function() {
    const song = jazz1350.songs.find(song => song.title === 'Take Five');
    assert.notStrictEqual(song, undefined);
    {
      const musicXml = MusicXML.convert(song, { notation: 'rhythmic' });
      await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
      fs.writeFileSync(`test/output/${song.title}-rhythmic.musicxml`, musicXml);
      const doc = new DOMParser().parseFromString(musicXml);
      const measureStyle = select(doc, '//measure/attributes/measure-style/slash/@use-stems');
      assert.strictEqual(measureStyle[0].value, 'yes');
      const noteTypes = select(doc, '//measure/note/type/text()');
      assert.strictEqual(noteTypes[0].toString(), 'half');
    }
    {
      const musicXml = MusicXML.convert(song, { notation: 'slash' });
      await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
      fs.writeFileSync(`test/output/${song.title}-slash.musicxml`, musicXml);
      const doc = new DOMParser().parseFromString(musicXml);
      const measureStyle = select(doc, '//measure/attributes/measure-style/slash/@use-stems');
      assert.strictEqual(measureStyle[0].value, 'no');
      const noteTypes = select(doc, '//measure/note/type/text()');
      assert.strictEqual(noteTypes[0].toString(), 'quarter');
    }
  });

  it('should correctly convert chords', function() {
    // We don't care about conversion - just add dummy data here.
    const musicXml = new MusicXML(playlist.songs[0], MusicXML.defaultOptions);
    musicXml.measure = new MusicXML.Measure(1);

    [
      { m: "^7", k: "major-seventh" },
      { m: "-7", k: "minor-seventh" },
      { m: "7", k: "dominant" },
      { m: "7sus", k: "dominant" },
      { m: "^", k: "major-seventh" },
      { m: "-", k: "minor" },
      { m: "7alt", k: "dominant" },
      { m: "sus", k: "suspended-fourth" },
      { m: "6", k: "major-sixth" },
      { m: "-6", k: "minor-sixth" },
      { m: "o7", k: "diminished-seventh" },
      { m: "ø7", k: "half-diminished" },
      { m: "^9", k: "major-ninth" },
      { m: "-9", k: "minor-ninth" },
      { m: "9", k: "dominant-ninth" },
      { m: "9sus", k: "dominant-ninth" },
      { m: "^13", k: "major-13th" },
      { m: "-11", k: "minor-11th" },
      { m: "13", k: "dominant-13th" },
      { m: "13sus", k: "dominant-13th" },
      { m: "6/9", k: "major-sixth" },
      { m: "-6/9", k: "minor-sixth" },
      { m: "-^7", k: "major-minor" },
      { m: "-^9", k: "major-ninth" },
      { m: "^7#11", k: "major-seventh" },
      { m: "^9#11", k: "major-ninth" },
      { m: "-b6", k: "minor" },
      { m: "-#5", k: "minor" },
      { m: "^7#5", k: "major-seventh" },
      { m: "add9", k: "major" },
      { m: "-7b5", k: "half-diminished" },
      { m: "ø9", k: "minor-ninth" },
      { m: "2", k: "major" },
      { m: "5", k: "power" },
      { m: "+", k: "augmented" },
      { m: "o", k: "diminished" },
      { m: "ø", k: "half-diminished" },
      { m: "7b9", k: "dominant" },
      { m: "7#9", k: "dominant" },
      { m: "7b5", k: "dominant" },
      { m: "7#5", k: "dominant" },
      { m: "7b13", k: "dominant" },
      { m: "7#11", k: "dominant" },
      { m: "9#11", k: "dominant-ninth" },
      { m: "13#11", k: "dominant-13th" },
      { m: "11", k: "dominant-11th" },
      { m: "7b9sus", k: "dominant" },
      { m: "7b13sus", k: "dominant" },
      { m: "7add3sus", k: "dominant" },
      { m: "9b5", k: "dominant-ninth" },
      { m: "9#5", k: "dominant-ninth" },
      { m: "13b9", k: "dominant-13th" },
      { m: "13#9", k: "dominant-13th" },
      { m: "7b9b13", k: "dominant" },
      { m: "7b9#5", k: "dominant" },
      { m: "7b9b5", k: "dominant" },
      { m: "7b9#9", k: "dominant" },
      { m: "7#9#5", k: "dominant" },
      { m: "7#9b5", k: "dominant" },
      { m: "7#9#11", k: "dominant" },
      { m: "7b9#11", k: "dominant" },
//      { m: "sus2", k: "suspended-second" }
    ].forEach(chord => {
      const { rootStep, rootAlter, chordKind, chordDegrees, chordText } = musicXml.convertChordSymbol({
        note: 'D',
        modifiers: chord.m
      });
      assert.strictEqual(chordKind, chord.k, `Expected D${chord.m} kind`);
    });
  });
});
