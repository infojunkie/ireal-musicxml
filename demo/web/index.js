const osmd = require('opensheetmusicdisplay');
const abcjs = require('abcjs');
const xml2abc = require('xml2abc');
const unzip = require('unzipit');
const parserError = require('sane-domparser-error');
const ireal2musicxml = require('../../lib/ireal-musicxml');
const jazz1350 = require('../../test/data/jazz1350.txt');
const $ = window.$ = require('jquery');
const midiParser = require('midi-json-parser');
const midiPlayer = require('midi-player');
const midiSlicer = require('midi-file-slicer');

// Current state.
let musicXml = null;
let openSheetMusicDisplay = null;
let midi = {
  access: null,
  json: null,
  player: null,
  score: null
}

function handleIRealChange(e) {
  const playlist = new ireal2musicxml.Playlist(e.target.value);
  populateSheets(playlist);
}

function tryMusicXML(xml) {
  try {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    parserError.failOnParseError(doc);
    let title = 'Unknown Title';
    try {
      title = doc.getElementsByTagName('work-title')[0].textContent;
    }
    catch (ex) {
      // Do nothing.
    }
    // Hand-make a fake playlist.
    const playlist = {
      name: 'Uploaded MusicXML',
      songs: [{
        title,
        composer: null,
        style: null,
        groove: null,
        key: null,
        transpose: null,
        bpm: null,
        repeats: null,
        music: null,
        cells: null,
        musicXml: xml
      }]
    };
    populateSheets(playlist);
    return true;
  }
  catch (ex) {
    console.warn(ex.toString());
    return false;
  }
}

async function tryCompressedMusicXML(buf) {
  try {
    const decoder = new TextDecoder();
    const {entries} = await unzip.unzip(buf);

    // Extract rootfile from META-INF/container.xml.
    const containerBuf =  await entries['META-INF/container.xml'].arrayBuffer();
    const doc = new DOMParser().parseFromString(decoder.decode(containerBuf), 'text/xml');
    const rootFile = doc.getElementsByTagName('rootfile')[0].getAttribute('full-path');

    // Parse rootfile as MusicXML.
    const rootBuf = await entries[rootFile].arrayBuffer();
    return tryMusicXML(decoder.decode(rootBuf));
  }
  catch (ex) {
    console.warn(ex.toString());
    return false;
  }
}

function tryiRealPro(ireal) {
  try {
    const playlist = new ireal2musicxml.Playlist(ireal);
    populateSheets(playlist);
    return true;
  }
  catch (ex) {
    console.warn(ex.toString());
    return false;
  }
}

function handleFileSelect(e) {
  document.getElementById('file-error').textContent = '';
  const reader = new FileReader();
  const file = e.target.files[0];
  reader.onloadend = async function(ee) {
    const decoder = new TextDecoder();
    const text = decoder.decode(ee.target.result);
    if (file.type === 'text/xml' && tryMusicXML(text)) return;
    if (file.type.includes('musicxml') && (tryMusicXML(text) || await tryCompressedMusicXML(ee.target.result))) return;
    if (tryiRealPro(text)) return;
    document.getElementById('file-error').textContent = 'This file is not recognized as either iReal Pro or MusicXML.';
  };
  if (file.size < 5*1000*1000) {
    reader.readAsArrayBuffer(file);
  }
  else {
    document.getElementById('file-error').textContent = 'This file is too large.';
  }
}

function handleSheetSelect(e) {
  displaySong(JSON.parse(e.target.value));
}

function handleNotationChange() {
  const sheets = document.getElementById('sheets');
  if (sheets.selectedIndex >= 0) {
    displaySong(JSON.parse(sheets.options[sheets.selectedIndex].value));
  }
}

function displaySong(song) {
  const title = `${song.title.replace(/[/\\?%*:|"'<>]/g, '-')}.musicxml`;
  musicXml = song.musicXml || ireal2musicxml.MusicXML.convert(song, {
    notation: document.querySelector('input[name="notation"]:checked').value
  });
  const a = document.createElement('a');
  a.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(musicXml));
  a.setAttribute('download', title);
  a.innerText = title;
  const download = document.getElementById('download');
  download.innerHTML = '';
  download.appendChild(a);
  displaySheet(musicXml);
}

function handleRendererChange() {
  if (musicXml) {
    displaySheet(musicXml);
  }
}

function populateSheets(playlist) {
  const sheets = document.getElementById('sheets');
  sheets.innerHTML = '';
  playlist.songs.forEach(song => {
    const option = document.createElement('option');
    option.value = JSON.stringify(song);
    option.text = song.title;
    sheets.add(option);
  });
  sheets.dispatchEvent(new Event('change'));
}

