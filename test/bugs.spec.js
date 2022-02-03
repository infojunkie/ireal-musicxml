import assert from 'assert';
import fs from 'fs';
import 'regenerator-runtime/runtime';
import {validateXMLWithXSD} from 'validate-with-xmllint';
import select from 'xpath.js';
import {DOMParser} from '@xmldom/xmldom';
import {Playlist} from '../src/parser';
import {MusicXML} from '../src/musicxml';

let jazz1350 = null;

before(() => {
  jazz1350 = new Playlist(fs.readFileSync('test/data/jazz1350.txt', 'utf-8'));
})

describe('Bug Fixes', function() {
  it('Checks #18 Cannot read property \'spaces\' of undefined', async () => {
    for (const title of [
      "All Or Nothing At All",
      "Brazilian Suite",
      "Bud Powell",
      "Cabin in the Sky",
      "Corcovado",
      "Crepuscule With Nellie",
      "Driftin'",
      "Ill Wind",
      "In a Sentimental Mood",
      "Invitation",
      "It's Only a Paper Moon",
      "Lover Man",
      "Memories Of You",
      "My One And Only Love",
      "On The Sunny Side Of The Street",
      "Polkadots And Moonbeams",
      "Prelude To A Kiss",
      "Speak Low",
      "Spring Can Really Hang You Up The Most",
      "That's All",
      "There's A Small Hotel",
      "Travels",
      "Yesterday's Gardenias",
      "You Took Advantage Of Me"
    ]) {
      const song = jazz1350.songs.find(song => song.title === title);
      assert.notStrictEqual(song, undefined);
      const musicXml = MusicXML.convert(song);
      await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
      fs.writeFileSync(`test/output/${song.title}.musicxml`, musicXml);
    }
  }).timeout(0);

  it('Checks #20 Missing measures', async () => {
    for (const test of [
      { title: "A Ballad", measures: 42 },
      { title: "After You", measures: 32 },
    ]) {
      const song = jazz1350.songs.find(song => song.title === test.title);
      assert.notStrictEqual(song, undefined);
      const musicXml = MusicXML.convert(song);
      await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
      fs.writeFileSync(`test/output/${song.title}.musicxml`, musicXml);
      const doc = new DOMParser().parseFromString(musicXml);
      const measures = select(doc, '//measure');
      assert.strictEqual(measures.length, test.measures);
    }
  });

  it('Checks #25 Altered degree', async () => {
    // We don't care about conversion - just add dummy data here.
    const playlist = new Playlist(fs.readFileSync('test/data/playlist.html', 'utf-8'));
    const musicXml = new MusicXML(playlist.songs[0], MusicXML.defaultOptions);
    musicXml.measure = new MusicXML.Measure(1);

    [
      { m: "7b5", d: [{ v: '5', t: 'alter' }] },
      { m: "7#5", d: [{ v: '5', t: 'alter' }] },
      { m: "7b13", d: [{ v: '13', t: 'add' }] },
      { m: "7#11", d: [{ v: '11', t: 'add' }] },
      { m: "9#11", d: [{ v: '11', t: 'add' }] },
      { m: "13#11", d: [{ v: '11', t: 'add' }] }, // That's what chord-symbol returns so OK
      { m: "9b5", d: [{ v: '5', t: 'alter' }] },
      { m: "9#5", d: [{ v: '5', t: 'alter' }] },
      { m: "13b9", d: [{ v: '9', t: 'alter' }] },
      { m: "13#9", d: [{ v: '9', t: 'alter' }] },
      { m: "7b9b13", d: [{ v: '9', t: 'add' },{ v: '13', t: 'add' }] },
      { m: "7b9#5", d: [{ v: '5', t: 'alter' },{ v: '9', t: 'add' }] },
      { m: "7b9b5", d: [{ v: '5', t: 'alter' },{ v: '9', t: 'add' }] },
      { m: "7b9#9", d: [{ v: '9', t: 'add' },{ v: '9', t: 'add' }] },
      { m: "7#9#5", d: [{ v: '5', t: 'alter' },{ v: '9', t: 'add' }] },
      { m: "7#9b5", d: [{ v: '5', t: 'alter' },{ v: '9', t: 'add' }] },
      { m: "7#9#11", d: [{ v: '9', t: 'add' },{ v: '11', t: 'add' }] },
      { m: "7b9#11", d: [{ v: '9', t: 'add' },{ v: '11', t: 'add' }] },
    ].forEach(chord => {
      const { rootStep, rootAlter, chordKind, chordDegrees, chordText } = musicXml.convertChordSymbol({
        note: 'D',
        modifiers: chord.m
      });
      const actualDegrees = chordDegrees.map(degree => {
        return {
          v: degree['_content'].filter(c => c['degree-value'])[0]['degree-value'],
          t: degree['_content'].filter(c => c['degree-type'])[0]['degree-type'],
        }
      });
      assert.deepStrictEqual(actualDegrees, chord.d, `Expected D${chord.m} degrees`);

    });
  });
});
