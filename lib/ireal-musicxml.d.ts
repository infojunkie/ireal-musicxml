export class Playlist {
  constructor(ireal: string);
  name: string;
  songs: Song[];
}

export class Song {
  constructor(ireal: string);
  title: string;
  composer: string;
  style: string;
  key: string;
  transpose: number;
  groove: string;
  bpm: number;
  repeats: number;
  cells: Cell[];
  /**
   * The resulting MusicXML after conversion via convert() or convertSync().
   */
  musicXml: string;
}

export class Cell {
  annots: string[];
  comments: string[];
  bars: string;
  spacer: number;
  chord: Chord;
}

export class Chord {
  note: string;
  modifiers: string;
  over: Chord;
  alternate: Chord;
}

export class Options {
  divisions: number;
  note: {
    type: string,
    step: string,
    octave: number,
    notehead: string
  }
}

export class MusicXML {
  static defaultOptions: Options;
  static convert(song: Song, options?: Options): string;
  constructor(song: Song, options: Options);
  convert(): string;
}

export function convertSync(ireal: string): Playlist;

export function convert(ireal: string): Promise<Playlist>;
