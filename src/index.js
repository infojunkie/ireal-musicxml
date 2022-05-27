import Promise from 'promise';
import {Playlist, Song, Cell, Chord} from './parser';
import {MusicXML, LogLevel} from './musicxml';
import 'regenerator-runtime/runtime';

export function convertSync(ireal, options = {}) {
  const playlist = new Playlist(ireal);
  playlist.songs.forEach(song => {
    song.musicXml = MusicXML.convert(song, options);
  });
  return playlist;
}

export async function convert(ireal, options = {}) {
  return new Promise(resolve => resolve(convertSync(ireal, options)));
}

export {Playlist, Song, Cell, Chord, MusicXML, LogLevel};
