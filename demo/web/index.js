const osmd = require('opensheetmusicdisplay');
//const verovio = require('verovio');
//const abcjs = require('abcjs');
//const xml2abc = require('xml2abc');
const unzip = require('unzipit');
const parserError = require('sane-domparser-error');
const ireal2musicxml = require('../../lib/ireal-musicxml');
const { parseArrayBuffer: parseMidiBuffer } = require('midi-json-parser');
const { create: createMidiPlayer } = require('midi-player');
const { MidiFileSlicer } = require('midi-file-slicer');
const WebAudioFontPlayer = require('webaudiofont');
const { AudioContext } = require('standardized-audio-context');
const workerTimers = require('worker-timers');

const PLAYER_STOPPED = 0;
const PLAYER_PLAYING = 1;
const PLAYER_PAUSED = 2;

const MIDI_DRUMS = 9;

// Current state.
let musicXml = null;
let renderer = null;
let midi = {
  access: null,
  json: null,
  player: null,
  score: null,
  grooves: null,
  startTime: null,
  pauseTime: null,
  currentMeasureIndex: null,
  currentMeasureStartTime: null,
  mapMeasureToTimestamp: null,
  firstMeasureNumber: null,
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
  if (file.size < 1*1024*1024) {
    reader.readAsArrayBuffer(file);
  }
  else {
    document.getElementById('file-error').textContent = 'This file is too large.';
  }
}

