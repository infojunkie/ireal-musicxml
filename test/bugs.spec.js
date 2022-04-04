import assert from 'assert';
import fs from 'fs';
import 'regenerator-runtime/runtime';
import {validateXMLWithXSD} from 'validate-with-xmllint';
import select from 'xpath.js';
import {DOMParser} from '@xmldom/xmldom';
import {Playlist} from '../src/parser';
import {MusicXML} from '../src/musicxml';

let jazz = null;

before(() => {
  jazz = new Playlist(fs.readFileSync('test/data/jazz.txt', 'utf-8'));
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
      const song = jazz.songs.find(song => song.title === title);
      assert.notStrictEqual(song, undefined);
      const musicXml = MusicXML.convert(song);
      await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
      fs.writeFileSync(`test/output/${song.title}.musicxml`, musicXml);
    }
  }).timeout(0);

  it('Checks #20 Missing measures', async () => {
    for (const test of [
      { title: "A Ballad", measures: 41 },
      { title: "After You", measures: 32 },
    ]) {
      const song = jazz.songs.find(song => song.title === test.title);
      assert.notStrictEqual(song, undefined);
      const musicXml = MusicXML.convert(song);
      await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
      fs.writeFileSync(`test/output/${song.title}.musicxml`, musicXml);
      const doc = new DOMParser().parseFromString(musicXml);
      const measures = select(doc, '//measure');
      assert.strictEqual(measures.length, test.measures);
    }
  });
});
