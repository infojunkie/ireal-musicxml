import {Playlist} from './parser';
import {MusicXML} from './musicxml';

export default class iReal2MusicXML {
  static convert(ireal) {
    const playlist = new Playlist(ireal);
    const converted = playlist.songs.map(song => {
      return {
        song,
        musicxml: MusicXML.convert(song)
      }
    });
    return {
      playlist: playlist.name,
      songs: converted,
    }
  }
}
