const osmd = require('opensheetmusicdisplay');
const abcjs = require('abcjs');
const xml2abc = require('xml2abc');
const unzip = require('unzipit');
const parserError = require('sane-domparser-error');
const chordSymbol = require('chord-symbol');
const ireal2musicxml = require('../../lib/ireal-musicxml');
const jazz1350 = require('../../test/data/jazz1350.txt');
const $ = window.$ = require('jquery');

// Current state.
let musicXml = null;
let openSheetMusicDisplay = null;

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
  displaySong(JSON.parse(sheets.options[sheets.selectedIndex].value));
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
  document.getElementById('sheet').innerHTML = '';
  document.getElementById('sheet').style.cssText = 'height: 100vh';
  document.getElementsByClassName('control-panel').forEach(e => e.remove());
  document.getElementsByClassName('playback-buttons').forEach(e => e.remove());

  if (openSheetMusicDisplay) {
    openSheetMusicDisplay.PlaybackManager.pause();
    openSheetMusicDisplay.PlaybackManager.reset();
  }
}

function displaySheet(musicXml) {
  resetSheet();

  const renderer = document.querySelector('input[name="renderer"]:checked').value;
  if (renderer === 'osmd') {
    openSheetMusicDisplay = new osmd.OpenSheetMusicDisplay('sheet', {
      // set options here
      backend: 'svg',
      drawFromMeasureNumber: 1,
      drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER, // draw all measures, up to the end of the sample
      newSystemFromXML: true,
      newPageFromXML: true,
      followCursor: true,
    });
    openSheetMusicDisplay
      .load(musicXml)
      .then(() => {
        convertChords(openSheetMusicDisplay);
        createPlaybackControl(openSheetMusicDisplay);
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

function convertChords(openSheetMusicDisplay) {
  const leadSheet = openSheetMusicDisplay.sheet.instruments.find(i => i.nameLabel.text == 'Lead sheet');
  if (!leadSheet) return;

  // Assume single voice for lead sheet.
  const leadVoice = leadSheet.Voices[0];
  const chordVoice = new osmd.Voice(leadSheet, leadVoice.VoiceId + 1);

  leadVoice.VoiceEntries.forEach(voiceEntry => {
    // Create the chord tones in the second voice.
    const chordEntry = new osmd.VoiceEntry(
      voiceEntry.Timestamp,
      chordVoice,
      voiceEntry.ParentSourceStaffEntry
    );

    const leadNote = voiceEntry.Notes[0];

    const noteMap = {
      'A': osmd.NoteEnum.A,
      'B': osmd.NoteEnum.B,
      'C': osmd.NoteEnum.C,
      'D': osmd.NoteEnum.D,
      'E': osmd.NoteEnum.E,
      'F': osmd.NoteEnum.F,
      'G': osmd.NoteEnum.G,
    }

    voiceEntry.parentSourceStaffEntry.chordSymbolContainers?.forEach(osmdChord => {
      // Get the chord to be played.
      const chordText = osmd.ChordSymbolContainer.calculateChordText(osmdChord);
      const parseChord = chordSymbol.chordParserFactory();
      const chord = parseChord(chordText.replace(/\(alt .*\)/, ''));
      if (!chord.normalized) {
        console.error(`Failed to parse the chord "${chordText}"`);
      }
      chord.normalized?.notes.forEach(note => {
        const chordTone = new osmd.Note(
          chordEntry,
          chordEntry.ParentSourceStaffEntry,
          leadNote.length,
          new osmd.Pitch(
            noteMap[note[0]],
            0,
            note[1] === '#' ? osmd.AccidentalEnum.SHARP : (note[1] === 'b' ? osmd.AccidentalEnum.FLAT : osmd.AccidentalEnum.NONE)
          ),
          leadNote.SourceMeasure,
          false
        );
        chordEntry.addNote(chordTone);
      })
    });
  });

  leadSheet.Voices.push(chordVoice);
  leadVoice.Audible = false;
  chordVoice.Visible = false;

  // Update the data model.
  //openSheetMusicDisplay.updateGraphic();
  openSheetMusicDisplay.sheet.fillStaffList();
  [new osmd.DynamicsCalculator(), new osmd.PlaybackNoteGenerator()].forEach(calc => calc.calculate(openSheetMusicDisplay.sheet));

  // Register the chord player listener.
  openSheetMusicDisplay.renderingManager.addListener(new ChordPlayer(openSheetMusicDisplay));
}

class ChordPlayer {
  constructor(openSheetMusicDisplay) {
    this.openSheetMusicDisplay = openSheetMusicDisplay;
  }

  userDisplayInteraction(relativePosition, positionInSheetUnits, type) {
    switch (type) {
        case 3: // osmd.InteractionType.TouchDown:
        case 0: // osmd.InteractionType.SingleTouch:
        case 1: { // osmd.InteractionType.DoubleTouch: {
          const ve = this.openSheetMusicDisplay.renderingManager.graphicalMusicSheet.GetNearestGraphicalObject(
            positionInSheetUnits,
            osmd.GraphicalVoiceEntry.name
          );
          if (ve) {
            try {
              this.openSheetMusicDisplay.PlaybackManager.playVoiceEntry(ve.sourceStaffEntry.voiceEntries[1]);
            }
            catch (ex) {
              // Do nothing.
            }
          }
        }
        break;
    }
  }
}

function createPlaybackControl(openSheetMusicDisplay) {
  const timingSource = new osmd.LinearTimingSource();
  const playbackManager = new osmd.PlaybackManager(timingSource, undefined, new osmd.BasicAudioPlayer(), undefined);
  playbackManager.DoPlayback = true;
  playbackManager.DoPreCount = false;
  playbackManager.PreCountMeasures = 1;
  const playbackControlPanel = new osmd.ControlPanel();
  playbackControlPanel.addListener(playbackManager);
  timingSource.reset();
  timingSource.pause();
  timingSource.Settings = openSheetMusicDisplay.sheet.playbackSettings;
  playbackManager.initialize(openSheetMusicDisplay.sheet.musicPartManager);
  playbackManager.addListener(openSheetMusicDisplay.cursor);
  playbackManager.reset();
  openSheetMusicDisplay.PlaybackManager = playbackManager;
}

window.addEventListener('load', function () {
  document.getElementById('playlist').addEventListener('change', handleFileSelect, false);
  document.getElementById('ireal').addEventListener('change', handleIRealChange, false);
  document.getElementById('sheets').addEventListener('change', handleSheetSelect, false);
  document.querySelectorAll('input[name="renderer"]').forEach((input) => {
    input.addEventListener('change', handleRendererChange);
  });
  document.querySelectorAll('input[name="notation"]').forEach((input) => {
    input.addEventListener('change', handleNotationChange);
  });
  document.getElementById('jazz1350').addEventListener('click', handleJazz1350, false);

  document.getElementById('vrv-version').innerText = '(WASM) 3.8.0-dev';
  document.getElementById('abc-version').innerText = abcjs.signature;
  document.getElementById('osmd-version').innerText = new osmd.OpenSheetMusicDisplay('sheet').Version;
})
