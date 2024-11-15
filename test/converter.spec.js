import assert from 'node:assert';
import { describe, it, before } from 'node:test';
import fs from 'fs';
import { validateXMLWithXSD } from 'validate-with-xmllint';
import select from 'xpath.js';
import { DOMParser } from '@xmldom/xmldom';
import { Playlist } from '../src/lib/parser.js';
import { Converter } from '../src/lib/converter.js';

let jazz = null;
let playlist = null;
let strange = null;
let blues = null;
let pop = null;

before(() => {
  jazz = new Playlist(fs.readFileSync('test/data/jazz1460.txt', 'utf-8'));
  playlist = new Playlist(fs.readFileSync('test/data/playlist.html', 'utf-8'));
  strange = new Playlist(fs.readFileSync('test/data/strange.html', 'utf-8'));
  blues = new Playlist(fs.readFileSync('test/data/blues50.txt', 'utf-8'));
  pop = new Playlist(fs.readFileSync('test/data/pop400.txt', 'utf-8'));
})

describe('Converter', () => {
  it('should validate MusicXML files', async () => {
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

  it('should create a valid, complete and correct MusicXML for Bolivia', async () => {
    const bolivia = Converter.convert(playlist.songs[0]);
    await validateXMLWithXSD(bolivia, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${playlist.songs[0].title}.musicxml`, bolivia);
    const doc = new DOMParser().parseFromString(bolivia);
    const composer = select(doc, '//creator[@type="composer"]/text()');
    assert.strictEqual(composer[0].toString(), "Cedar Extra Name Walton");
    const firstMeasureDivisions = select(doc, '//measure/attributes/divisions/text()');
    assert.strictEqual(firstMeasureDivisions[0].toString(), "768");
    const firstMeasureGroove = select(doc, '//measure/direction/sound/play/other-play[@type = "groove"]/text()');
    assert.strictEqual(firstMeasureGroove[0].toString(), 'Up Tempo Swing');
    const firstChord = select(doc, '//measure/harmony/root/root-step/text()');
    assert.strictEqual(firstChord[0].toString(), "G");
    const keyFifths = select(doc, '//measure/attributes/key/fifths/text()');
    assert.strictEqual(keyFifths[0].toString(), "2");
    const keyPrint = select(doc, '//measure/attributes/key/@print-object');
    assert.strictEqual(keyPrint[0].value, "no");
    const clefSign = select(doc, '//measure/attributes/clef/sign/text()');
    assert.strictEqual(clefSign[0].toString(), "G");
    const clefPrint = select(doc, '//measure/attributes/clef/@print-object');
    assert.strictEqual(clefPrint[0].value, "no");
    const version = select(doc, '//score-partwise/@version');
    assert.strictEqual(version[0].value, '4.0');
  });

  it('should create a valid, complete and correct MusicXML for Moanin\'', async () => {
    const moanin = Converter.convert(playlist.songs[1], {
      keySignature: true,
      clef: true,
    });
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
    const keyPrint = select(doc, '//measure/attributes/key/@print-object');
    assert.strictEqual(keyPrint[0].value, "yes");
    const clefPrint = select(doc, '//measure/attributes/clef/@print-object');
    assert.strictEqual(clefPrint[0].value, "yes");
  });

  it('should create a valid, complete and correct MusicXML for New Bolero', async () => {
    const bolero = Converter.convert(playlist.songs[2]);
    await validateXMLWithXSD(bolero, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${playlist.songs[2].title}.musicxml`, bolero);
  });

  it('should create a valid, complete and correct MusicXML for Girl From Ipanema', async () => {
    const ipanema = Converter.convert(playlist.songs[3]);
    await validateXMLWithXSD(ipanema, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${playlist.songs[3].title}.musicxml`, ipanema);
    const doc = new DOMParser().parseFromString(ipanema);
    const ending = select(doc, '//barline/ending/@type');
    assert.strictEqual(ending.length, 4);
  });

  it('should create a valid, complete and correct MusicXML for Song For My Father', async () => {
    const father = Converter.convert(playlist.songs[4]);
    await validateXMLWithXSD(father, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${playlist.songs[4].title}.musicxml`, father);
  });

  it('should create a valid, complete and correct MusicXML for All Blues', async () => {
    const blues = Converter.convert(playlist.songs[5]);
    await validateXMLWithXSD(blues, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${playlist.songs[5].title}.musicxml`, blues);
  });

  it('should correctly handle invisible roots', async () => {
    const song = jazz.songs.find(song => song.cells.some(cell => cell.chord && cell.chord.note === 'W'));
    assert.notStrictEqual(song, undefined);
    const musicXml = Converter.convert(song);
    await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${song.title}.musicxml`, musicXml);
  });

  it('should correctly handle uneven bar spacings', async () => {
    const song = jazz.songs.find(song => song.title === 'Take Five');
    assert.notStrictEqual(song, undefined);
    const musicXml = Converter.convert(song);
    await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${song.title}.musicxml`, musicXml);
    const doc = new DOMParser().parseFromString(musicXml);
    const ties = select(doc, '//note/notations/tied');
    assert.strictEqual(ties.length, 2);
  });

  it('should correctly handle timing edge cases', async () => {
    const musicXml = Converter.convert(strange.songs[0]);
    await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${strange.songs[0].title}.musicxml`, musicXml);
  });

  it ('should correctly handle comments and repeats', async () => {
    const song = jazz.songs.find(song => song.title === 'Butterfly');
    assert.notStrictEqual(song, undefined);
    const musicXml = Converter.convert(song);
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

  it('should correctly distinguish between rhythmic notation and slash notation', async () => {
    const song = jazz.songs.find(song => song.title === 'Take Five');
    assert.notStrictEqual(song, undefined);
    {
      const musicXml = Converter.convert(song, { notation: 'rhythmic' });
      await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
      fs.writeFileSync(`test/output/${song.title}-rhythmic.musicxml`, musicXml);
      const doc = new DOMParser().parseFromString(musicXml);
      const measureStyle = select(doc, '//measure/attributes/measure-style/slash/@use-stems');
      assert.strictEqual(measureStyle[0].value, 'yes');
      const noteTypes = select(doc, '//measure/note/type/text()');
      assert.strictEqual(noteTypes[0].toString(), 'half');
    }
    {
      const musicXml = Converter.convert(song, { notation: 'slash' });
      await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
      fs.writeFileSync(`test/output/${song.title}-slash.musicxml`, musicXml);
      const doc = new DOMParser().parseFromString(musicXml);
      const measureStyle = select(doc, '//measure/attributes/measure-style/slash/@use-stems');
      assert.strictEqual(measureStyle[0].value, 'no');
      const noteTypes = select(doc, '//measure/note/type/text()');
      assert.strictEqual(noteTypes[0].toString(), 'quarter');
    }
  });

  it('should correctly convert chords', () => {
    // We don't care about conversion - just add dummy data here.
    const musicXml = new Converter(playlist.songs[0], Converter.defaultOptions);
    musicXml.measure = new Converter.Measure(1, musicXml.options);

    [
      { m: "^7", k: "major-seventh", d: [] },
      { m: "-7", k: "minor-seventh", d: [] },
      { m: "7", k: "dominant", d: [] },
      { m: "7sus", k: "dominant", d: [{ v: '4', t: 'add' }, { v: '3', t: 'subtract' }] },
      { m: "^", k: "major-seventh", d: [] },
      { m: "-", k: "minor", d: [] },
      { m: "7alt", k: "dominant", d: [{ v: '5', a: -1, t: 'alter' }, { v: '9', a: -1, t: 'add' }] },
      { m: "sus", k: "suspended-fourth", d: [] },
      { m: "6", k: "major-sixth", d: [] },
      { m: "-6", k: "minor-sixth", d: [] },
      { m: "o7", k: "diminished-seventh", d: [] },
      { m: "ø7", k: "half-diminished", d: [] },
      { m: "^9", k: "major-ninth", d: [] },
      { m: "-9", k: "minor-ninth", d: [] },
      { m: "9", k: "dominant-ninth", d: [] },
      { m: "9sus", k: "dominant-ninth" },
      { m: "^13", k: "major-13th", d: [] },
      { m: "-11", k: "minor-11th", d: [] },
      { m: "13", k: "dominant-13th", d: [] },
      { m: "13sus", k: "dominant-13th", d: [{ v: '4', t: 'add' }, { v: '3', t: 'subtract' }] },
      { m: "6/9", k: "major-sixth", d: [{ v: '9', t: 'add' }] },
      { m: "-6/9", k: "minor-sixth", d: [{ v: '9', t: 'add' }] },
      { m: "-^7", k: "major-minor", d: [] },
      { m: "-^9", k: "major-ninth", d: [] },
      { m: "^7#11", k: "major-seventh", d: [{ v: '11', a: 1, t: 'add' }] },
      { m: "^9#11", k: "major-ninth", d: [{ v: '11', a: 1, t: 'add' }] },
      { m: "-b6", k: "minor", d: [{ v: '6', a: -1, t: 'add' }] },
      { m: "-#5", k: "minor", d: [{ v: '5', a: 1, t: 'alter' }] },
      { m: "^7#5", k: "major-seventh", d: [{ v: '5', a: 1, t: 'alter' }] },
      { m: "add9", k: "major", d: [{ v: '9', t: 'add' }] },
      { m: "-7b5", k: "half-diminished", d: [] },
      { m: "ø9", k: "minor-ninth", d: [{ v: '5', a: -1, t: 'alter' }] },
      { m: "2", k: "major", d: [{ v: '9', t: 'add' }] },
      { m: "5", k: "power", d: [] },
      { m: "+", k: "augmented", d: [] },
      { m: "o", k: "diminished", d: [] },
      { m: "ø", k: "half-diminished", d: [] },
      { m: "7b9", k: "dominant", d: [{ v: '9', a: -1, t: 'add' }] },
      { m: "7#9", k: "dominant", d: [{ v: '9', a: 1, t: 'add' }] },
      { m: "7b5", k: "dominant", d: [{ v: '5', a: -1, t: 'alter' }] },
      { m: "7#5", k: "augmented-seventh", d: [] },
      { m: "7b13", k: "dominant", d: [{ v: '13', a: -1, t: 'add' }] },
      { m: "7#11", k: "dominant", d: [{ v: '11', a: 1, t: 'add' }] },
      { m: "9#11", k: "dominant-ninth", d: [{ v: '11', a: 1, t: 'add' }] },
      { m: "13#11", k: "dominant-13th", d: [{ v: '11', a: 1, t: 'add' }] },
      { m: "11", k: "dominant-11th", d: [] },
      { m: "7b9sus", k: "dominant", d: [{ v: '9', a: -1, t: 'add' }, { v: '4', t: 'add' }, { v: '3', t: 'subtract' }] },
      { m: "7b13sus", k: "dominant", d: [{ v: '13', a: -1, t: 'add' }, { v: '4', t: 'add' }, { v: '3', t: 'subtract' }] },
      { m: "7add3sus", k: "dominant", d: [{ v: '3', t: 'add' }, { v: '4', t: 'add' }] },
      { m: "9b5", k: "dominant-ninth", d: [{ v: '5', a: -1, t: 'alter' }] },
      { m: "9#5", k: "augmented-seventh", d: [{ v: '9', t: 'add' }] },
      { m: "13b9", k: "dominant-13th", d: [{ v: '9', a: -1, t: 'alter' }] },
      { m: "13#9", k: "dominant-13th", d: [{ v: '9', a: 1, t: 'alter' }] },
      { m: "7b9b13", k: "dominant", d: [{ v: '9', a: -1, t: 'add' }, { v: '13', a: -1, t: 'add' }] },
      { m: "7b9#5", k: "augmented-seventh", d: [{ v: '9', a: -1, t: 'add' }] },
      { m: "7b9b5", k: "dominant", d: [{ v: '5', a: -1, t: 'alter' }, { v: '9', a: -1, t: 'add' }] },
      { m: "7b9#9", k: "dominant", d: [{ v: '9', a: -1, t: 'add' }, { v: '9', a: 1, t: 'add' }] },
      { m: "7#9#5", k: "augmented-seventh", d: [{ v: '9', a: 1, t: 'add' }] },
      { m: "7#9b5", k: "dominant", d: [{ v: '5', a: -1, t: 'alter' }, { v: '9', a: 1, t: 'add' }] },
      { m: "7#9#11", k: "dominant", d: [{ v: '9', a: 1, t: 'add' }, { v: '11', a: 1, t: 'add' }] },
      { m: "7b9#11", k: "dominant", d: [{ v: '9', a: -1, t: 'add' }, { v: '11', a: 1, t: 'add' }] },
      { m: "sus2", k: "suspended-second", d: [] }
    ].forEach(chord => {
      const { rootStep, rootAlter, chordKind, chordDegrees, chordText } = musicXml.convertChordSymbol({
        note: 'D',
        modifiers: chord.m
      });
      assert.strictEqual(chordKind, chord.k, `Expected D${chord.m} kind`);
      if (chord.d) {
        const actualDegrees = chordDegrees.map(degree => {
          const d = {
            v: degree['_content'].filter(c => 'degree-value' in c)[0]['degree-value'],
            t: degree['_content'].filter(c => 'degree-type' in c)[0]['degree-type']
          };
          const a = degree['_content'].filter(c => 'degree-alter' in c);
          if (a.length && a[0]['degree-alter'] !== 0) {
            d.a = a[0]['degree-alter'];
          }
          return d;
        });
        assert.deepStrictEqual(actualDegrees, chord.d, `Expected D${chord.m} degrees`);
      }
    });
  });

  it('should correctly convert 12/8 time signatures', async () => {
    const song = blues.songs.find(song => song.title === 'Come Back Baby');
    assert.notStrictEqual(song, undefined);
    const musicXml = Converter.convert(song, { notation: 'rhythmic' });
    await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${song.title}.musicxml`, musicXml);
    const doc = new DOMParser().parseFromString(musicXml);
    const duration = select(doc, '//measure[1]/note[1]/duration/text()');
    assert.strictEqual(duration[0].toString(), '4608');
  });

  it('should correctly handle missing barlines', async () => {
    const song = pop.songs.find(song => song.title === 'Hard To Say I\'m Sorry');
    assert.notStrictEqual(song, undefined);
    const musicXml = Converter.convert(song, { notation: 'rhythmic' });
    await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${song.title}.musicxml`, musicXml);
  });

  it('should honour options', async () => {
    const song = pop.songs.find(song => song.title === 'Hard To Say I\'m Sorry');
    assert.notStrictEqual(song, undefined);
    const musicXml0 = Converter.convert(song, { date: false });
    await validateXMLWithXSD(musicXml0, 'test/data/musicxml.xsd');
    const doc0 = new DOMParser().parseFromString(musicXml0);
    const date0 = select(doc0, '//encoding/encoding-date');
    assert.strictEqual(date0.length, 0);
    const musicXml1 = Converter.convert(song, { date: true });
    await validateXMLWithXSD(musicXml1, 'test/data/musicxml.xsd');
    const doc1 = new DOMParser().parseFromString(musicXml1);
    const date1 = select(doc1, '//encoding/encoding-date');
    assert.strictEqual(date1.length, 1);
  });

  it('should adjust margins for skipped spaces', async () => {
    const song = jazz.songs.find(song => song.title === 'Aisha');
    assert.notStrictEqual(song, undefined);
    const musicXml = Converter.convert(song, { notation: 'rhythmic' });
    await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${song.title}.musicxml`, musicXml);
    const doc = new DOMParser().parseFromString(musicXml);
    const leftMargin = select(doc, '//measure[@number="9"]//left-margin/text()');
    assert.notStrictEqual(leftMargin[0].toString(), '0.00');

    const song2 = jazz.songs.find(song => song.title === 'Alfie');
    assert.notStrictEqual(song2, undefined);
    const musicXml2 = Converter.convert(song2, { notation: 'rhythmic' });
    await validateXMLWithXSD(musicXml2, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${song2.title}.musicxml`, musicXml2);
    const doc2 = new DOMParser().parseFromString(musicXml2);
    const rightMargin2 = select(doc2, '//measure[@number="10"]//right-margin/text()');
    assert.notStrictEqual(rightMargin2[0].toString(), '0.00');
    const rightMargin3 = select(doc2, '//measure[@number="32"]//right-margin/text()');
    assert.notStrictEqual(rightMargin3[0].toString(), '0.00');

    const song3 = jazz.songs.find(song => song.title === 'A Ballad');
    assert.notStrictEqual(song3, undefined);
    const musicXml3 = Converter.convert(song3, { notation: 'rhythmic' });
    await validateXMLWithXSD(musicXml2, 'test/data/musicxml.xsd');
    fs.writeFileSync(`test/output/${song3.title}.musicxml`, musicXml3);
    const doc3 = new DOMParser().parseFromString(musicXml3);
    const measureDistance = select(doc3, '//measure[@number="38"]//measure-distance/text()');
    assert.notStrictEqual(measureDistance[0].toString(), '0.00');
  });
});