function resetSheet() {
  document.getElementById('sheet').remove();
  sheet = document.createElement('div');
  sheet.id = 'sheet';
  document.getElementById('sheet-container').appendChild(sheet);
}

function displaySheet(musicXml) {
  resetSheet();

  const renderer = document.querySelector('input[name="renderer"]:checked').value;
  if (renderer === 'osmd') {
    const rules = new osmd.EngravingRules();
    rules.UseDefaultVoiceInteractionListener = false;
    rules.UseJustifiedBuilder = false;
    rules.resetChordAccidentalTexts(rules.ChordAccidentalTexts, true);
    openSheetMusicDisplay = new osmd.OpenSheetMusicDisplay('sheet', {
      // set options here
      backend: 'svg',
      drawFromMeasureNumber: 1,
      drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER, // draw all measures, up to the end of the sample
      newSystemFromXML: true,
      newPageFromXML: true,
      followCursor: true,
    }, rules);
    openSheetMusicDisplay
    .load(musicXml)
    .then(() => {
      loadMidi(musicXml);
    });
  }
  else if (renderer === 'vrv') {
    const app = new Verovio.App(document.getElementById('sheet'), {
      defaultView: 'document', // default is 'responsive', alternative is 'document'
      defaultZoom: 3, // 0-7, default is 4
      enableResponsive: true, // default is true
      enableDocument: true // default is true
    });
    app.loadData(musicXml);
  }
  else if (renderer === 'abc') {
    const xmldata = $.parseXML(musicXml);
    const result = xml2abc.vertaal(xmldata, {
      u:0, b:0, n:0,  // unfold repeats (1), bars per line, chars per line
      c:0, v:0, d:0,  // credit text filter level (0-6), no volta on higher voice numbers (1), denominator unit length (L:)
      m:0, x:0, t:0,  // no midi, minimal midi, all midi output (0,1,2), no line breaks (1), perc, tab staff -> voicemap (1)
      v1:0, noped:0,  // all directions to first voice of staff (1), no pedal directions (1)
      stm:0,          // translate stem elements (stem direction)
      p:'f', s:0      // page format: scale (1.0), width, left- and right margin in cm, shift note heads in tablature (1)
    });
    if (result[1]) console.info(`[xml2abc] ${result[1]}`);

    // xml2abc fixes
    const abc = result[0]
      .replace('nm="Lead sheet"', 'style=rhythm');

    abcjs.renderAbc('sheet', abc);
  }
}

function handleJazz1350() {
  const playlist = new ireal2musicxml.Playlist(jazz1350);
  populateSheets(playlist);
}

function handlePlayPauseKey(e) {
  if (e.key === ' ') {
    // TODO Handle spacebar to play/pause.
  }
}

async function loadMidi(musicXml) {
  const formData = new FormData();
  formData.append('musicxml', new Blob([musicXml], { type: 'text/xml' }));
  try {
    const response = await fetch('/convert', { method: 'POST', body: formData });
    if (!response.ok) throw new Error(response.statusText);
    const buffer = await response.arrayBuffer();
    midi.json = await midiParser.parseArrayBuffer(buffer);
  }
  catch (e) {
    console.error(e);
  }
}

class OpenSheetMusicDisplayPlayback {
  constructor(openSheetMusicDisplay) {
    this.openSheetMusicDisplay = openSheetMusicDisplay;
    this.currentMeasureIndex = 1;
    this.currentVoiceEntryIndex = 0;
    this.openSheetMusicDisplay.cursor.show();
  }


  // Staff entry timestamp to actual time relative to measure start.
  static timestampToMillisecs(measure, timestamp) {
    return timestamp.realValue * 4 * 60 * 1000 / measure.tempoInBPM;
  }

  updateCursor(measureIndex, voiceEntryIndex) {
    const measure = this.openSheetMusicDisplay.sheet.sourceMeasures[measureIndex];
    this.currentMeasureIndex = measureIndex;
    this.currentVoiceEntryIndex = voiceEntryIndex;
    this.openSheetMusicDisplay.cursor.iterator.currentMeasureIndex = this.currentMeasureIndex;
    this.openSheetMusicDisplay.cursor.iterator.currentMeasure = measure;
    this.openSheetMusicDisplay.cursor.iterator.currentVoiceEntryIndex = this.currentVoiceEntryIndex - 1;
    this.openSheetMusicDisplay.cursor.next();
  }

