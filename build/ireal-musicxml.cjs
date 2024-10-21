var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/lib/index.js
var lib_exports = {};
__export(lib_exports, {
  Cell: () => Cell,
  Chord: () => Chord,
  Converter: () => Converter,
  LogLevel: () => LogLevel,
  Playlist: () => Playlist,
  Song: () => Song,
  Version: () => Version,
  convert: () => convert,
  convertSync: () => convertSync
});
module.exports = __toCommonJS(lib_exports);
var import_promise = __toESM(require("promise"), 1);

// src/lib/parser.js
var import_fast_diff = __toESM(require("fast-diff"), 1);
var Playlist = class {
  constructor(ireal) {
    const playlistEncoded = /.*?(irealb(?:ook)?):\/\/([^"]*)/.exec(ireal);
    const playlist = decodeURIComponent(playlistEncoded[2]);
    const parts = playlist.split("===");
    if (parts.length > 1) this.name = parts.pop();
    this.songs = parts.map((part) => {
      try {
        return new Song(part, playlistEncoded[1] === "irealbook");
      } catch (error) {
        const parts2 = part.split("=");
        const title = Song.parseTitle(parts2[0].trim());
        console.error(`[ireal-musicxml] [${title}] ${error}`);
        return null;
      }
    }).filter((song) => song !== null).reduce((songs, song) => {
      if (songs.length > 0) {
        const diffs = (0, import_fast_diff.default)(songs[songs.length - 1].title, song.title);
        if (diffs[0][0] === 0 && diffs.every((d) => d[0] === 0 || d[1].match(/^\d+$/))) {
          songs[songs.length - 1].cells = songs[songs.length - 1].cells.concat(song.cells);
          return songs;
        }
      }
      songs.push(song);
      return songs;
    }, []);
  }
};
var Cell = class {
  constructor() {
    this.annots = [];
    this.comments = [];
    this.bars = "";
    this.spacer = 0;
    this.chord = null;
  }
};
var Chord = class {
  constructor(note, modifiers = "", over = null, alternate = null) {
    this.note = note;
    this.modifiers = modifiers;
    this.over = over;
    this.alternate = alternate;
  }
};
var Song = class _Song {
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
    const parts = ireal.split("=");
    if (oldFormat) {
      this.title = _Song.parseTitle(parts[0].trim());
      this.composer = _Song.parseComposer(parts[1].trim());
      this.style = parts[2].trim();
      this.key = parts[3];
      this.cells = this.parse(parts[5]);
    } else {
      this.title = _Song.parseTitle(parts[0].trim());
      this.composer = _Song.parseComposer(parts[1].trim());
      this.style = parts[3].trim();
      this.key = parts[4];
      this.transpose = +parts[5] || 0;
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
  static chordRegex2 = /^([ Wp])()()(\/[A-G][#b]?)?(\(.*?\))?/;
  // need the empty captures to match chordRegex
  static regExps = [
    /^\*[a-zA-Z]/,
    // section
    /^T\d\d/,
    // time measurement
    /^N./,
    // repeat marker
    /^<.*?>/,
    // comments
    _Song.chordRegex,
    // chords
    _Song.chordRegex2
    // space, W and p (with optional alt chord)
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
      for (let i = 0; i < _Song.regExps.length; i++) {
        const match = _Song.regExps[i].exec(text);
        if (match) {
          found = true;
          if (match.length <= 2) {
            arr.push(match[0]);
            text = text.substr(match[0].length);
          } else {
            arr.push(match);
            text = text.substr(match[0].length);
          }
          break;
        }
      }
      if (!found) {
        if (text[0] !== ",")
          arr.push(text[0]);
        text = text.substr(1);
      }
    }
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
        case "{":
        // open repeat
        case "[":
          if (prevobj) {
            prevobj.bars += ")";
            prevobj = null;
          }
          obj.bars = cell;
          cell = null;
          break;
        case "|":
          if (prevobj) {
            prevobj.bars += ")";
            prevobj = null;
          }
          obj.bars = "(";
          cell = null;
          break;
        case "]":
        // close double bar
        case "}":
        // close repeat
        case "Z":
          if (prevobj) {
            prevobj.bars += cell;
            prevobj = null;
          }
          cell = null;
          break;
        case "n":
          obj.chord = new Chord(cell[0]);
          break;
        case ",":
          cell = null;
          break;
        // separator
        case "S":
        // segno
        case "T":
        // time measurement
        case "Q":
        // coda
        case "N":
        // repeat
        case "U":
        // END
        case "s":
        // small
        case "l":
        // normal
        case "f":
        // fermata
        case "*":
          obj.annots.push(cell);
          cell = null;
          break;
        case "Y":
          obj.spacer++;
          cell = null;
          prevobj = null;
          break;
        case "r":
        case "x":
        case "W":
          obj.chord = new Chord(cell);
          break;
        case "<":
          cell = cell.substr(1, cell.length - 2);
          obj.comments.push(cell);
          cell = null;
          break;
        default:
      }
      if (cell && i < arr.length - 1) {
        prevobj = obj;
        obj = this.newCell(cells);
      }
    }
    return cells;
  }
  /**
   * The title had "A" and "The" at the back (e.g. "Gentle Rain, The")
   */
  static parseTitle(title) {
    return title.replace(/(.*)(, )(A|The)$/g, "$3 $1");
  }
  /**
   * The composer is reversed (last first) if it only has 2 names :shrug:
   */
  static parseComposer(composer) {
    const parts = composer.split(/(\s+)/);
    if (parts.length == 3) {
      return parts[2] + parts[1] + parts[0];
    }
    return composer;
  }
  parseChord(chord) {
    var note = chord[1] || " ";
    var modifiers = chord[2] || "";
    var comment = chord[3] || "";
    if (comment)
      modifiers += comment.substr(1, comment.length - 2);
    var over = chord[4] || "";
    if (over[0] === "/")
      over = over.substr(1);
    var alternate = chord[5] || null;
    if (alternate) {
      chord = _Song.chordRegex.exec(alternate.substr(1, alternate.length - 2));
      if (!chord)
        alternate = null;
      else
        alternate = this.parseChord(chord);
    }
    if (note === " " && !alternate && !over)
      return null;
    if (over) {
      var offset = over[1] === "#" || over[1] === "b" ? 2 : 1;
      over = new Chord(over.substr(0, offset), over.substr(offset), null, null);
    } else
      over = null;
    return new Chord(note, modifiers, over, alternate);
  }
  newCell(cells) {
    var obj = new Cell();
    cells.push(obj);
    return obj;
  }
};
function unscramble(s) {
  let r = "", p;
  while (s.length > 51) {
    p = s.substring(0, 50);
    s = s.substring(50);
    r = r + obfusc50(p);
  }
  r = r + s;
  r = r.replace(/Kcl/g, "| x").replace(/LZ/g, " |").replace(/XyQ/g, "   ");
  return r;
}
function obfusc50(s) {
  const newString = s.split("");
  for (let i = 0; i < 5; i++) {
    newString[49 - i] = s[i];
    newString[i] = s[49 - i];
  }
  for (let i = 10; i < 24; i++) {
    newString[49 - i] = s[i];
    newString[i] = s[49 - i];
  }
  return newString.join("");
}

// src/lib/converter.js
var import_jstoxml = __toESM(require("jstoxml"), 1);
var import_chord_symbol = __toESM(require("chord-symbol"), 1);

// package.json
var package_default = {
  name: "ireal-musicxml",
  version: "2.0.0",
  description: "iReal Pro to MusicXML converter.",
  author: "Karim Ratib <karim.ratib@gmail.com> (https://github.com/infojunkie)",
  license: "GPL-3.0-only",
  repository: {
    type: "git",
    url: "https://github.com/infojunkie/ireal-musicxml"
  },
  homepage: "https://github.com/infojunkie/ireal-musicxml",
  type: "module",
  types: "./src/types/ireal-musicxml.d.ts",
  files: [
    "LICENSE.txt",
    "build/*",
    "src/*"
  ],
  bin: {
    "ireal-musicxml": "./src/cli/cli.js"
  },
  exports: {
    import: "./build/ireal-musicxml.js",
    require: "./build/ireal-musicxml.cjs"
  },
  scripts: {
    build: "npm run build:esm && npm run build:cjs",
    "build:esm": "esbuild src/lib/index.js --bundle --format=esm --sourcemap --outfile=build/ireal-musicxml.js",
    "build:cjs": "esbuild src/lib/index.js --bundle --platform=node --packages=external --outfile=build/ireal-musicxml.cjs",
    test: "npm run test:lint && npm run test:spec && npm run test:ts",
    "test:spec": 'node --test --test-name-pattern="${TEST:-.*}"',
    "test:ts": "npm run build && node --test --loader=ts-node/esm --require ts-node/register test/**/*.spec.ts",
    "test:lint": "eslint src --fix"
  },
  devDependencies: {
    "@types/node": "^22.7.7",
    "@xmldom/xmldom": "^0.8.0",
    esbuild: "0.24.0",
    eslint: "^9.13.0",
    resolve: "^1.22.8",
    "sanitize-filename": "^1.6.3",
    "ts-node": "^10.9.2",
    typescript: "^4.9.5",
    "validate-with-xmllint": "^1.2.0",
    "xpath.js": "^1.1.0"
  },
  dependencies: {
    "chord-symbol": "^3.0.0",
    "fast-diff": "^1.2.0",
    jstoxml: "^2.0.6",
    promise: "^8.1.0"
  }
};

// src/lib/version.js
var Version = class {
  static name = package_default.name;
  static version = package_default.version;
  static author = package_default.author;
  static description = package_default.description;
};

// src/lib/converter.js
var { chordParserFactory, chordRendererFactory } = import_chord_symbol.default;
var LogLevel = class {
  static Debug = 0;
  static Info = 1;
  static Warn = 2;
  static Error = 3;
  static None = 4;
};
var MUSICXML_VERSION = "4.0";
var SCALING_MM = 7;
var SCALING_TENTHS = 40;
var Converter = class _Converter {
  static defaultOptions = {
    "divisions": 768,
    // same as used by iReal
    "notation": "rhythmic",
    // 'rhythmic' for rhythmic notation, 'slash' for slash notation
    "step": "B",
    // chord note
    "octave": 4,
    // chord note octave
    "notehead": "slash",
    // chord note head
    "noteheadSize": "large",
    // size of chord note head
    "date": true,
    // include encoding date
    "clef": false,
    // hide clef by default
    "keySignature": false,
    // hide key signature by default
    "pageWidth": 210,
    // mm (A4)
    "pageHeight": 297,
    // mm (A4)
    "pageMargin": 15,
    // mm
    "logLevel": LogLevel.Warn
  };
  static sequenceAttributes = [
    // Expected order of attribute elements.
    // https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/attributes/
    "divisions",
    "key",
    "time",
    "staves",
    "part-symbol",
    "instruments",
    "clef",
    "staff-details",
    "transpose",
    "directive",
    "measure-style"
  ];
  static sequenceNote = [
    // Expected order of note elements.
    // https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/note/
    "cue",
    "pitch",
    "rest",
    "unpitched",
    "duration",
    "tie",
    "voice",
    "type",
    "dot",
    "accidental",
    "time-modification",
    "stem",
    "notehead",
    "notehead-text",
    "staff",
    "beam",
    "notations",
    "lyric",
    "play"
  ];
  static sequenceNotations = [
    // Expected order of notations elements.
    // https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/notations/
    "accidental-mark",
    "arpeggiate",
    "articulations",
    "dynamics",
    "fermata",
    "glissando",
    "non-arpeggiate",
    "ornaments",
    "other-notation",
    "slide",
    "slur",
    "technical",
    "tied",
    "tuplet"
  ];
  static sequenceBarline = [
    // Expected order of barline elements.
    // https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/barline/
    "bar-style",
    "footnote",
    "level",
    "wavy-line",
    "segno",
    "coda",
    "fermata",
    "ending",
    "repeat"
  ];
  static mapAlter = {
    "#": 1,
    "b": -1
  };
  static mapFifthsToAlters = {
    "sharp": ["F", "C", "G", "D", "A", "E", "B"],
    "flat": ["B", "E", "A", "D", "G", "C", "F"]
  };
  static mapRepeats = {
    "D.C. al Coda": _Converter.prototype.convertDaCapo,
    "D.C. al Fine": _Converter.prototype.convertDaCapo,
    "D.C. al 1st End.": _Converter.prototype.convertDaCapo,
    "D.C. al 2nd End.": _Converter.prototype.convertDaCapo,
    "D.C. al 3rd End.": _Converter.prototype.convertDaCapo,
    "D.S. al Coda": _Converter.prototype.convertDalSegno,
    "D.S. al Fine": _Converter.prototype.convertDalSegno,
    "D.S. al 1st End.": _Converter.prototype.convertDalSegno,
    "D.S. al 2nd End.": _Converter.prototype.convertDalSegno,
    "D.S. al 3rd End.": _Converter.prototype.convertDalSegno,
    "Fine": _Converter.prototype.convertFine,
    "3x": _Converter.prototype.convertRepeatNx,
    "4x": _Converter.prototype.convertRepeatNx,
    "5x": _Converter.prototype.convertRepeatNx,
    "6x": _Converter.prototype.convertRepeatNx,
    "7x": _Converter.prototype.convertRepeatNx,
    "8x": _Converter.prototype.convertRepeatNx
  };
  static convert(song, options = {}) {
    const realOptions = Object.assign({}, this.defaultOptions, options);
    return new _Converter(song, realOptions).convert();
  }
  constructor(song, options) {
    this.song = song;
    this.options = options;
    this.time = { beats: 4, beatType: 4 };
    this.fifths = null;
    this.measure = null;
    this.barRepeat = 0;
    this.codas = [];
    this.repeats = 0;
    this.emptyCells = 0;
    this.emptyCellNewSystem = false;
    this.cellWidth = (this.options.pageWidth - 2 * this.options.pageMargin) / 16;
    this.parseChord = chordParserFactory({ "altIntervals": [
      "b5",
      "b9"
    ] });
    this.renderChord = chordRendererFactory({
      useShortNamings: true,
      printer: "raw"
    });
  }
  convert() {
    return import_jstoxml.default.toXML(this.convertSong(), {
      header: `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML ${MUSICXML_VERSION} Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
      `.trim(),
      indent: "  "
    });
  }
  convertSong() {
    return {
      _name: "score-partwise",
      _attrs: { "version": MUSICXML_VERSION },
      _content: [{
        "work": {
          "work-title": this.song.title
        }
      }, {
        "identification": [{
          _name: "creator",
          _attrs: { "type": "composer" },
          _content: this.song.composer
        }, {
          "encoding": [{
            "software": `@infojunkie/ireal-musicxml ${Version.version}`
          }, { ...this.options.date && {
            "encoding-date": _Converter.convertDate(/* @__PURE__ */ new Date())
          } }, {
            _name: "supports",
            _attrs: { "element": "accidental", "type": "no" }
          }, {
            _name: "supports",
            _attrs: { "element": "transpose", "type": "no" }
          }, {
            _name: "supports",
            _attrs: { "attribute": "new-page", "element": "print", "type": "yes", "value": "yes" }
          }, {
            _name: "supports",
            _attrs: { "attribute": "new-system", "element": "print", "type": "yes", "value": "yes" }
          }]
        }]
      }, {
        "defaults": {
          "scaling": {
            "millimeters": SCALING_MM,
            "tenths": SCALING_TENTHS
          },
          "page-layout": {
            "page-height": _Converter._mmToTenths(this.options.pageHeight),
            "page-width": _Converter._mmToTenths(this.options.pageWidth),
            "page-margins": {
              "left-margin": _Converter._mmToTenths(this.options.pageMargin, 4),
              "right-margin": _Converter._mmToTenths(this.options.pageMargin, 4),
              "top-margin": _Converter._mmToTenths(this.options.pageMargin, 4),
              "bottom-margin": _Converter._mmToTenths(this.options.pageMargin, 4)
            }
          }
        }
      }, {
        "part-list": {
          _name: "score-part",
          _attrs: { "id": "P1" },
          _content: {
            _name: "part-name",
            _attrs: { "print-object": "no" },
            _content: "Lead Sheet"
          }
        }
      }, {
        _name: "part",
        _attrs: { "id": "P1" },
        _content: this.convertMeasures()
      }]
    };
  }
  // Date in yyyy-mm-dd
  // https://stackoverflow.com/a/50130338/209184
  static convertDate(date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 6e4).toISOString().split("T")[0];
  }
  static Measure = class {
    constructor(number) {
      this.body = {
        _name: "measure",
        _attrs: { "number": number },
        _content: []
      };
      this.attributes = [];
      this.chords = [];
      this.barlines = [];
      this.barEnding = null;
    }
    number() {
      return this.body["_attrs"]["number"];
    }
    assemble() {
      if (this.attributes.length) {
        this.body["_content"].push({
          "attributes": _Converter.reorderSequence(this, this.attributes, _Converter.sequenceAttributes)
        });
      }
      this.chords.forEach((chord) => {
        this.body["_content"].push({
          "harmony": chord.harmony
        }, ...chord.notes.map((note) => {
          return {
            "note": note
          };
        }));
      });
      this.barlines[0]["_content"] = _Converter.reorderSequence(this, this.barlines[0]["_content"], _Converter.sequenceBarline);
      this.body["_content"].splice(1, 0, this.barlines[0]);
      this.barlines[1]["_content"] = _Converter.reorderSequence(this, this.barlines[1]["_content"], _Converter.sequenceBarline);
      this.body["_content"].push(this.barlines[1]);
      return this.body;
    }
  };
  static Chord = class {
    constructor(harmony, notes, ireal) {
      this.harmony = harmony;
      this.notes = notes;
      this.ireal = ireal;
      this.spaces = 0;
      this.fermata = false;
    }
  };
  convertMeasures() {
    const isNewSystem = (cellIndex) => cellIndex > 0 && cellIndex % 16 === 0;
    const measures = this.song.cells.reduce((measures2, cell, cellIndex) => {
      if (cell.bars.match(/\(|\{|\[/) || !this.measure && (cell.chord || cell.annots.length || cell.comments.length)) {
        if (this.measure) {
          this._log(LogLevel.Warn, `Starting a new measure over existing measure. Closing current measure first.`);
          this.measure.barlines.push(this.convertBarline("", "right"));
          if (this.adjustChordsDuration(this.measure)) {
            measures2.push(this.measure);
          }
        }
        this.measure = new _Converter.Measure(measures2.length + 1, this.options);
        if (!measures2.length) {
          this.measure.attributes.push({
            "divisions": this.options.divisions
          }, {
            _name: "clef",
            _attrs: [{ "print-object": this.options.clef ? "yes" : "no" }],
            _content: [{
              "sign": "G"
            }, {
              "line": 2
            }]
          }, {
            "staff-details": {
              "staff-lines": 0
            }
          }, {
            "measure-style": [{
              _name: "slash",
              _attrs: { "type": "start", "use-stems": this.options.notation === "rhythmic" ? "yes" : "no" }
            }]
          }, this.convertKey());
          if (this.song.bpm) {
            this.measure.body["_content"].push(this.convertTempo(this.song.bpm));
          }
          this.measure.body["_content"].push(this.convertStyleAndGroove(this.song.style, this.song.groove));
        }
        this.measure.barlines.push(this.convertBarline(cell.bars, "left"));
        if (this.barRepeat) {
          this.measure.chords = [...measures2[measures2.length - this.barRepeat - 1].chords];
        }
      }
      if (!this.measure) {
        if (cell.chord || cell.annots.length || cell.comments.length || cell.bars && cell.bars !== ")") {
          this._log(LogLevel.Warn, `Found non-empty orphan cell ${JSON.stringify(cell)}`, measures2[measures2.length - 1]);
        }
        this.emptyCells++;
        if (isNewSystem(cellIndex)) {
          this.emptyCellNewSystem = true;
        }
        return measures2;
      }
      if (isNewSystem(cellIndex) || this.emptyCellNewSystem) {
        this.measure.body["_content"].splice(0, 0, {
          _name: "print",
          _attrs: { "new-system": "yes" },
          _content: { ...this.emptyCellNewSystem && {
            "system-layout": {
              "system-margins": [{
                "left-margin": _Converter._mmToTenths(this.cellWidth * this.emptyCells)
              }, {
                "right-margin": "0.00"
              }]
            }
          } }
        });
      }
      if (!this.emptyCellNewSystem && this.emptyCells > 0) {
        if (this.measure.body["_content"][0]?.["_name"] === "print" && this.measure.body["_content"][0]["_attrs"]?.["new-system"] === "yes") {
          measures2[measures2.length - 1].body["_content"].splice(0, 0, {
            _name: "print",
            _content: {
              "system-layout": {
                "system-margins": [{
                  "left-margin": "0.00"
                }, {
                  "right-margin": _Converter._mmToTenths(this.cellWidth * this.emptyCells)
                }]
              }
            }
          });
        } else {
          this.measure.body["_content"].splice(0, 0, {
            _name: "print",
            _content: {
              "measure-layout": {
                "measure-distance": _Converter._mmToTenths(this.cellWidth * this.emptyCells)
              }
            }
          });
        }
      }
      this.emptyCellNewSystem = false;
      this.emptyCells = 0;
      if (cell.chord) {
        switch (cell.chord.note) {
          case "x": {
            this.barRepeat = 1;
            this.measure.chords = [...measures2[measures2.length - this.barRepeat].chords];
            break;
          }
          case "r": {
            this.barRepeat = 2;
            this.measure.chords = [...measures2[measures2.length - this.barRepeat].chords];
            break;
          }
          case "p":
            if (this.measure.chords.length) {
              this.measure.chords[this.measure.chords.length - 1].spaces++;
              break;
            }
          // Fall into case 'W'.
          case "W": {
            let target = this.measure;
            if (!target.chords.length) {
              target = measures2.slice().reverse().find((m) => m.chords.length);
              if (!target) {
                this._log(LogLevel.Error, `Cannot find any measure with chords prior to ${JSON.stringify(cell.chord)}`);
              }
            }
            if (target) {
              const chord = target.chords[target.chords.length - 1].ireal;
              chord.over = cell.chord.over;
              chord.alternate = cell.chord.alternate;
              this.measure.chords.push(this.convertChord(chord));
            }
            break;
          }
          case " ": {
            this._log(LogLevel.Warn, `Unhandled empty/alternate chord ${JSON.stringify(cell.chord)}`);
            break;
          }
          default: {
            this.measure.chords.push(this.convertChord(cell.chord));
          }
        }
      } else if (!this.barRepeat) {
        if (this.measure.chords.length) {
          this.measure.chords[this.measure.chords.length - 1].spaces++;
        }
      }
      cell.annots.forEach((annot) => {
        switch (annot[0]) {
          case "*": {
            const section = annot.slice(1);
            this.measure.body["_content"].push(this.convertSection(section));
            break;
          }
          case "T": {
            const time = annot.slice(1);
            this.measure.attributes.push(this.convertTime(time));
            break;
          }
          case "S": {
            this.measure.body["_content"].push(this.convertSegno());
            break;
          }
          case "N": {
            let ending = parseInt(annot.slice(1));
            if (ending < 1) {
              const target = measures2.slice().reverse().find((m) => !!m.barEnding);
              ending = target?.barEnding ?? 0 + 1;
            }
            this.measure.barlines[0]["_content"].push(this.convertEnding(ending, "start"));
            if (ending > 1) {
              measures2[measures2.length - 1].barlines[1]["_content"].push(this.convertEnding(ending - 1, "stop"));
              const target = measures2.slice().reverse().find((m) => m.barEnding === ending - 1);
              if (!target) {
                this._log(LogLevel.Error, `Cannot find ending ${ending - 1} in right barline of any measure`);
              } else {
                const index = target.barlines[1]["_content"].findIndex((b) => !!b && b["_name"] === "ending");
                if (index === -1) {
                  this._log(LogLevel.Error, `Cannot find ending ${ending - 1} in right barline`, target);
                }
                delete target.barlines[1]["_content"][index];
              }
            }
            this.measure.barEnding = ending;
            break;
          }
          case "Q": {
            this.measure.body["_content"].push(this.convertToCoda());
            this.codas.push(this.measure);
            break;
          }
          // Ignore small and large chord renderings.
          case "l":
          case "s":
            break;
          case "f": {
            this.measure.chords[this.measure.chords.length - 1].fermata = true;
            break;
          }
          case "U": {
            this.measure.body["_content"].push(this.convertFine("END"));
            break;
          }
          default:
            this._log(LogLevel.Warn, `Unhandled annotation "${annot}"`);
        }
      });
      cell.comments.map((c) => c.trim()).forEach((comment) => {
        const repeatFn = this._map(_Converter.mapRepeats, comment);
        if (repeatFn) {
          this.measure.body["_content"].push(repeatFn.call(this, comment));
        } else {
          this.measure.body["_content"].push(this.convertComment(comment));
        }
      });
      if (cell.bars.match(/\)|\}|\]|Z/) && this.measure.chords.length) {
        this.measure.barlines.push(this.convertBarline(cell.bars, "right"));
        if (this.measure.barEnding) {
          this.measure.barlines[1]["_content"].push(this.convertEnding(this.measure.barEnding, "discontinue"));
        }
        if (this.adjustChordsDuration(this.measure)) {
          measures2.push(this.measure);
        }
        this.measure = null;
        if (this.barRepeat) this.barRepeat--;
      }
      return measures2;
    }, []);
    const remainingCells = this.song.cells.length % 16 - this.emptyCells;
    if (remainingCells > 0 && measures.length > 0) {
      measures[measures.length - 1].body["_content"].splice(0, 0, {
        _name: "print",
        _content: {
          "system-layout": {
            "system-margins": [{
              "left-margin": "0.00"
            }, {
              "right-margin": _Converter._mmToTenths(this.cellWidth * remainingCells)
            }]
          }
        }
      });
    }
    if (this.codas.length) {
      const target = this.codas[this.codas.length - 1];
      const direction = target.body["_content"].findIndex(
        (d) => d["_name"] === "direction" && Array.isArray(d["_content"]) && d["_content"].some(
          (s) => s["_name"] === "sound" && Object.keys(s["_attrs"]).includes("tocoda")
        )
      );
      if (direction === -1) {
        this._log(LogLevel.Warn, `Cannot find sound direction`, target);
      }
      target.body["_content"][direction] = this.convertCoda();
    }
    return measures.map((measure) => measure.assemble());
  }
  // Fix order of elements according to sequence as specified by an xs:sequence.
  // @param {array<element>} elements - Array of elements to sort.
  // @param {array<string>} sequence - Array of element names in order of xs:sequence.
  // @return {array<element>} Ordered array of elements.
  static reorderSequence(measure, elements, sequence) {
    return elements.filter((a) => Object.keys(a).length).sort((a1, a2) => {
      let k1 = Object.keys(a1)[0];
      if (k1 === "_name") k1 = a1[k1];
      let k2 = Object.keys(a2)[0];
      if (k2 === "_name") k2 = a2[k2];
      const i1 = sequence.indexOf(k1);
      const i2 = sequence.indexOf(k2);
      if (i1 === -1) {
        this._log(LogLevel.Warn, `Unrecognized element "${k1}"`, measure);
      }
      if (i2 === -1) {
        this._log(LogLevel.Warn, `Unrecognized element "${k2}"`, measure);
      }
      return i1 - i2;
    });
  }
  convertRepeatNx(comment) {
    let repeats = null;
    if (null !== (repeats = comment.match(/(\d+)x/))) {
      this.repeats = repeats[1];
    }
  }
  convertFine(comment) {
    return {
      _name: "direction",
      _attrs: { "placement": "below" },
      _content: [{
        "direction-type": {
          "words": comment
        }
      }, {
        _name: "sound",
        _attrs: { "fine": "yes" }
      }]
    };
  }
  convertDaCapo(comment) {
    return {
      _name: "direction",
      _attrs: { "placement": "below" },
      _content: [{
        "direction-type": {
          "words": comment
        }
      }, {
        _name: "sound",
        _attrs: { "dacapo": "yes" }
      }]
    };
  }
  convertDalSegno(comment) {
    return {
      _name: "direction",
      _attrs: { "placement": "below" },
      _content: [{
        "direction-type": {
          "words": comment
        }
      }, {
        _name: "sound",
        _attrs: { "dalsegno": "yes" }
      }]
    };
  }
  convertComment(comment) {
    return {
      _name: "direction",
      _attrs: { "placement": comment[0] === "*" ? "above" : "below" },
      _content: {
        "direction-type": {
          "words": comment[0] === "*" ? comment.slice(3) : comment
        }
      }
    };
  }
  convertEnding(ending, type) {
    return {
      _name: "ending",
      _attrs: { "number": ending, "type": type },
      _content: `${ending}.`
    };
  }
  convertBarline(bars, location) {
    let style = "regular";
    let repeat = null;
    if (bars.match(/\[|\]/)) {
      style = "light-light";
    } else if (bars.match(/Z/)) {
      style = "light-heavy";
    } else if (bars.match(/\{|\}/)) {
      style = location === "left" ? "heavy-light" : "light-heavy";
      repeat = location === "left" ? "forward" : "backward";
    }
    if (repeat === "forward") {
      this.repeats = 2;
    }
    return {
      _name: "barline",
      _attrs: { "location": location },
      _content: [{
        "bar-style": style
      }, { ...repeat && {
        _name: "repeat",
        _attrs: { "direction": repeat, ...repeat === "backward" && { "times": this.repeats } }
      } }]
    };
  }
  convertSection(section) {
    if (section === "i") section = "Intro";
    return {
      _name: "direction",
      _attrs: { "placement": "above" },
      _content: {
        "direction-type": {
          "rehearsal": section
        }
      }
    };
  }
  convertSegno() {
    return {
      _name: "direction",
      _attrs: { "placement": "above" },
      _content: [{
        "direction-type": {
          _name: "segno"
        }
      }, {
        _name: "sound",
        _attrs: { "segno": "segno" }
      }]
    };
  }
  convertCoda() {
    return {
      _name: "direction",
      _attrs: { "placement": "above" },
      _content: [{
        "direction-type": {
          "_name": "coda"
        }
      }, {
        _name: "sound",
        _attrs: { "coda": "coda" }
        // TODO: We assume a single coda
      }]
    };
  }
  convertToCoda() {
    return {
      _name: "direction",
      _attrs: { "placement": "above" },
      _content: [{
        "direction-type": {
          "words": "To Coda"
        }
      }, {
        _name: "sound",
        _attrs: { "tocoda": "coda" }
        // TODO: We assume a single coda
      }]
    };
  }
  convertTempo(bpm) {
    return {
      _name: "direction",
      _attrs: { "placement": "above" },
      _content: [{
        "direction-type": [{
          _name: "metronome",
          _attrs: { "parentheses": "no" },
          _content: [{
            "beat-unit": this.calculateChordDuration(1)[0].type
          }, {
            "per-minute": bpm
          }]
        }]
      }, {
        _name: "sound",
        _attrs: { "tempo": bpm }
      }]
    };
  }
  convertTime(time) {
    let beats = parseInt(time[0]);
    let beatType = parseInt(time[1]);
    if (time === "12") {
      beats = 12;
      beatType = 8;
    }
    this.time = { beats, beatType };
    return {
      "time": [{
        "beats": beats
      }, {
        "beat-type": beatType
      }]
    };
  }
  adjustChordsDuration(measure) {
    if (measure.chords.length > this.time.beats) {
      this._log(LogLevel.Error, `Too many chords (${measure.chords.length} out of ${this.time.beats})`, measure);
      return true;
    }
    let beats = measure.chords.reduce((beats2, chord) => beats2 + 1 + chord.spaces, 0);
    if (!beats) {
      this._log(LogLevel.Warn, `No chord found. Skipping current measure.`, measure);
      return false;
    }
    if (beats > this.time.beats) {
      let chordIndex = 0;
      while (beats > this.time.beats) {
        if (measure.chords[chordIndex].spaces > 0) {
          measure.chords[chordIndex].spaces--;
          beats--;
        }
        chordIndex = (chordIndex + 1) % measure.chords.length;
      }
    } else {
      let chordIndex = 0;
      while (beats < this.time.beats) {
        measure.chords[chordIndex].spaces++;
        beats++;
        chordIndex = (chordIndex + 1) % measure.chords.length;
      }
    }
    measure.chords = measure.chords.map((chord) => {
      chord.notes = this.calculateChordDuration(1 + chord.spaces).map(
        (duration, i, ds) => this.convertChordNote(
          duration,
          i === ds.length - 1 ? chord.fermata : false,
          // Possible fermata on last chord note only
          this.options.notation === "rhythmic" && ds.length > 1 ? i > 0 ? "stop" : "start" : null
          // Possible tie in case of rhythmic notation
        )
      );
      return chord;
    });
    return true;
  }
  calculateChordDuration(beats) {
    const mapDuration = {
      "1": [{ t: "eighth", d: 0, b: 1 }],
      "2": [{ t: "quarter", d: 0, b: 2 }],
      "3": [{ t: "quarter", d: 1, b: 3 }],
      "4": [{ t: "half", d: 0, b: 4 }],
      "5": [{ t: "quarter", d: 1, b: 3 }, { t: "quarter", d: 0, b: 2 }],
      "6": [{ t: "half", d: 1, b: 6 }],
      "7": [{ t: "half", d: 2, b: 7 }],
      "8": [{ t: "whole", d: 0, b: 8 }],
      "9": [{ t: "half", d: 1, b: 6 }, { t: "quarter", d: 1, b: 3 }],
      "10": [{ t: "half", d: 1, b: 6 }, { t: "half", d: 0, b: 4 }],
      "11": [{ t: "half", d: 2, b: 7 }, { t: "half", d: 0, b: 4 }],
      "12": [{ t: "whole", d: 1, b: 12 }],
      "13": [{ t: "half", d: 2, b: 7 }, { t: "half", d: 1, b: 6 }],
      "14": [{ t: "whole", d: 2, b: 14 }],
      "15": [{ t: "whole", d: 0, b: 8 }, { t: "half", d: 2, b: 7 }]
    };
    if (this.options.notation === "slash") {
      const index = 1 * 8 / this.time.beatType;
      return Array(beats).fill(
        this._map(mapDuration, index, [], `Unexpected beat count 1 for time signature ${this.time.beats}/${this.time.beatType}`).map((duration) => {
          return {
            duration: duration.b * this.options.divisions / 2,
            type: duration.t,
            dots: duration.d
          };
        })[0]
        // We're sure to get only one entry in this case.
      );
    } else {
      const index = beats * 8 / this.time.beatType;
      return this._map(mapDuration, index, [], `Unexpected beat count ${beats} for time signature ${this.time.beats}/${this.time.beatType}`).map((duration) => {
        return {
          duration: duration.b * this.options.divisions / 2,
          type: duration.t,
          dots: duration.d
        };
      });
    }
  }
  convertChordNote(duration, fermata = false, tie = null) {
    const altered = _Converter.mapFifthsToAlters[this.fifths >= 0 ? "sharp" : "flat"].slice(0, Math.abs(this.fifths));
    const noteType = {
      _name: "pitch",
      _content: [{
        "step": this.options.step
      }, {
        "alter": altered.includes(this.options.step) ? this.fifths > 0 ? 1 : -1 : 0
      }, {
        "octave": this.options.octave
      }]
    };
    const notations = [];
    if (fermata) {
      notations.push({ _name: "fermata" });
    }
    if (tie) {
      notations.push({ _name: "tied", _attrs: { "type": tie } });
    }
    return _Converter.reorderSequence(this.measure, [noteType, {
      _name: "cue"
    }, {
      _name: "notehead",
      _content: this.options.notehead,
      _attrs: [{ "font-size": this.options.noteheadSize }]
    }, {
      "duration": duration.duration
    }, {
      "voice": 1
    }, {
      _name: "type",
      _attrs: { "size": "full" },
      _content: duration.type
    }, { ...notations.length && {
      "notations": _Converter.reorderSequence(this.measure, notations, _Converter.sequenceNotations)
    } }].concat(Array(duration.dots).fill({ _name: "dot" })), _Converter.sequenceNote);
  }
  convertChordDegree(value, type, alter) {
    return {
      _name: "degree",
      _attrs: { "print-object": "no" },
      _content: [{
        "degree-value": value
      }, {
        "degree-alter": alter
      }, {
        "degree-type": type
      }]
    };
  }
  convertChordSymbol(chord) {
    const parsedChord = this.renderChord(this.parseChord(`${chord.note}${chord.modifiers}`));
    if (!parsedChord) {
      this._log(LogLevel.Warn, `Unrecognized chord "${chord.note}${chord.modifiers}"`);
      return { rootStep: null, rootAlter: null, chordKind: null, chordDegrees: [], chordText: null };
    }
    const rootStep = parsedChord.input.rootNote[0];
    const rootAlter = this._map(_Converter.mapAlter, parsedChord.input.rootNote[1] || null, null, `Unrecognized accidental in chord "${parsedChord.input.rootNote}"`);
    const chordText = parsedChord.formatted.descriptor + parsedChord.formatted.chordChanges.join("");
    const mapKind = {
      "major": "major",
      "major6": "major-sixth",
      "major7": "major-seventh",
      "dominant7": "dominant",
      "minor": "minor",
      "minor6": "minor-sixth",
      "minor7": "minor-seventh",
      "minorMajor7": "major-minor",
      "augmented": "augmented",
      "diminished": "diminished",
      "diminished7": "diminished-seventh",
      "power": "power"
    };
    let chordKind = this._map(mapKind, parsedChord.normalized.quality, "", `Unrecognized chord quality "${parsedChord.normalized.quality}"`);
    if (parsedChord.normalized.extensions.length) {
      const extension = Math.max(...parsedChord.normalized.extensions.map((e) => parseInt(e))).toString();
      const mapExtensionKind = {
        "9": "-ninth",
        "11": "-11th",
        "13": "-13th"
      };
      chordKind = chordKind.split("-")[0] + this._map(mapExtensionKind, extension, "", `Unhandled extension ${extension}`);
      if (chordKind === "dominant-11th") {
        parsedChord.normalized.isSuspended = false;
      }
    }
    [
      { intervals: ["1", "4", "5"], kind: "suspended-fourth", strict: true },
      { intervals: ["1", "5", "9"], kind: "suspended-second", strict: true },
      { intervals: ["1", "b3", "b5", "b7"], kind: "half-diminished", strict: true },
      { intervals: ["1", "3", "#5", "b7"], kind: "augmented-seventh", strict: false }
    ].some((chord2) => {
      if ((!chord2.strict || parsedChord.normalized.intervals.length === chord2.intervals.length) && chord2.intervals.every((s, i) => s === parsedChord.normalized.intervals[i])) {
        chordKind = chord2.kind;
        chord2.intervals.forEach((i) => {
          parsedChord.normalized.alterations = parsedChord.normalized.alterations.filter((p) => p === i);
          parsedChord.normalized.adds = parsedChord.normalized.adds.filter((p) => p === i);
          parsedChord.normalized.omits = parsedChord.normalized.omits.filter((p) => p === i);
        });
        parsedChord.normalized.intervals.forEach((i) => {
          if (!chord2.intervals.includes(i)) {
            parsedChord.normalized.adds.push(i);
          }
        });
        return true;
      }
    });
    const chordDegrees = [];
    if (parsedChord.normalized.isSuspended && !chordKind.includes("suspended")) {
      parsedChord.normalized.adds.push("4");
      if (!parsedChord.normalized.adds.includes("3")) {
        parsedChord.normalized.omits.push("3");
      }
    }
    parsedChord.normalized.alterations.forEach((alteration) => {
      const degree = alteration.slice(1);
      chordDegrees.push(
        this.convertChordDegree(
          degree,
          degree === "5" || parsedChord.normalized.extensions.includes(degree) ? "alter" : "add",
          this._map(_Converter.mapAlter, alteration[0], 0, `Unrecognized alter symbol in "${alteration}"`)
        )
      );
    });
    parsedChord.normalized.adds.forEach((add) => {
      const alteration = Object.keys(_Converter.mapAlter).includes(add[0]) ? add[0] : null;
      const degree = alteration ? add.slice(1) : add;
      chordDegrees.push(
        this.convertChordDegree(degree, "add", this._map(_Converter.mapAlter, alteration, 0, `Unrecognized alter symbol in "${add}"`))
      );
    });
    parsedChord.normalized.omits.forEach((omit) => {
      const alteration = Object.keys(_Converter.mapAlter).includes(omit[0]) ? omit[0] : null;
      const degree = alteration ? omit.slice(1) : omit;
      chordDegrees.push(
        this.convertChordDegree(degree, "subtract", this._map(_Converter.mapAlter, alteration, 0, `Unrecognized alter symbol in "${omit}"`))
      );
    });
    return { rootStep, rootAlter, chordKind, chordDegrees, chordText };
  }
  convertChord(chord) {
    let harmony = null;
    if (chord.note === "n") {
      harmony = [{
        "root": [{
          _name: "root-step",
          _attrs: { "text": "" },
          _content: this.options.step
        }]
      }, {
        _name: "kind",
        _attrs: { "text": "N.C." },
        _content: "none"
      }];
    } else {
      const { rootStep, rootAlter, chordKind, chordDegrees, chordText } = this.convertChordSymbol(chord);
      const bass = !chord.over ? null : [{
        "bass-step": chord.over.note[0]
      }, { ...chord.over.note[1] && {
        "bass-alter": this._map(_Converter.mapAlter, chord.over.note[1], null, `Unrecognized accidental in bass note "${chord.over.note}"`)
      } }];
      harmony = [{
        "root": [{
          "root-step": rootStep
        }, { ...rootAlter && {
          // Don't generate the root-alter entry if rootAlter is blank
          "root-alter": rootAlter
        } }]
      }, {
        _name: "kind",
        _attrs: { "text": chordText, "use-symbols": "no" },
        _content: chordKind
      }, { ...bass && {
        "bass": bass
      } }].concat(chordDegrees);
    }
    if (chord.alternate) {
      this._log(LogLevel.Warn, `Unhandled alternate chord ${JSON.stringify(chord.alternate)}`);
    }
    return new _Converter.Chord(
      harmony,
      // Initial chord duration is 1 beat
      this.calculateChordDuration(1).map((duration) => this.convertChordNote(duration)),
      chord
    );
  }
  convertKey() {
    const mapKeys = {
      // Major keys
      "C": 0,
      "G": 1,
      "D": 2,
      "A": 3,
      "E": 4,
      "B": 5,
      "F#": 6,
      "C#": 7,
      "F": -1,
      "Bb": -2,
      "Eb": -3,
      "Ab": -4,
      "Db": -5,
      "Gb": -6,
      "Cb": -7,
      // Minor keys
      "A-": 0,
      "E-": 1,
      "B-": 2,
      "F#-": 3,
      "C#-": 4,
      "G#-": 5,
      "D#-": 6,
      "A#-": 7,
      "D-": -1,
      "G-": -2,
      "C-": -3,
      "F-": -4,
      "Bb-": -5,
      "Eb-": -6,
      "Ab-": -7
    };
    this.fifths = this._map(mapKeys, this.song.key, 0, `Unrecognized key signature "${this.song.key}"`);
    return {
      _name: "key",
      _attrs: [{ "print-object": this.options.keySignature ? "yes" : "no" }],
      _content: [{
        "fifths": this.fifths
      }, {
        "mode": this.song.key.slice(-1) === "-" ? "minor" : "major"
      }]
    };
  }
  convertStyleAndGroove(style, groove) {
    return {
      _name: "direction",
      _attrs: { "placement": "above" },
      _content: [{
        "direction-type": [{
          "words": style
        }]
      }, {
        "sound": [{
          "play": [{
            _name: "other-play",
            _attrs: { "type": "groove" },
            _content: groove || style
          }]
        }]
      }]
    };
  }
  _log(logLevel, message, measure = this.measure) {
    if (logLevel < this.options.logLevel) return;
    const log = `[ireal-musicxml] [${this.song.title}${measure ? "#" + measure.number() : ""}] ${message}`;
    let method = "warn";
    switch (logLevel) {
      case LogLevel.Debug:
        method = "debug";
        break;
      case LogLevel.Info:
        method = "info";
        break;
      case LogLevel.Warn:
        method = "warn";
        break;
      case LogLevel.Error:
        method = "error";
        break;
    }
    console[method](log);
  }
  _map(map, key, defaultValue, message, logLevel = LogLevel.Warn, measure = this.measure) {
    if (!key) return defaultValue;
    if (!(key in map)) {
      if (message) {
        this._log(logLevel, message, measure);
      }
      return defaultValue || null;
    }
    return map[key];
  }
  static _mmToTenths(mm, decimals = 2) {
    const value = mm * SCALING_TENTHS / SCALING_MM;
    const power = Math.pow(10, decimals);
    return Math.round(value * power) / power;
  }
};

// src/lib/index.js
function convertSync(ireal, options = {}) {
  const playlist = new Playlist(ireal);
  playlist.songs.forEach((song) => {
    song.musicXml = Converter.convert(song, options);
  });
  return playlist;
}
async function convert(ireal, options = {}) {
  return new import_promise.default((resolve) => resolve(convertSync(ireal, options)));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Cell,
  Chord,
  Converter,
  LogLevel,
  Playlist,
  Song,
  Version,
  convert,
  convertSync
});
