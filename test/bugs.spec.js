import assert from 'node:assert';
import { describe, it, before } from 'node:test';
import fs from 'fs';
import { validateXMLWithXSD } from 'validate-with-xmllint';
import select from 'xpath.js';
import { DOMParser } from '@xmldom/xmldom';
import { Playlist } from '../src/lib/parser.js';
import { Converter } from '../src/lib/converter.js';

let jazz = null;
let blues = null;
let pop = null;

before(() => {
  jazz = new Playlist(fs.readFileSync('test/data/jazz1460.txt', 'utf-8'));
  blues = new Playlist(fs.readFileSync('test/data/blues50.txt', 'utf-8'));
  pop = new Playlist(fs.readFileSync('test/data/pop400.txt', 'utf-8'));
})

describe('Bug fix', () => {
  it('checks #18 cannot read property \'spaces\' of undefined', async () => {
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
      const musicXml = Converter.convert(song);
      await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
      fs.writeFileSync(`test/output/${song.title}.musicxml`, musicXml);
    }
  });

  it('checks #20 missing measures', async () => {
    for (const test of [
      { title: "A Ballad", measures: 41 },
      { title: "After You", measures: 32 },
    ]) {
      const song = jazz.songs.find(song => song.title === test.title);
      assert.notStrictEqual(song, undefined);
      const musicXml = Converter.convert(song);
      await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
      fs.writeFileSync(`test/output/${song.title}.musicxml`, musicXml);
      const doc = new DOMParser().parseFromString(musicXml);
      const measures = select(doc, '//measure');
      assert.strictEqual(measures.length, test.measures);
    }
  });

  it('doesn\'t crash on empty songs', async () => {
    const brendan = new Playlist(fs.readFileSync('test/data/brendan.html', 'utf-8'));
  });

  it('checks #54 messy chord timings', async () => {
    for (const test of [{
      title: "Come Back Baby",
      playlist: blues,
      check: doc => {
        const duration = select(doc, '//measure[3]/harmony[2]/following-sibling::note/duration/text()');
        assert.strictEqual(duration[0].toString(), '1152');
      }
    }, {
      title: "Afro Blue",
      playlist: jazz,
      check: doc => {
        const duration = select(doc, '//measure[3]/harmony[1]/following-sibling::note/duration/text()');
        assert.strictEqual(duration[0].toString(), '1152');
      }
    }, {
      title: "Take Five",
      playlist: jazz,
      check: doc => {
        const duration = select(doc, '//measure[1]/harmony[1]/following-sibling::note/duration/text()');
        assert.strictEqual(duration[0].toString(), '2304');
      }
    }, {
      title: "That's What Friends Are For",
      playlist: pop,
      check: doc => {
        const duration = select(doc, '//measure[22]/harmony[1]/following-sibling::note/duration/text()');
        assert.strictEqual(duration[0].toString(), '3072');
      }
    }]) {
      const song = test.playlist.songs.find(song => song.title === test.title);
      assert.notStrictEqual(song, undefined);
      const musicXml = Converter.convert(song);
      await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
      fs.writeFileSync(`test/output/${song.title}.musicxml`, musicXml);
      const doc = new DOMParser().parseFromString(musicXml);
      test.check(doc);
    }
  });

  it('checks #62 invalid file', async () => {
    const country = new Playlist(fs.readFileSync('test/data/country.txt', 'utf-8'));
    const song = country.songs.find(song => song.title === 'Jackson');
    assert.notStrictEqual(song, undefined);
    const musicXml = Converter.convert(song);
    fs.writeFileSync(`test/output/${song.title}.musicxml`, musicXml);
    await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
  });

  it('succeeds for dixieland1 playlist', async () => {
    const dixieland1 = new Playlist(fs.readFileSync('test/data/dixieland1.txt', 'utf-8'));
    for (const title of [
      'All I Do Is Dream Of You',
      'Beautiful Dreamer',
      'Bouncin\' Around'
    ]) {
      const song = dixieland1.songs.find(song => song.title === title);
      assert.notStrictEqual(song, undefined);
      const musicXml = Converter.convert(song);
      fs.writeFileSync(`test/output/${song.title}.musicxml`, musicXml);
      await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
    }
  });
});
