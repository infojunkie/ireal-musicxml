import {Playlist} from './parser';
import {MusicXML} from './musicxml';

export function convert(ireal) {
  const playlist = new Playlist(ireal);
  playlist.songs.forEach(song => {
    song.musicXml = MusicXML.convert(song);
  });
  return playlist;
}
