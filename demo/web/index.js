const opensheetmusicdisplay = require("opensheetmusicdisplay");
const abcjs = require("abcjs");
const xml2abc = require("xml2abc");
const unzip = require("unzipit");
const ireal2musicxml = require("../../lib/ireal-musicxml");
const jazz1350 = require("../../test/data/jazz1350.txt");

function handleIRealChange(e) {
  const playlist = new ireal2musicxml.Playlist(e.target.value);
  populateSheets(playlist);
}

function tryMusicXML(xml) {
  try {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    if (doc && !doc.getElementsByTagName('parsererror').length) {
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
  }
  catch (ex) {
    console.warn(ex);
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
    console.warn(ex);
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
    console.warn(ex);
    return false;
  }
}

function handleFileSelect(e) {
  document.getElementById('file-error').textContent = '';
  var reader = new FileReader();
  reader.onloadend = async function(ee) {
    const file = e.target.files[0];
    const decoder = new TextDecoder();
    const text = decoder.decode(ee.target.result);
    if (file.type === 'text/xml' && tryMusicXML(text)) return;
    if (file.type.includes('musicxml') && (tryMusicXML(text) || await tryCompressedMusicXML(ee.target.result))) return;
    if (tryiRealPro(text)) return;
    document.getElementById('file-error').textContent = 'This file was not recognized as either iRealPro or MusicXML.';
  };
  reader.readAsArrayBuffer(e.target.files[0]);
}

let musicXml = '';

function handleSheetSelect(e) {
  displaySong(JSON.parse(e.target.value));
}

function handleNotationChange() {
  const sheets = document.getElementById('sheets');
  displaySong(JSON.parse(sheets.options[sheets.selectedIndex].value));
}

function displaySong(song) {
  const title = `${song.title.replace(/[/\\?%*:|"<>]/g, '-')}.musicxml`;
  musicXml = song.musicXml || ireal2musicxml.MusicXML.convert(song, {
    notation: document.querySelector('input[name="notation"]:checked').value
  });
  const a = document.createElement('a');
  a.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(musicXml));
  a.setAttribute('download', title);
  a.innerText = title;
  const download = document.getElementById('download');
  download.innerHTML = "";
  download.appendChild(a);
  displaySheet(musicXml);
}

function handleRendererChange() {
  displaySheet(musicXml);
}

function populateSheets(playlist) {
  const sheets = document.getElementById("sheets");
  sheets.innerHTML = "";
  playlist.songs.forEach(song => {
    const option = document.createElement("option");
    option.value = JSON.stringify(song);
    option.text = song.title;
    sheets.add(option);
  });
  sheets.dispatchEvent(new Event('change'));
}

function displaySheet(musicXml) {
  // Reset sheet height.
  document.getElementById('sheet').style.cssText = "height: 100vh";

  const renderer = document.querySelector('input[name="renderer"]:checked').value;
  if (renderer === 'osmd') {
    var openSheetMusicDisplay = new opensheetmusicdisplay.OpenSheetMusicDisplay("sheet", {
      // set options here
      backend: "svg",
      drawFromMeasureNumber: 1,
      drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER, // draw all measures, up to the end of the sample
      newSystemFromXML: true,
      newPageFromXML: true
    });
    openSheetMusicDisplay
      .load(musicXml)
      .then(() => {
        openSheetMusicDisplay.render();
      });
  }
  else if (renderer === 'vrv') {
    const app = new Verovio.App(document.getElementById("sheet"), {
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

    abcjs.renderAbc("sheet", abc);
  }
}

function handleJazz1350() {
  const playlist = new ireal2musicxml.Playlist(jazz1350);
  populateSheets(playlist);
}

window.addEventListener('load', function () {
  document.getElementById("playlist").addEventListener("change", handleFileSelect, false);
  document.getElementById("ireal").addEventListener("change", handleIRealChange, false);
  document.getElementById("sheets").addEventListener("change", handleSheetSelect, false);
  document.querySelectorAll("input[name='renderer']").forEach((input) => {
    input.addEventListener('change', handleRendererChange);
  });
  document.querySelectorAll("input[name='notation']").forEach((input) => {
    input.addEventListener('change', handleNotationChange);
  });
  document.getElementById("jazz1350").addEventListener("click", handleJazz1350, false);

  document.getElementById("vrv-version").innerText = '(WASM) 3.8.0-dev-dac75b7'; // https://github.com/rism-digital/verovio/issues/2514
  document.getElementById("abc-version").innerText = abcjs.signature;
  document.getElementById("osmd-version").innerText = new opensheetmusicdisplay.OpenSheetMusicDisplay("sheet").Version;
})
