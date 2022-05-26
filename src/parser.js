/**
 * The iReal Pro parser is derived from
 * https://github.com/daumling/ireal-renderer
 * which is itself derived from
 * https://github.com/pianosnake/ireal-reader
 *
 * None of those modules did exactly what is needed here, namely return
 * a full structure that can be iterated downstream.
 */

import diff from 'fast-diff';
export class Playlist {
  constructor(ireal){
    const playlistEncoded = /.*?(irealb(?:ook)?):\/\/([^"]*)/.exec(ireal);
    const playlist = decodeURIComponent(playlistEncoded[2]);
    const parts = playlist.split("===");  //songs are separated by ===
    if (parts.length > 1) this.name = parts.pop();  //playlist name
    this.songs = parts
      .map(part => new Song(part, playlistEncoded[1] === 'irealbook'))
      .reduce((songs, song) => {
        if (songs.length > 0) {
          // Detect multi-part songs via their titles.
          // The parts of the same song have the same title, except for the part number, so they follow each other in the list.
          // The `diff` module compares two titles and returns a list of similarities and differences.
          // We expect the first diff to be a similarity, followed by differences that are only numeric.
          // When we find a multi-part song, we just concatenate the cells into the first part.
          const diffs = diff(songs[songs.length-1].title, song.title);
          if (diffs[0][0] === 0 && diffs.every(d => d[0] === 0 || d[1].match(/^\d+$/))) {
            songs[songs.length-1].cells = songs[songs.length-1].cells.concat(song.cells);
            return songs;
          }
        }
        songs.push(song);
        return songs;
      }, []);
  }
}

export class Cell {
  constructor() {
    this.annots = [];
    this.comments = [];
    this.bars = "";
    this.spacer = 0;
    this.chord = null;
  }
}

export class Chord {
  constructor(note, modifiers = "", over = null, alternate = null) {
    this.note = note;
    this.modifiers = modifiers;
    this.over = over;
    this.alternate = alternate;
  }
}

export class Song {
  constructor(ireal, oldFormat = false) {
    this.cells = [];
    this.musicXml = "";
    if (!ireal) {
      this.title = "";
      this.composer = "";
      this.style = "";
      this.key = "";
      this.transpose = 0;
      this.groove = "";
      this.bpm = 0;
      this.repeats = 0;
      return;
    }
    const parts = ireal.split("="); //split on one sign, remove the blanks
    if (oldFormat) {
      this.title = this.parseTitle(parts[0].trim());
      this.composer = this.parseComposer(parts[1].trim());
      this.style = parts[2].trim();
      this.key = parts[3];
      this.cells = this.parse(parts[5]);
    }
    else {
      this.title = this.parseTitle(parts[0].trim());
      this.composer = this.parseComposer(parts[1].trim());
      this.style = parts[3].trim();
      this.key = parts[4];
      this.transpose = +parts[5] || 0; // TODO
      this.groove = parts[7];
      this.bpm = +parts[8];
      this.repeats = +parts[9] || 3;
      const music = parts[6].split("1r34LbKcu7");
      this.cells = this.parse(unscramble(music[1]));
    }
  }

  /**
   * The RegExp for a complete chord. The match array contains:
   * 1 - the base note
   * 2 - the modifiers (+-ohd0123456789 and su for sus)
   * 3 - any comments (may be e.g. add, sub, or private stuff)
   * 4 - the "over" part starting with a slash
   * 5 - the top chord as (chord)
   * @type RegExp
   */
  static chordRegex = /^([A-G][b#]?)((?:sus|alt|add|[+\-^\dhob#])*)(\*.+?\*)*(\/[A-G][#b]?)?(\(.*?\))?/;
  static chordRegex2 = /^([ Wp])()()(\/[A-G][#b]?)?(\(.*?\))?/;	// need the empty captures to match chordRegex

  static regExps = [
    /^\*[a-zA-Z]/,							// section
    /^T\d\d/,								// time measurement
    /^N./,									// repeat marker
    /^<.*?>/,								// comments
    Song.chordRegex,				// chords
    Song.chordRegex2,				// space, W and p (with optional alt chord)
  ];

  /**
   * The parser cracks up the raw music string into several objects,
   * one for each cell. iReal Pro works with rows of 16 cell each. The result
   * is stored at song.cells.
   *
   * Each object has the following properties:
   *
   * chord: if non-null, a chord object with these properties:
   *   note      - the base note (also blank, W = invisible root, p/x/r - pause/bar repeat/double-bar repeat, n - no chord)
   *   modifiers - the modifiers, like 7, + o etc (string)
   *   over      - if non-null, another chord object for the under-note
   *   alternate - if non-null another chord object for the alternate chord
   * annots: annotations, a string of:
   *  *x  - section, like *v, *I, *A, *B etc
   *  Nx  - repeat bots (N1, N2 etc)
   *  Q   - coda
   *  S   - segno
   *  Txx - measure (T44 = 4/4 etc, but T12 = 12/8)
   *  U   - END
   *  f   - fermata
   *  l   - (letter l) normal notes
   *  s   - small notes
   * comments: an array of comment strings
   * bars: bar specifiers, a string of:
   *  | - single vertical bar, left
   *  [ - double bar, left
   *  ] - double bar, right
   *  { - repeat bar, left
   *  } - repeat bar, right
   *  Z - end bar, right
   * spacer - a number indicating the number of vertical spacers above this cell
   *
   * @returns [Cell]
   */
  parse(ireal) {
    let text = ireal.trim();
    const arr = [];
    while (text) {
      let found = false;
      for (let i = 0; i < Song.regExps.length; i++) {
        const match = Song.regExps[i].exec(text);
        if (match) {
          found = true;
          if (match.length <= 2) {
            arr.push(match[0]);
            text = text.substr(match[0].length);
          }
          else {
            // a chord
            arr.push(match);
            text = text.substr(match[0].length);
          }
          break;
        }
      }
      if (!found) {
        // ignore the comma separator
        if (text[0] !== ',')
          arr.push(text[0]);
        text = text.substr(1);
      }
    }

    // pass 2: extract prefixes, suffixes, annotations and comments
    const cells = [];
    let obj = this.newCell(cells);
    let prevobj = null;
    for (let i = 0; i < arr.length; i++) {
      let cell = arr[i];
      if (cell instanceof Array) {
        obj.chord = this.parseChord(cell);
        cell = " ";
      }
      switch (cell[0]) {
        case '{':	// open repeat
        case '[':	// open double bar
          if (prevobj) { prevobj.bars += ')'; prevobj = null; }
          obj.bars = cell; cell = null; break;
        case '|':	// single bar - close previous and open this
          if (prevobj) { prevobj.bars += ')'; prevobj = null; }
          obj.bars = '('; cell = null; break;
        case ']':	// close double bar
        case '}':	// close repeat
        case 'Z':	// ending double bar
          if (prevobj) { prevobj.bars += cell; prevobj = null; }
          cell = null; break;
        case 'n':	// N.C.
          obj.chord = new Chord(cell[0]);
          break;
        case ',':	cell = null; break; // separator
        case 'S':	// segno
        case 'T':	// time measurement
        case 'Q':	// coda
        case 'N':	// repeat
        case 'U':	// END
        case 's':	// small
        case 'l':	// normal
        case 'f':	// fermata
        case '*': obj.annots.push(cell); cell = null; break;
        case 'Y': obj.spacer++; cell = null; prevobj = null; break;
        case 'r':
        case 'x':
        case 'W':
          obj.chord = new Chord(cell);
          break;
        case '<':
          cell = cell.substr(1, cell.length-2);
          obj.comments.push(cell);
          cell = null; break;
        default:
      }
      if (cell && i < arr.length-1) {
        prevobj = obj;		// so we can add any closing barline later
        obj = this.newCell(cells);
      }
    }
    return cells;
  }

  /**
   * The title had "A" and "The" at the back (e.g. "Gentle Rain, The")
   */
  parseTitle(title) {
    return title.replace(/(.*)(, )(A|The)$/g, '$3 $1');
  }

  /**
   * The composer is reversed (last first) if it only has 2 names :shrug:
   */
  parseComposer(composer) {
    const parts = composer.split(/(\s+)/); // match and return spaces too
    if (parts.length == 3) { // [last, spaces, first]
      return parts[2] + parts[1] + parts[0]
    }
    return composer;
  }

  parseChord(chord) {
    var note = chord[1] || " ";
    var modifiers = chord[2] || "";
    var comment = chord[3] || "";
    if (comment)
      modifiers += comment.substr(1, comment.length-2);
    var over = chord[4] || "";
    if (over[0] === '/')
      over = over.substr(1);
    var alternate = chord[5] || null;
    if (alternate) {
      chord = Song.chordRegex.exec(alternate.substr(1, alternate.length-2));
      if (!chord)
        alternate = null;
      else
        alternate = this.parseChord(chord);
    }
    // empty cell?
    if (note === " " && !alternate && !over)
      return null;
    if (over) {
      var offset = (over[1] === '#' || over[1] === 'b') ? 2 : 1;
      over = new Chord(over.substr(0, offset), over.substr(offset), null, null);
    }
    else
      over = null;
    return new Chord(note, modifiers, over, alternate);
  }

  newCell(cells) {
    var obj = new Cell;
    cells.push(obj);
    return obj;
  }
}

// Unscrambling hints from https://github.com/ironss/accompaniser/blob/master/irealb_parser.lua
// Strings are broken up in 50 character segments. each segment undergoes character substitution addressed by obfusc50()
// Note that a final part of length 50 or 51 is not scrambled.
// Finally need to substitute for Kcl, LZ and XyQ.
function unscramble(s) {
  let r = '', p;

  while (s.length > 51){
    p = s.substring(0, 50);
    s = s.substring(50);
    r = r + obfusc50(p);
  }
  r = r + s;
  // now undo substitution obfuscation
  r =  r.replace(/Kcl/g, '| x').replace(/LZ/g, ' |').replace(/XyQ/g, '   ');
  return r;
}

function obfusc50(s) {
  // the first 5 characters are switched with the last 5
  let newString = s.split('');
  for (let i = 0; i < 5; i++){
    newString[49 - i] = s[i];
    newString[i] = s[49 - i];
  }
  // characters 10-24 are also switched
  for (let i = 10; i < 24; i++){
    newString[49 - i] = s[i];
    newString[i] = s[49 - i];
  }
  return newString.join('');
}
