const opensheetmusicdisplay = require("opensheetmusicdisplay");
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
  else {
    const app = new Verovio.App(document.getElementById("sheet"), {
      defaultView: 'document', // default is 'responsive', alternative is 'document'
      defaultZoom: 3, // 0-7, default is 4
      enableResponsive: true, // default is true
      enableDocument: true // default is true
    });
    app.loadData(musicXml);
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