async function handleSampleSelect(e) {
  if (!e.target.value) return;
  try {
    const response = await fetch(e.target.value);
    if (!response.ok) throw new Error(response.statusText);
    const text = await response.text();
    if (tryMusicXML(text)) return;
    if (tryiRealPro(text)) return;
    document.getElementById('file-error').textContent = 'This file is not recognized as either iReal Pro or MusicXML.';
  }
  catch (ex) {
    console.error(ex.toString());
    document.getElementById('file-error').textContent = 'Failed to load the selected file.';
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
  const title = `${song.title.replace(/[/\\?%*:|"'<>\s]/g, '-')}.musicxml`;
  musicXml = song.musicXml || ireal2musicxml.MusicXML.convert(song, {
    notation: 'rhythmic' //document.querySelector('input[name="notation"]:checked').value
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
  const sheet = document.createElement('div');
  sheet.id = 'sheet';
  document.getElementById('sheet-container').appendChild(sheet);

  // Delete previous objects.
  delete midi.score; midi.score = null;
  delete renderer; renderer = null;
  if (midi.player) midi.player.stop();
}

function displaySheet(musicXml) {
  resetSheet();

  const r = document.querySelector('input[name="renderer"]:checked').value;
  if (r === 'osmd') {
    renderer = new osmd.OpenSheetMusicDisplay('sheet', {
      // set options here
      backend: 'svg',
      drawFromMeasureNumber: 1,
      drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER, // draw all measures, up to the end of the sample
      newSystemFromXML: true,
      newPageFromXML: true,
      followCursor: true,
    });
    renderer.rules.resetChordAccidentalTexts(renderer.rules.ChordAccidentalTexts, true);
    renderer.rules.resetChordSymbolLabelTexts(renderer.rules.ChordSymbolLabelTexts);
    renderer
    .load(musicXml)
    .then(() => loadMidi())
    .then(() => { midi.score = new OpenSheetMusicDisplayPlayback(renderer); });
  }
  else if (r === 'vrv') {
    renderer = new verovio.toolkit();
    const svg = renderer.renderData(musicXml, {
      breaks: 'encoded',
      adjustPageHeight: true,
      scale: 50
    });
    document.getElementById('sheet').innerHTML = svg;
    loadMidi()
    .then(() => { midi.score = new VerovioPlayback(renderer); });
  }
/*
  else if (r === 'abc') {
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
*/
}

function handlePlayPauseKey(e) {
  if (e.key === ' ' && midi.player) {
    e.preventDefault();
    if (midi.player.state === PLAYER_PLAYING) {
      pauseMidi();
    }
    else {
      playMidi();
    }
  }
}

class SoundFontOutput {
  constructor(json) {
    this.audioContext = new AudioContext();
    this.player = new WebAudioFontPlayer();
    this.notes = [];
    this.channels = json.tracks.reduce((channels, track) => {
      const pc = track.find(e => 'programChange' in e);
      if (pc) {
        if (pc.channel !== MIDI_DRUMS) {
          const instrumentNumber = this.player.loader.findInstrument(pc.programChange.programNumber);
          const instrumentInfo = this.player.loader.instrumentInfo(instrumentNumber);
          channels[pc.channel] = { instrumentInfo };
          this.player.loader.startLoad(this.audioContext, instrumentInfo.url, instrumentInfo.variable);
        }
        else {
          channels[MIDI_DRUMS] = { beats: {} };
          [...new Set(track.filter(e => 'noteOn' in e).map(e => e.noteOn.noteNumber))].forEach(beat => {
            const drumNumber = this.player.loader.findDrum(beat);
            const drumInfo = this.player.loader.drumInfo(drumNumber);
            channels[MIDI_DRUMS].beats[beat] = { drumInfo };
            this.player.loader.startLoad(this.audioContext, drumInfo.url, drumInfo.variable);
          });
        }
      }
      return channels;
    }, {});

    // Perform our own note scheduling.
    const scheduleNotes = () => {
      const now = performance.now();
      // Module `webaudiofont` seems to drop notes randomly when they become too crowded.
      // The commented code below was an experiment to rely on our own scheduling to instruct `webaudiofont` to play
      // the notes immediately, instead of queueing them on the module's side. This experiment worked better in some cases,
      // but failed miserably in others because more notes were dropped when scheduled immediately as per the commented code below.
      // The currently used method is to queue the notes in `webaudiofont` when they are received in the method `noteOn()`.
      //
      // this.notes.filter(note => note.envelope === null && note.on <= now).forEach(note => {
      //   const instrument = note.channel === MIDI_DRUMS ?
      //     this.channels[note.channel].beats[note.pitch].drumInfo.variable :
      //     this.channels[note.channel].instrumentInfo.variable;
      //   note.envelope = this.player.queueWaveTable(this.audioContext, this.audioContext.destination, window[instrument], 0, note.pitch, 100000, note.velocity / 127);
      // })
      this.notes.filter(note => note.off !== null && note.off <= now).forEach(note => note.envelope.cancel());
      this.notes = this.notes.filter(note => note.off === null || note.off > now);
      workerTimers.setTimeout(scheduleNotes, 25);
    }
    workerTimers.setTimeout(scheduleNotes, 25);
  }

  send(data, timestamp) {
    const channel = data[0] & 0xf;
    const type = data[0] >> 4;
    const pitch = data[1];
    const velocity = data[2];
    switch (type) {
    case 9:
      if (velocity > 0) {
        this.noteOn(channel, pitch, timestamp, velocity);
      }
      else {
        this.noteOff(channel, pitch, timestamp);
      }
      break;
    case 8:
      this.noteOff(channel, pitch, timestamp);
      break;
    }
    if (data.length > 3) {
      this.send(data.slice(3), timestamp);
    }
  }

  noteOn(channel, pitch, timestamp, velocity) {
    // Refer to the discussion in `scheduleNotes()` about queuing the notes in `webaudiofont`,
    // as opposed to scheduling them ourselves. For now, we're doing the former which drop some notes, but overall works better.
    //
    // this.notes.push({ channel, pitch, velocity, on: timestamp, envelope: null, off: null });
    const instrument = channel === MIDI_DRUMS ?
      this.channels[channel].beats[pitch].drumInfo.variable :
      this.channels[channel].instrumentInfo.variable;
    const when = this.audioContext.currentTime + (timestamp - performance.now()) / 1000;
    this.notes.push({
      channel, pitch, velocity, on: timestamp, off: null,
      envelope: this.player.queueWaveTable(this.audioContext, this.audioContext.destination, window[instrument], when, pitch, 100000, velocity / 127)
    });
  }

  noteOff(channel, pitch, timestamp) {
    const note = this.notes.find(note => note.pitch === pitch && note.channel === channel && note.off === null);
    if (note) {
      note.off = timestamp;
    }
  }

  clear() {
    this.player.cancelQueue(this.audioContext);
    this.notes = [];
  }
}

class OpenSheetMusicDisplayPlayback {
  constructor(osmd) {
    this.osmd = osmd;
    this.currentMeasureIndex = 0;
    this.currentVoiceEntryIndex = 0;
    this.osmd.cursor.show();

    // Setup event listeners for target stave notes to position the cursor.
    this.osmd.graphic.measureList.forEach(measureGroup => {
      measureGroup.forEach(measure => {
        measure.staffEntries.forEach((se, v) => {
          se.graphicalVoiceEntries.forEach(gve => {
            gve.mVexFlowStaveNote.attrs.el.addEventListener('click', event => {
              this.updateCursor(measure.measureNumber - midi.firstMeasureNumber, v);
              seekMidi(measure.measureNumber - midi.firstMeasureNumber, OpenSheetMusicDisplayPlayback.timestampToMillisecs(measure.parentSourceMeasure, se.relInMeasureTimestamp));
            });
          });
        });
      });
    });
  }

  // Staff entry timestamp to actual time relative to measure start.
  static timestampToMillisecs(measure, timestamp) {
    return timestamp.realValue * 4 * 60 * 1000 / measure.tempoInBPM;
  }

  updateCursor(measureIndex, voiceEntryIndex) {
    const measure = this.osmd.sheet.sourceMeasures[measureIndex];
    this.currentMeasureIndex = measureIndex;
    this.currentVoiceEntryIndex = voiceEntryIndex;

    if (measureIndex === 0 && voiceEntryIndex === 0) {
      this.osmd.cursor.reset();
    }
    else {
      this.osmd.cursor.iterator.currentMeasureIndex = this.currentMeasureIndex;
      this.osmd.cursor.iterator.currentMeasure = measure;
      this.osmd.cursor.iterator.currentVoiceEntryIndex = this.currentVoiceEntryIndex - 1;
      this.osmd.cursor.next();
    }
  }

  moveToMeasureTime(measureIndex, measureMillisecs) {
    const measure = this.osmd.sheet.sourceMeasures[measureIndex];

    // If we're moving to a new measure, then start at the first staff entry without search.
    if (this.currentMeasureIndex !== measureIndex) {
      this.updateCursor(measureIndex, 0);
      return;
    }

    // Same measure, new time.
    for (let v = measure.verticalSourceStaffEntryContainers.length - 1; v >= 0; v--) {
      const vsse = measure.verticalSourceStaffEntryContainers[v];
      if (OpenSheetMusicDisplayPlayback.timestampToMillisecs(measure, vsse.timestamp) <= measureMillisecs + Number.EPSILON) {
        // If same staff entry, do nothing.
        if (this.currentVoiceEntryIndex !== v) {
          this.updateCursor(measureIndex, v);
        }
        return;
      }
    }
    console.error(`Could not find suitable staff entry at time ${measureMillisecs} for measure ${measure.measureNumber}`);
  }
}

class VerovioPlayback {
  constructor(vrv) {
    this.vrv = vrv;
    this.ids = [];
    this.measures = [];

    // Build measure timemap and setup event listeners on notes.
    this.vrv.renderToTimemap({ includeMeasures: true, includeRests: true }).forEach(event => {
      if ('measureOn' in event) {
        this.measures.push({
          timestamp: event.tstamp
        });
      }
      const measureIndex = this.measures.length - 1;
      Array(...(event.on || []), ...(event.restsOn || [])).forEach(noteid => {
        document.getElementById(noteid).addEventListener('click', _ => {
          const measureMillisecs = event.tstamp - this.measures[measureIndex].timestamp;
          this.moveToMeasureTime(measureIndex, measureMillisecs + 1);
          seekMidi(measureIndex, measureMillisecs);
        });
      });
    });

    this.moveToMeasureTime(0, 0);
  }

  moveToMeasureTime(measureIndex, measureMillisecs) {
    const timestamp = Math.max(0,
      Math.min(
        measureIndex < this.measures.length - 1 ? this.measures[measureIndex + 1].timestamp : this.measures[measureIndex].timestamp + measureMillisecs,
        this.measures[measureIndex].timestamp + measureMillisecs)
    );
    const elements = this.vrv.getElementsAtTime(timestamp);
    if ((elements.notes.length > 0) && (this.ids != elements.notes)) {
      this.ids.forEach(noteid => {
        if (!elements.notes.includes(noteid)) {
          const note = document.getElementById(noteid);
          note.setAttribute('fill', '#000');
          note.setAttribute('stroke', '#000');
        }
      });
      this.ids = elements.notes;
      this.ids.forEach(noteid => {
        const note = document.getElementById(noteid);
        note.setAttribute('fill', '#c00');
        note.setAttribute('stroke', '#c00');
      });
    }
  }
}

// Create a map of timestamp => measure number to help with cursor positioning
function parseMeasures() {
  let microsecondsPerQuarter = 500000;
  let offset = 0;

  midi.mapMeasureToTimestamp = new Map();

  // First measure can be 0 in case of pickup measure.
  midi.firstMeasureNumber = null;

  midi.json.tracks[0].forEach(event => {
    if ('setTempo' in event) {
      microsecondsPerQuarter = event.setTempo.microsecondsPerQuarter;
    }
    offset += event.delta;
    if ('marker' in event) {
      const marker = event.marker.split(':');
      if (marker[0] === 'Measure') {
        if (midi.firstMeasureNumber === null) {
          midi.firstMeasureNumber = Number(marker[1]);
        }
        const measureNumber = Number(marker[1]) - midi.firstMeasureNumber;
        const timestamp = offset * (microsecondsPerQuarter / midi.json.division / 1000);
        const timestamps = midi.mapMeasureToTimestamp.get(measureNumber) || [];
        midi.mapMeasureToTimestamp.set(measureNumber, timestamps.concat(timestamp));
      }
    }
  });
}

async function loadMidi(groove = null) {
  const formData = new FormData();
  formData.append('musicXml', new Blob([musicXml], { type: 'text/xml' }));
  if (groove && groove.toLowerCase() !== 'default') formData.append('globalGroove', groove);
  try {
    const response = await fetch('mma/convert', { method: 'POST', body: formData });
    if (!response.ok) throw new Error(response.statusText);
    const buffer = await response.arrayBuffer();
    midi.json = await parseMidiBuffer(buffer);

    parseMeasures();

    if (midi.player) midi.player.stop();
    midi.player = createMidiPlayer({ json: midi.json, midiOutput: midiOutput() });

    document.getElementById('file-error').textContent = '';
    document.getElementById('player').style.visibility = 'visible';
    document.getElementById('outputs').disabled = false;
    if (!groove) document.getElementById('grooves').value = '';
    document.getElementById('grooves').disabled = false;
    document.getElementById('grooves-list').disabled = false;
  }
  catch (ex) {
    document.getElementById('file-error').textContent = 'Could not convert the file to MIDI.';
    document.getElementById('player').style.visibility = 'hidden';
    document.getElementById('outputs').disabled = true;
    document.getElementById('grooves').value = '';
    document.getElementById('grooves').disabled = true;
    document.getElementById('grooves-list').disabled = true;
    console.error(ex);
  }
}

function seekMidi(measureIndex, measureMillisecs) {
  const timestamp = midi.mapMeasureToTimestamp.get(measureIndex)[0] + measureMillisecs;
  midi.player.seek(timestamp);
  midi.currentMeasureIndex = measureIndex;
  const now = performance.now();
  midi.currentMeasureStartTime = now - measureMillisecs;
  midi.startTime = now - timestamp;
  midi.pauseTime = now;
}

async function playMidi() {
  const now = performance.now();
  if (midi.player.state === PLAYER_PAUSED || midi.startTime !== null) {
    midi.startTime += now - midi.pauseTime;
    midi.currentMeasureStartTime += now - midi.pauseTime;
  }
  else {
    midi.startTime = now;
    midi.currentMeasureIndex = 0;
    midi.currentMeasureStartTime = now;
  }

  const midiFileSlicer = new MidiFileSlicer({ json: midi.json });

  let lastTime = now;
  const displayEvents = (now) => {
    if (midi.player.state !== PLAYER_PLAYING) return;

    midiFileSlicer.slice(lastTime - midi.startTime, now - midi.startTime).forEach(event => {
      if (event.event.marker) {
        const marker = event.event.marker.split(':');
        if (marker[0] === 'Measure') {
          midi.currentMeasureIndex = parseInt(marker[1]) - midi.firstMeasureNumber;
          midi.currentMeasureStartTime = now;
        }
        else if (marker[0] === 'Groove') {
          document.getElementById('grooves').value = marker[1];
          document.getElementById('grooves-list').value = marker[1];
        }
      }
    });
    midi.score.moveToMeasureTime(midi.currentMeasureIndex, Math.max(0, now - midi.currentMeasureStartTime));

    // Schedule next cursor movement.
    lastTime = now;
    requestAnimationFrame(displayEvents);
  };
  requestAnimationFrame(displayEvents);

  if (midi.player.state === PLAYER_PAUSED) {
    await midi.player.resume();
  }
  else {
    await midi.player.play();
  }

  // Reset.
  if (midi.player.state !== PLAYER_PAUSED) {
    midi.startTime = null;
  }
}

async function pauseMidi() {
  if (midi.player) {
    midi.player.pause();
  }
  midi.pauseTime = performance.now();
}

async function rewindMidi() {
  if (midi.player) {
    midi.player.stop();
  }
  if (midi.score) {
    midi.score.moveToMeasureTime(0, 0);
  }
  midi.startTime = null;
}

async function handleMidiOutputSelect(e) { loadMidi().then(() => rewindMidi()); }
async function handleMidiRewind(e) { rewindMidi(); }
async function handleMidiPlay(e) { playMidi(); }
async function handleMidiPause(e) { pauseMidi(); }

function midiOutput() {
  const outputs = document.getElementById('outputs');
  if (outputs.value === 'local') {
    return new SoundFontOutput(midi.json);
  }
  return Array.from(midi.access.outputs.values()).find(output => output.id === outputs.value);
}

function populateMidiOutputs(midiAccess) {
  const outputs = document.getElementById('outputs');
  const current = outputs.value;
  outputs.innerHTML = '';
  [{ id: 'local', name: '(local synth)' }].concat(...(midiAccess ? midiAccess.outputs.values() : [])).forEach(output => {
    const option = document.createElement('option');
    option.value = output.id;
    option.text = output.name;
    if (option.value === current) option.selected = true;
    outputs.add(option);
  });
}

function handleGrooveSelect(e) {
  if (midi.grooves.find(g => g === e.target.value)) {
    loadMidi(e.target.value).then(() => rewindMidi());
  }
}

async function populateGrooves() {
  const grooves = document.getElementById('grooves');
  const groovesList = document.getElementById('grooves-list');
  midi.grooves = [];
  try {
    const response = await fetch('mma/grooves');
    if (!response.ok) throw new Error(response.statusText);
    const lines = await response.text();
    ['Default', 'No groove override, just whatever is specified in the score.', 'None', 'No groove, just the chords.'].concat(lines.split('\n')).forEach((line, index, lines) => {
      if (index % 2 === 1) {
        const option = document.createElement('option');
        option.value = lines[index-1].trim();
        option.text = line.trim();
        groovesList.appendChild(option);
        midi.grooves.push(option.value);
      }
    });
    grooves.addEventListener('change', handleGrooveSelect);
  }
  catch (ex) {
    console.error(ex);
  }
}

window.addEventListener('load', async () => {
  document.getElementById('playlist').addEventListener('change', handleFileSelect, false);
  document.getElementById('ireal').addEventListener('change', handleIRealChange, false);
  document.getElementById('sheets').addEventListener('change', handleSheetSelect, false);
  document.querySelectorAll('input[name="renderer"]').forEach(input => {
    input.addEventListener('change', handleRendererChange);
  });
  // document.querySelectorAll('input[name="notation"]').forEach(input => {
  //   input.addEventListener('change', handleNotationChange);
  // });
  document.getElementById('samples').addEventListener('change', handleSampleSelect, false);
  window.addEventListener('keydown', handlePlayPauseKey);

//  verovio.module.onRuntimeInitialized = async _ => {
    document.getElementById('vrv-version').innerText = new verovio.toolkit().getVersion();
//  }
//  document.getElementById('abc-version').innerText = abcjs.signature;
  document.getElementById('osmd-version').innerText = new osmd.OpenSheetMusicDisplay('sheet').Version;

  populateMidiOutputs(null);
  document.getElementById('outputs').addEventListener('change', handleMidiOutputSelect, false);
  document.getElementById('rewind').addEventListener('click', handleMidiRewind, false);
  document.getElementById('play').addEventListener('click', handleMidiPlay, false);
  document.getElementById('pause').addEventListener('click', handleMidiPause, false);

  populateGrooves();

  if (navigator.requestMIDIAccess) navigator.requestMIDIAccess().then(midiAccess => {
    document.getElementById('firefox-midi').classList.add('hide');
    populateMidiOutputs(midiAccess);
    midiAccess.onstatechange = () => populateMidiOutputs(midiAccess);
    midi.access = midiAccess;
  }, error => {
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    if (isFirefox) {
      document.getElementById('firefox-midi').classList.remove('hide');
    }
    console.error(error);
  });
})
