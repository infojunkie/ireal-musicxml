const opensheetmusicdisplay = require("opensheetmusicdisplay");
const ireal2musicxml = require("../../lib/ireal-musicxml");

function handleIRealChange(e) {
  const playlist = new ireal2musicxml.Playlist(e.target.value);
  populateSheets(playlist);
}

function handleFileSelect(e) {
  var reader = new FileReader();
  reader.onload = function(ee) {
    const playlist = new ireal2musicxml.Playlist(ee.target.result);
    populateSheets(playlist);
  };
  reader.readAsText(e.target.files[0]);
}

function handleSheetSelect(e) {
  const musicXml = ireal2musicxml.MusicXML.convert(JSON.parse(e.target.value));
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

function displaySheet(musicxml) {
  var openSheetMusicDisplay = new opensheetmusicdisplay.OpenSheetMusicDisplay("osmdCanvas", {
    // set options here
    backend: "svg",
    drawFromMeasureNumber: 1,
    drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER, // draw all measures, up to the end of the sample
    newSystemFromXML: true,
    newPageFromXML: true
  });
  openSheetMusicDisplay
    .load(musicxml)
    .then(
      function() {
        window.osmd = openSheetMusicDisplay; // give access to osmd object in Browser console, e.g. for osmd.setOptions()
        openSheetMusicDisplay.render();
      }
    );
}

window.addEventListener('load', function () {
  document.getElementById("playlist").addEventListener("change", handleFileSelect, false);
  document.getElementById("ireal").addEventListener("change", handleIRealChange, false);
  document.getElementById("sheets").addEventListener("change", handleSheetSelect, false);
})
