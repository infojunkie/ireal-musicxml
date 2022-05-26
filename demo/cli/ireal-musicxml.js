#!/usr/bin/env node

// Convert an iReal Pro playlist into a series of MusicXML files.

const ireal = require('../../lib/ireal-musicxml');
const fs = require('fs');
const sanitize = require('sanitize-filename');
const path = require('path');

const args = process.argv.slice(2);
if (!args.length) {
  console.error('[ireal-musicxml] Missing iReal Pro playlist file or URI.');
  process.exit(1);
}

const input = fs.existsSync(args[0]) ? fs.readFileSync(args[0], 'utf-8') : args[0];
const output = args[1] || '';

const playlist = new ireal.Playlist(input);
for (const song of playlist.songs) {
  try {
    const musicXml = ireal.MusicXML.convert(song);
    const outFile = path.join(output, `${sanitize(song.title)}.musicxml`)
    fs.writeFileSync(outFile, musicXml);
  }
  catch (error) {
    console.error(`[ireal-musicxml] [${song.title}] ${error.toString()}`);
  }
}
