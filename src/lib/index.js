import Promise from 'promise';
import { Playlist, Song, Cell, Chord } from './parser.js';
import { Converter, LogLevel } from './converter.js';
import { Version } from './version.js';

export function convertSync(ireal, options = {}) {
  const playlist = new Playlist(ireal);
  playlist.songs.forEach(song => {
    song.musicXml = Converter.convert(song, options);
  });
  return playlist;
}

export async function convert(ireal, options = {}) {
  return new Promise(resolve => resolve(convertSync(ireal, options)));
}

export { Playlist, Song, Cell, Chord, Converter, LogLevel, Version };
