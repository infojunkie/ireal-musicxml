/**
 * iReal Pro playlist.
 */
export class Playlist {
  /**
   * Playlist parser. Parsing occurs in this constructor.
   * @param ireal iReal Pro playlist as HTML file contents or URI encoding
   */
  constructor(ireal: string);
  /**
   * Playlist name.
   */
  name: string;
  /**
   * Songs.
   */
  songs: Song[];
}

/**
 * iReal Pro song.
 */
export class Song {
  /**
   * Song parser. Parsing occurs in this constructor.
   * Refer to https://github.com/infojunkie/ireal-musicxml/blob/main/doc/ireal.md for structure details.
   * @param ireal iReal Pro encoding for a single song
   */
  constructor(ireal: string);
  /**
   * Title.
   */
  title: string;
  /**
   * Composer.
   */
  composer: string;
  /**
   * Style as displayed by iReal Pro.
   */
  style: string;
  /**
   * Groove as played back by iReal Pro.
   */
  groove: string;
  /**
   * Key.
   */
  key: string;
  /**
   * Beat per minute.
   */
  bpm: number;
  /**
   * Transposition in semitones (unhandled)
   */
  transpose: number;
  /**
   * Repeats (unhandled)
   */
  repeats: number;
  /**
   * Song structure expressed in cells.
   */
  cells: Cell[];
  /**
   * Resulting MusicXML after conversion via convert() or convertSync(). Initially empty during parsing.
   */
  musicXml: string;
}

/**
 * iReal Pro cell.
 */
export class Cell {
  /**
   * Annotations (time signature, repeats, ...)
   */
  annots: string[];
  /**
   * Comments and repeat directions.
   */
  comments: string[];
  /**
   * Opening and closing barlines.
   */
  bars: string;
  /**
   * Vertical spacer (unhandled).
   */
  spacer: number;
  /**
   * Chord.
   */
  chord: Chord;
}

/**
 * iReal Pro chord.
 */
export class Chord {
  /**
   * Root note.
   */
  note: string;
  /**
   * Chord modifiers (quality, extensions, ...)
   */
  modifiers: string;
  /**
   * Bass note if any, expressed as chord.
   */
  over: Chord;
  /**
   * Alternate chord if any.
   */
  alternate: Chord;
}

/**
 * Type of chord notation.
 * https://en.wikipedia.org/wiki/Chord_chart
 */
export enum ChordNotation {
  Rhythmic = "rhythmic",
  Slash = "slash"
}

/**
 * MusicXML conversion options.
 */
export class Options {
  /**
   * Divisions (ticks) per measure.
   */
  divisions: number;
  /**
   * Options for dummy notes representing chords on the staff.
   */
  note: {
    /**
     * Type of chord notation.
     */
    notation: ChordNotation,
    /**
     * Pitch step to use.
     */
    step: string,
    /**
     * Octave to use.
     */
    octave: number,
    /**
     * Shape of note head to use, as per https://usermanuals.musicxml.com/MusicXML/Content/ST-MusicXML-notehead-value.htm
     */
    notehead: string
  }
}

/**
 * MusicXML converter.
 */
export class MusicXML {
  /**
   * Default conversion options.
   */
  static defaultOptions: Options;
  /**
   * Utility function to convert a Song to MusicXML.
   * @param song Song structure
   * @param options Conversion options (optional, merged with defaults)
   * @returns MusicXML string
   */
  static convert(song: Song, options?: Options): string;
  /**
   * Conversion setup.
   * @param song Song structure
   * @param options Conversion options
   */
  constructor(song: Song, options: Options);
  /**
   * Conversion function.
   * @returns MusicXML string
   */
  convert(): string;
}

/**
 * Convert an iReal Pro playlist synchronously.
 * @param ireal iReal Pro playlist as HTML file contents or URI encoding
 * @returns Playlist object including MusicXML string for each song
 */
export function convertSync(ireal: string): Playlist;

/**
 * Convert an iReal Pro playlist asynchronously.
 * @param ireal iReal Pro playlist as HTML file contents or URI encoding
 * @returns Promise for a Playlist object including MusicXML string for each song
 */
export function convert(ireal: string): Promise<Playlist>;
