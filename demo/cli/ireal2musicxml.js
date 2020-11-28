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

const playlist = iReal2MusicXML.convertSync(ireal);
playlist.songs.forEach(song => {
  process.stdout.write(`Exporting "${song.title}"...\n`);
  fs.writeFileSync(`${song.title.replace(/[/\\?%*:|"<>]/g, '-')}.musicxml`, song.musicXml);
});
