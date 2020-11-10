import {Playlist} from './parser';
import {MusicXML} from './musicxml';

export default class iReal2MusicXML {
  static convert(ireal) {
    const playlist = new Playlist(ireal);
    const songs = playlist.songs.map(song => {
      song.musicxml = MusicXML.convert(song);
      return song;
    });
    return {
      playlist: playlist.name,
      songs,
    }
  }
}
