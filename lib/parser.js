"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Song = exports.Chord = exports.Cell = exports.Playlist = void 0;

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * The parser is derived from
 * https://github.com/daumling/ireal-renderer
 * which is itself derived from
 * https://github.com/pianosnake/ireal-reader
 *
 * None of those modules did exactly what is needed here, namely return
 * a full structure that can be iterated downstream.
 */
var Playlist = function Playlist(data) {
  _classCallCheck(this, Playlist);

  var percentEncoded = /.*?irealb:\/\/([^"]*)/.exec(data);
  var percentDecoded = decodeURIComponent(percentEncoded[1]);
  var parts = percentDecoded.split("==="); //songs are separated by ===

  if (parts.length > 1) this.name = parts.pop(); //playlist name

  this.songs = parts.map(function (x) {
    return new Song(x);
  });
};

exports.Playlist = Playlist;

var Cell = function Cell() {
  _classCallCheck(this, Cell);

  this.annots = [];
  this.comments = [];
  this.bars = "";
  this.spacer = 0;
  this.chord = null;
};

exports.Cell = Cell;

var Chord = function Chord(note) {
  var modifiers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  var over = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var alternate = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

  _classCallCheck(this, Chord);

  this.note = note;
  this.modifiers = modifiers;
  this.over = over;
  this.alternate = alternate;
};

exports.Chord = Chord;

var Song = /*#__PURE__*/function () {
  function Song(data) {
    _classCallCheck(this, Song);

    this.cells = [];

    if (!data) {
      this.title = "";
      this.composer = "";
      this.style = "";
      this.key = "";
      this.transpose = 0;
      this.exStyle = "";
      this.bpm = 0;
      this.repeats = 0;
      this.music = "";
      return;
    }

    var parts = data.split("="); //split on one sign, remove the blanks

    var musicPrefix = "1r34LbKcu7";
    this.title = parts[0];
    this.composer = parts[1];
    this.style = parts[3];
    this.key = parts[4];
    this.transpose = +parts[5] || 0;
    this.exStyle = parts[7];
    this.bpm = +parts[8];
    this.repeats = +parts[9] || 3;
    parts = parts[6].split(musicPrefix);
    this.music = this.unscramble(parts[1]);
    this.cells = this.parse();
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


  _createClass(Song, [{
    key: "parse",

    /**
     * The parser cracks up the music string at song.music into several objects,
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
    value: function parse() {
      var text = this.music;
      var arr = [],
          headers = [],
          comments = [];
      var i;
      text = text.trimRight();

      while (text) {
        var found = false;

        for (i = 0; i < self.regExps.length; i++) {
          var match = self.regExps[i].exec(text);

          if (match) {
            found = true;

            if (match.length <= 2) {
              match = match[0];
              arr.push(match);
              text = text.substr(match.length);
            } else {
              // a chord
              arr.push(match);
              text = text.substr(match[0].length);
            }

            break;
          }
        }

        if (!found) {
          // ignore the comma separator
          if (text[0] !== ',') arr.push(text[0]);
          text = text.substr(1);
        }
      } // pass 2: extract prefixes, suffixes, annotations and comments


      var out = [];
      var obj = this.newCell(out);
      var prevobj = null;

      for (i = 0; i < arr.length; i++) {
        var cell = arr[i];

        if (cell instanceof Array) {
          obj.chord = this.parseChord(cell);
          cell = " ";
        }

        switch (cell[0]) {
          case '{': // open repeat

          case '[':
            // open double bar
            obj.bars = cell;
            cell = null;
            break;

          case '|':
            // single bar - close previous and open this
            if (prevobj) {
              prevobj.bars += ')';
              prevobj = null;
            }

            obj.bars = '(';
            cell = null;
            break;

          case ']': // close double bar

          case '}': // close repeat

          case 'Z':
            // ending double bar
            if (prevobj) {
              prevobj.bars += cell;
              prevobj = null;
            }

            cell = null;
            break;

          case 'n':
            // N.C.
            obj.chord = new Chord(cell[0]);
            break;

          case ',':
            cell = null;
            break;
          // separator

          case 'S': // segno

          case 'T': // time measurement

          case 'Q': // coda

          case 'N': // repeat

          case 'U': // END

          case 's': // small

          case 'l': // normal

          case 'f': // fermata

          case '*':
            obj.annots.push(cell);
            cell = null;
            break;

          case 'Y':
            obj.spacer++;
            cell = null;
            prevobj = null;
            break;

          case 'r':
          case 'x':
          case 'W':
            obj.chord = new Chord(cell);
            break;

          case '<':
            cell = cell.substr(1, cell.length - 2);
            obj.comments.push(cell);
            cell = null;
            break;

          default:
        }

        if (cell && i < arr.length - 1) {
          prevobj = obj; // so we can add any closing barline later

          obj = this.newCell(out);
        }
      }

      return out;
    }
  }, {
    key: "parseChord",
    value: function parseChord(match) {
      var note = match[1] || " ";
      var modifiers = match[2] || "";
      var comment = match[3] || "";
      if (comment) modifiers += comment.substr(1, comment.length - 2);
      var over = match[4] || "";
      if (over[0] === '/') over = over.substr(1);
      var alternate = match[5] || null;

      if (alternate) {
        match = self.chordRegex.exec(alternate.substr(1, alternate.length - 2));
        if (!match) alternate = null;else alternate = this.parseChord(match);
      } // empty cell?


      if (note === " " && !alternate && !over) return null;

      if (over) {
        var offset = over[1] === '#' || over[1] === 'b' ? 2 : 1;
        over = new Chord(over.substr(0, offset), over.substr(offset), null, null);
      } else over = null;

      modifiers = modifiers.replace(/b/g, "\u266D").replace(/#/g, "\u266F"); // convert to proper flat and sharp

      return new Chord(note, modifiers, over, alternate);
    }
  }, {
    key: "newCell",
    value: function newCell(arr) {
      var obj = new Cell();
      arr.push(obj);
      return obj;
    } //unscrambling hints from https://github.com/ironss/accompaniser/blob/master/irealb_parser.lua
    //strings are broken up in 50 character segments. each segment undergoes character substitution addressed by obfusc50()
    //note that a final part of length 50 or 51 is not scrambled.
    //finally need to substitute for Kcl, LZ and XyQ.

  }, {
    key: "unscramble",
    value: function unscramble(s) {
      var r = '',
          p;

      while (s.length > 51) {
        p = s.substring(0, 50);
        s = s.substring(50);
        r = r + this.obfusc50(p);
      }

      r = r + s; // now undo substitution obfuscation

      r = r.replace(/Kcl/g, '| x').replace(/LZ/g, ' |').replace(/XyQ/g, '   ');
      return r;
    }
  }, {
    key: "obfusc50",
    value: function obfusc50(s) {
      //the first 5 characters are switched with the last 5
      var newString = s.split('');

      for (var i = 0; i < 5; i++) {
        newString[49 - i] = s[i];
        newString[i] = s[49 - i];
      } //characters 10-24 are also switched


      for (var _i = 10; _i < 24; _i++) {
        newString[49 - _i] = s[_i];
        newString[_i] = s[49 - _i];
      }

      return newString.join('');
    }
  }]);

  return Song;
}();

exports.Song = Song;

_defineProperty(Song, "chordRegex", /^([A-G][b#]?)((?:sus|alt|add|[\+\-\^\dhob#])*)(\*.+?\*)*(\/[A-G][#b]?)?(\(.*?\))?/);

_defineProperty(Song, "chordRegex2", /^([ Wp])()()(\/[A-G][#b]?)?(\(.*?\))?/);

_defineProperty(Song, "regExps", [/^\*[a-zA-Z]/, // section
/^T\d\d/, // time measurement
/^N./, // repeat marker
/^<.*?>/, // comments
self.chordRegex, // chords
self.chordRegex2 // space, W and p (with optional alt chord)
]);