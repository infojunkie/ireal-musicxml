const opensheetmusicdisplay = require("opensheetmusicdisplay");
const abcjs = require("abcjs");
const xml2abc = require("xml2abc");
const ireal2musicxml = require("../../lib/ireal-musicxml");

function handleIRealChange(e) {
  const playlist = new ireal2musicxml.Playlist(e.target.value);
  populateSheets(playlist);
}

function handleFileSelect(e) {
  var reader = new FileReader();
  reader.onload = function(ee) {
    // If we've uploaded an XML file, assume it's MusicXML...
    try {
      const doc = new DOMParser().parseFromString(ee.target.result, 'text/xml');
      if (doc && !doc.getElementsByTagName('parsererror').length) {
        // Hand-make a fake playlist.
        const playlist = {
          name: 'Uploaded MusicXML',
          songs: [{
            title: doc.getElementsByTagName('movement-title')[0].textContent || 'Unknown Title',
            composer: null,
            style: null,
            groove: null,
            key: null,
            transpose: null,
            bpm: null,
            repeats: null,
            music: null,
            cells: null,
            musicXml: ee.target.result
          }]
        };
        populateSheets(playlist);
        return;
      }
    }
    catch (ex) {
      // Assume it's an iReal Pro sheet.
    }

    const playlist = new ireal2musicxml.Playlist(ee.target.result);
    populateSheets(playlist);
  };
  reader.readAsText(e.target.files[0]);
}

let musicXml = '';

function handleSheetSelect(e) {
  const song = JSON.parse(e.target.value);
  const title = `${song.title.replace(/[/\\?%*:|"<>]/g, '-')}.musicxml`;
  musicXml = song.musicXml ? song.musicXml : ireal2musicxml.MusicXML.convert(song);
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
      .then(
        function() {
          window.osmd = openSheetMusicDisplay; // give access to osmd object in Browser console, e.g. for osmd.setOptions()
          openSheetMusicDisplay.render();
        }
      );
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

window.addEventListener('load', function () {
  document.getElementById("playlist").addEventListener("change", handleFileSelect, false);
  document.getElementById("ireal").addEventListener("change", handleIRealChange, false);
  document.getElementById("sheets").addEventListener("change", handleSheetSelect, false);
  document.querySelectorAll("input[name='renderer']").forEach((input) => {
    input.addEventListener('change', handleRendererChange);
  });
})
