import {Playlist} from './parser';
import {MusicXML} from './musicxml';

export default class iReal2MusicXML {
  static convert(ireal) {
    const playlist = new Playlist(ireal);
    playlist.songs.forEach(song => {
      song.musicxml = MusicXML.convert(song);
    });
    return playlist;
  }
}
