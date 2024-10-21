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
   * @param oldFormat Flag to indicate that the encoding above corresponds to the older irealbook:// format.
   */
  constructor(ireal: string, oldFormat: boolean);
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
   * Transposition in semitones (currently unhandled).
   */
  transpose: number;
  /**
   * Repeats (currently unhandled).
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
   * Vertical spacer (currently unhandled).
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
 * Log levels.
 */
export enum LogLevel {
  Debug = 0,
  Info,
  Warn,
  Error,
  None
}

/**
 * MusicXML conversion options.
 */
export class ConversionOptions {
  /**
   * Divisions (ticks) per measure (default: 768).
   * https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/divisions/
   */
  divisions?: number;
  /**
   * Type of chord notation to use (default: rhythmic).
   */
  notation?: ChordNotation;
  /**
   * Pitch step to use for the chord note (default: B).
   */
  step?: string;
  /**
   * Octave to use for the chord note (default: 4).
   */
  octave?: number;
  /**
   * Shape of note head to use for the chord note (default: slash).
   * https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/notehead-value/
   */
  notehead?: string;
  /**
   * Size of note head to use for the chord note (default: large).
   * https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/font-size/
   */
  noteheadSize?: string;
  /**
   * Whether to output encoding date (default: yes).
   * https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/encoding-date/
   */
  date?: boolean;
  /**
   * Whether to display the clef (i.e. set its @print-object attribute) (default: no).
   * https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/clef/
   */
  clef?: boolean;
  /**
   * Whether to display the key signature (i.e. set its @print-object attribute) (default: no).
   * https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/key/
   */
  keySignature?: boolean;
  /**
   * Page width in millimeters (default: A4 = 210mm).
   */
  pageWidth?: number;
  /**
   * Page height in millimeters (default: A4 = 297mm).
   */
  pageHeight?: number;
  /**
   * Page margin in millimeters (default: 15mm).
   */
  pageMargin?: number;
  /**
   * Log level (default: LogLevel.Warn).
   */
  logLevel?: LogLevel;
}

/**
 * MusicXML converter.
 */
export class Converter {
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
 * Package information.
 */
export class Version {
  /**
   * Package name.
   */
  static name: string;
  /**
   * Package version.
   */
  static version: string;
  /**
   * Package author.
   */
  static author: string;
  /**
   * Package description.
   */
  static description: string;
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
