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
export type ChordNotation = "rhythmic" | "slash";

/**
 * MusicXML conversion options.
 */
export class ConversionOptions {
  /**
   * Divisions (ticks) per measure.
   */
  divisions?: number;
  /**
   * Type of chord notation.
   */
  notation?: ChordNotation;
  /**
   * Pitch step to use.
   */
  step?: string;
  /**
   * Octave to use.
   */
  octave?: number;
  /**
   * Shape of note head to use, as per https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/notehead-value/
   */
  notehead?: string;
}

/**
 * MusicXML converter.
 */
export class MusicXML {
  /**
   * Default conversion options.
   */
  static defaultOptions: ConversionOptions;
  /**
   * Utility function to convert a Song to MusicXML.
   * @param song Song structure
   * @param options Conversion options (optional, merged with defaults)
   * @returns MusicXML string
   */
  static convert(song: Song, options?: ConversionOptions): string;
  /**
   * Conversion setup.
   * @param song Song structure
   * @param options Conversion options
   */
  constructor(song: Song, options: ConversionOptions);
  /**
   * Conversion function.
   * @returns MusicXML string
   */
  convert(): string;
}

/**
 * Convert an iReal Pro playlist synchronously.
 * @param ireal iReal Pro playlist as HTML file contents or URI encoding
 * @param options Conversion options (optional, merged with defaults)
 * @returns Playlist object including MusicXML string for each song
 */
export function convertSync(ireal: string, options?: ConversionOptions): Playlist;

/**
 * Convert an iReal Pro playlist asynchronously.
 * @param ireal iReal Pro playlist as HTML file contents or URI encoding
 * @param options Conversion options (optional, merged with defaults)
 * @returns Promise for a Playlist object including MusicXML string for each song
 */
export function convert(ireal: string, options?: ConversionOptions): Promise<Playlist>;
