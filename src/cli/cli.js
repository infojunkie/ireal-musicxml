#!/usr/bin/env node

/**
 * Convert an iReal Pro playlist into a series of MusicXML files.
 */

import fs from 'fs';
import sanitize from 'sanitize-filename';
import path from 'path';
import { parseArgs } from 'node:util';
import { validateXMLWithXSD } from 'validate-with-xmllint';
import { Version } from '../lib/version.js';
import { Playlist } from '../lib/parser.js';
import { Converter } from '../lib/converter.js';

const options = {
  'ireal': {
    type: 'string',
    short: 'i',
  },
  'output': {
    type: 'string',
    short: 'o',
  },
  'help': {
    type: 'boolean',
    short: 'h'
  },
  'version': {
    type: 'boolean',
    short: 'v'
  },
  'songs': {
    type: 'string'
  },
  'validate': {
    type: 'boolean'
  }
};
const { values: args, positionals } = (() => {
  try {
    return parseArgs({ options, allowPositionals: true });
  }
  catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();

if ('help' in args) {
  console.log(`
Usage: ireal-musicxml v${Version.version} ireal://uri/or/path/to/playlist [--output|-o /path/to/output] [--songs comma-separated-songs-to-convert] [--validate] [--version|-v] [--help|-h]

Converts iReal Pro playlist to MusicXML.
`.trim());
  process.exit(0);
}

if ('version' in args) {
  console.log(`ireal-musicxml v${Version.version}`);
  process.exit(0);
}

if (positionals.length == 0) {
  console.log(`Missing iReal Pro URI or playlist file`);
  process.exit(1);
}

if ('output' in args && !fs.existsSync(args['output'])) {
  console.error(`Missing output dir ${args['output']}`);
  process.exit(1);
}

const input = fs.existsSync(positionals[0]) ? fs.readFileSync(positionals[0], 'utf-8') : positionals[0];
const output = args['output'];
const songs = 'songs' in args ? args['songs'].split(',').map(s => s.trim().toUpperCase()) : [];
try {
  const playlist = new Playlist(input);
  for (const song of playlist.songs) {
    if (songs.length > 0 && songs.every(title => song.title.toUpperCase().indexOf(title) < 0)) continue;

    try {
      const musicXml = Converter.convert(song);

      if ('validate' in args) {
        await validateXMLWithXSD(musicXml, 'test/data/musicxml.xsd');
      }

      if ('output' in args) {
        fs.writeFileSync(path.join(output, `${sanitize(song.title)}.musicxml`), musicXml);
      }
      else {
        process.stdout.write(musicXml + '\n');
      }
    }
    catch (error) {
      console.error(`[ireal-musicxml] [${song.title}] ${error}`);
    }
  }
}
catch (error) {
  console.error(`[ireal-musicxml] [${positionals[0]}] ${error}`);
  process.exit(1);
}
