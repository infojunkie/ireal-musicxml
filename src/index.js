import Promise from 'promise';
import {Playlist} from './parser';
import {MusicXML} from './musicxml';
import 'regenerator-runtime/runtime';

export function convertSync(ireal) {
  const playlist = new Playlist(ireal);
  playlist.songs.forEach(song => {
    song.musicXml = MusicXML.convert(song);
  });
  return playlist;
}

export async function convert(ireal) {
  return new Promise(resolve => resolve(convertSync(ireal)));
}