  moveToMeasureTime(measureIndex, millisecs) {
    const measure = this.openSheetMusicDisplay.sheet.sourceMeasures[measureIndex];

    // If we're moving to a new measure, then start at the first staff entry without search.
    if (this.currentMeasureIndex !== measureIndex) {
      this.updateCursor(measureIndex, 0);
      return;
    }

    // Same measure, new time.
    for (let v = measure.verticalSourceStaffEntryContainers.length - 1; v >= 0; v--) {
      const vsse = measure.verticalSourceStaffEntryContainers[v];
      if (OpenSheetMusicDisplayPlayback.timestampToMillisecs(measure, vsse.timestamp) <= millisecs + Number.EPSILON) {
        // If same staff entry, do nothing.
        if (this.currentVoiceEntryIndex !== v) {
          this.updateCursor(measureIndex, v);
        }
        return;
      }
    }
    console.error(`Could not find suitable staff entry at time ${millisecs} for measure ${measure.measureNumber}`);
  }

  moveToTop() {
    this.openSheetMusicDisplay.cursor.reset();
  }
}

async function playMidi() {
  const midiFileSlicer = new midiSlicer.MidiFileSlicer({ json: midi.json });
  const output = Array.from(midi.access.outputs).filter(o => o[1].id === document.getElementById('outputs').value)[0][1];
  midi.player = midiPlayer.create({ json: midi.json, midiOutput: output });

  const offset = performance.now();
  let lastTime = offset;
  let measureStartTime = offset;
  let currentMeasure = 1;
  midi.score = new OpenSheetMusicDisplayPlayback(openSheetMusicDisplay);

  const displayEvents = (now) => {
    midiFileSlicer.slice(lastTime - offset, now - offset).forEach(event => {
      if (event.event.marker) {
        currentMeasure = parseInt(event.event.marker.split(':')[1]) - 1;
        measureStartTime = now;
      }
    });
    midi.score.moveToMeasureTime(currentMeasure, Math.max(0, now - measureStartTime));

    // Next round.
    if (midi.player.playing) {
      lastTime = now;
      requestAnimationFrame(displayEvents);
    }
  };
  requestAnimationFrame(displayEvents);
  await midi.player.play();
}

async function pauseMidi() {
  if (midi.player) {
    midi.player.pause();
  }
}

async function rewindMidi() {
  if (midi.player) {
    midi.player.stop();
  }
  if (midi.score) {
    midi.score.moveToTop();
  }
}

async function handleMidiOutputSelect(e) {}
async function handleMidiRewind(e) { rewindMidi(); }
async function handleMidiPlay(e) { playMidi(); }
async function handleMidiPause(e) { pauseMidi(); }

function populateMidiOutputs(midiAccess) {
  const outputs = document.getElementById('outputs');
  const current = outputs.value;
  outputs.innerHTML = '';
  midiAccess.outputs.forEach(output => {
    const option = document.createElement('option');
    option.value = output.id;
    option.text = output.name;
    if (option.value === current) option.selected = true;
    outputs.add(option);
  });
}

window.addEventListener('load', function () {
  document.getElementById('playlist').addEventListener('change', handleFileSelect, false);
  document.getElementById('ireal').addEventListener('change', handleIRealChange, false);
  document.getElementById('sheets').addEventListener('change', handleSheetSelect, false);
  document.querySelectorAll('input[name="renderer"]').forEach(input => {
    input.addEventListener('change', handleRendererChange);
  });
  document.querySelectorAll('input[name="notation"]').forEach(input => {
    input.addEventListener('change', handleNotationChange);
  });
  document.getElementById('jazz1350').addEventListener('click', handleJazz1350, false);
  document.addEventListener('keyup', handlePlayPauseKey);

  document.getElementById('vrv-version').innerText = '(WASM) 3.9.0-dev';
  document.getElementById('abc-version').innerText = abcjs.signature;
  document.getElementById('osmd-version').innerText = new osmd.OpenSheetMusicDisplay('sheet').Version;

  navigator.requestMIDIAccess().then(midiAccess => {
    populateMidiOutputs(midiAccess);
    midiAccess.onstatechange = () => {
      populateMidiOutputs(midiAccess);
    }
    document.getElementById('outputs').addEventListener('change', handleMidiOutputSelect, false);
    document.getElementById('rewind').addEventListener('click', handleMidiRewind, false);
    document.getElementById('play').addEventListener('click', handleMidiPlay, false);
    document.getElementById('pause').addEventListener('click', handleMidiPause, false);
    midi.access = midiAccess;
  }, error => { console.error(error); });
})
