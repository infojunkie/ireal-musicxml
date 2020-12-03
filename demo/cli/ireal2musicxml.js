const iReal2MusicXML = require('../../lib/ireal-musicxml');
const fs = require('fs');

const args = process.argv.slice(2);
if (!args.length) {
  console.error('ireal2musicxml: Missing iReal Pro playlist file or URI.');
  process.exit(1);
}

let ireal = null;
if (fs.existsSync(args[0])) {
  ireal = fs.readFileSync(args[0], 'utf-8');
}
else {
  ireal = args[0];
}

const playlist = new iReal2MusicXML.Playlist(ireal);
playlist.songs.forEach((song, i) => {
  console.info(`Processing ${i+1}/${playlist.songs.length} "${song.title}"...`);
  try {
    const musicXml = iReal2MusicXML.MusicXML.convert(song);
    fs.writeFileSync(`${song.title.replace(/[/\\?%*:|"<>]/g, '-')}.musicxml`, musicXml);
  }
  catch (error) {
    console.error(`ireal2musicxml: Error converting "${song.title}" ${error}`);
  }
});
