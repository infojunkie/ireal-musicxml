import jstoxml from 'jstoxml';
import ChordSymbol from 'chord-symbol';
const { chordParserFactory, chordRendererFactory } = ChordSymbol;
import { Version } from './version.js';

export class LogLevel {
  static Debug = 0;
  static Info = 1;
  static Warn = 2;
  static Error = 3;
  static None = 4;
}

const MUSICXML_VERSION = '4.0';
const SCALING_MM = 7;
const SCALING_TENTHS = 40;

export class Converter {
  static defaultOptions = {
    'divisions': 768, // same as used by iReal
    'notation': 'rhythmic', // 'rhythmic' for rhythmic notation, 'slash' for slash notation
    'step': 'B', // chord note
    'octave': 4, // chord note octave
    'notehead': 'slash', // chord note head
    'noteheadSize': 'large', // size of chord note head
    'date': true, // include encoding date
    'clef': false, // hide clef by default
    'keySignature': false, // hide key signature by default
    'pageWidth': 210, // mm (A4)
    'pageHeight': 297, // mm (A4)
    'pageMargin': 15, // mm
    'logLevel': LogLevel.Warn
  };

  static sequenceAttributes = [
    // Expected order of attribute elements.
    // https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/attributes/
    'divisions',
    'key',
    'time',
    'staves',
    'part-symbol',
    'instruments',
    'clef',
    'staff-details',
    'transpose',
    'directive',
    'measure-style'
  ];

  static sequenceNote = [
    // Expected order of note elements.
    // https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/note/
    'cue',
    'pitch',
    'rest',
    'unpitched',
    'duration',
    'tie',
    'voice',
    'type',
    'dot',
    'accidental',
    'time-modification',
    'stem',
    'notehead',
    'notehead-text',
    'staff',
    'beam',
    'notations',
    'lyric',
    'play'
  ];

  static sequenceNotations = [
    // Expected order of notations elements.
    // https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/notations/
    'accidental-mark',
    'arpeggiate',
    'articulations',
    'dynamics',
    'fermata',
    'glissando',
    'non-arpeggiate',
    'ornaments',
    'other-notation',
    'slide',
    'slur',
    'technical',
    'tied',
    'tuplet'
  ];

  static sequenceBarline = [
    // Expected order of barline elements.
    // https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/barline/
    'bar-style',
    'footnote',
    'level',
    'wavy-line',
    'segno',
    'coda',
    'fermata',
    'ending',
    'repeat'
  ];

  static mapAlter = {
    '#': 1,
    'b': -1
  };

  static mapFifthsToAlters = {
    'sharp': ['F', 'C', 'G', 'D', 'A', 'E', 'B'],
    'flat': ['B', 'E', 'A', 'D', 'G', 'C', 'F']
  };

  static mapRepeats = {
    "D.C. al Coda": Converter.prototype.convertDaCapo,
    "D.C. al Fine": Converter.prototype.convertDaCapo,
    "D.C. al 1st End.": Converter.prototype.convertDaCapo,
    "D.C. al 2nd End.": Converter.prototype.convertDaCapo,
    "D.C. al 3rd End.": Converter.prototype.convertDaCapo,
    "D.S. al Coda": Converter.prototype.convertDalSegno,
    "D.S. al Fine": Converter.prototype.convertDalSegno,
    "D.S. al 1st End.": Converter.prototype.convertDalSegno,
    "D.S. al 2nd End.": Converter.prototype.convertDalSegno,
    "D.S. al 3rd End.": Converter.prototype.convertDalSegno,
    "Fine": Converter.prototype.convertFine,
    "3x": Converter.prototype.convertRepeatNx,
    "4x": Converter.prototype.convertRepeatNx,
    "5x": Converter.prototype.convertRepeatNx,
    "6x": Converter.prototype.convertRepeatNx,
    "7x": Converter.prototype.convertRepeatNx,
    "8x": Converter.prototype.convertRepeatNx
  };

  static mapTime = {
    "24": { beats: 2, beatType: 4, beatUnit: 1 },
    "34": { beats: 3, beatType: 4, beatUnit: 0.5 },
    "44": { beats: 4, beatType: 4, beatUnit: 1 },
    "54": { beats: 5, beatType: 4, beatUnit: 1 },
    "64": { beats: 6, beatType: 4, beatUnit: 1 },
    "74": { beats: 7, beatType: 4, beatUnit: 1 },
    "38": { beats: 3, beatType: 8, beatUnit: 1 },
    "58": { beats: 5, beatType: 8, beatUnit: 1 },
    "68": { beats: 6, beatType: 8, beatUnit: 1 },
    "78": { beats: 7, beatType: 8, beatUnit: 1 },
    "98": { beats: 9, beatType: 8, beatUnit: 1 },
    "12": { beats: 12, beatType: 8, beatUnit: 3 },
    "22": { beats: 2, beatType: 2, beatUnit: 1 },
    "32": { beats: 3, beatType: 2, beatUnit: 0.5 },
  };

  static convert(song, options = {}) {
    const realOptions = Object.assign({}, this.defaultOptions, options);
    return new Converter(song, realOptions).convert();
  }

  constructor(song, options) {
    this.song = song;
    this.options = options;
    this.time = { beats: 4, beatType: 4, beatUnit: 1 };
    this.fifths = null; // key signature's degree of fifths
    this.measure = null; // current measure (of class Measure) being built
    this.barRepeat = 0; // current bar number for single- and double-bar repeats
    this.codas = []; // list of measures containing codas
    this.repeats = 0; // repeat count for closing repeat barline
    this.shortChord = false; // was 's' annotation encountered?
    this.emptyCells = 0; // consecutive empty cells
    this.emptyCellNewSystem = false; // did a new system occur in an empty cell?

    // In iRP, there are 16 cells per line.
    // The width in mm of a single cell depends on the page width and the margins.
    this.cellWidth = (this.options.pageWidth - (2 * this.options.pageMargin)) / 16;

    // chord-symbol.
    this.parseChord = chordParserFactory({ "altIntervals": [
      "b5",
      "b9"
    ]});
    this.renderChord = chordRendererFactory({
      useShortNamings: true,
      printer: 'raw'
    });
  }

  convert() {
    return jstoxml.toXML(this.convertSong(), {
      header: `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML ${MUSICXML_VERSION} Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
      `.trim(),
      indent: '  '
    });
  }

  convertSong() {
    return {
      _name: 'score-partwise',
      _attrs: { 'version': MUSICXML_VERSION },
      _content: [{
        'work': {
          'work-title': this.song.title
        }
      }, {
        'identification': [{
          _name: 'creator',
          _attrs: { 'type': 'composer' },
          _content: this.song.composer
        }, {
          'encoding': [{
            'software': `@infojunkie/ireal-musicxml ${Version.version}`
          }, { ...(this.options.date && {
            'encoding-date': Converter.convertDate(new Date())
          })}, {
            _name: 'supports',
            _attrs: { 'element': 'accidental', 'type': 'no' }
          }, {
            _name: 'supports',
            _attrs: { 'element': 'transpose', 'type': 'no' }
          }, {
            _name: 'supports',
            _attrs: { 'attribute': 'new-page', 'element': 'print', 'type': 'yes', 'value': 'yes' }
          }, {
            _name: 'supports',
            _attrs: { 'attribute': 'new-system', 'element': 'print', 'type': 'yes', 'value': 'yes' }
          }]
        }]
      }, {
        'defaults': {
          'scaling': {
            'millimeters': SCALING_MM,
            'tenths': SCALING_TENTHS
          },
          'page-layout': {
            'page-height': Converter._mmToTenths(this.options.pageHeight),
            'page-width': Converter._mmToTenths(this.options.pageWidth),
            'page-margins': {
              'left-margin': Converter._mmToTenths(this.options.pageMargin, 4),
              'right-margin': Converter._mmToTenths(this.options.pageMargin, 4),
              'top-margin': Converter._mmToTenths(this.options.pageMargin, 4),
              'bottom-margin': Converter._mmToTenths(this.options.pageMargin, 4)
            }
          }
        }
      }, {
        'part-list': {
          _name: 'score-part',
          _attrs: { 'id': 'P1' },
          _content: {
            _name: 'part-name',
            _attrs: { 'print-object': 'no' },
            _content: 'Lead Sheet'
          }
        }
      }, {
        _name: 'part',
        _attrs: { 'id': 'P1' },
        _content: this.convertMeasures()
      }]
    };
  }

  // Date in yyyy-mm-dd
  // https://stackoverflow.com/a/50130338/209184
  static convertDate(date) {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .split('T')[0];
  }

  static Measure = class {
    constructor(number) {
      this.body = {
        _name: 'measure',
        _attrs: { 'number': number },
        _content: []
      };
      this.attributes = [];
      this.chords = [];
      this.barlines = [];
      this.barEnding = null;
    }

    number() {
      return this.body['_attrs']['number'];
    }

    assemble() {
      // Attributes.
      if (this.attributes.length) {
        this.body['_content'].push({
          'attributes': Converter.reorderSequence(this, this.attributes, Converter.sequenceAttributes)
        });
      }

      // Chords.
      this.chords.forEach(chord => {
        this.body['_content'].push({
          'harmony': chord.harmony
        }, ...chord.notes.map(note => {
          return {
            'note': note
          };
        }));
      });

      // Barlines.
      this.barlines[0]['_content'] = Converter.reorderSequence(this, this.barlines[0]['_content'], Converter.sequenceBarline);
      this.body['_content'].splice(1, 0, this.barlines[0]);
      this.barlines[1]['_content'] = Converter.reorderSequence(this, this.barlines[1]['_content'], Converter.sequenceBarline);
      this.body['_content'].push(this.barlines[1]);

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
      this.short = false;
    }

    clone() {
      const chord = new Converter.Chord(
        structuredClone(this.harmony),
        structuredClone(this.notes),
        structuredClone(this.ireal)
      );
      chord.spaces = this.spaces;
      chord.fermata = this.fermata;
      chord.short = this.short;
      return chord;
    }

    beats() {
      return this.short ? 1 : 1 + this.spaces;
    }
  };

  convertMeasures() {
    // Are we starting a new system given the current cell index?
    const isNewSystem = cellIndex => cellIndex > 0 && cellIndex % 16 === 0;

    // Loop on cells.
    const measures = this.song.cells.reduce((measures, cell, cellIndex) => {
      // Start a new measure if needed.
      // This means either finding an opening barline or finding non-empty cells while we're not in any measure.
      if (cell.bars.match(/\(|\{|\[/) || (!this.measure && (cell.chord || cell.annots.length || cell.comments.length))) {
        if (this.measure) {
          this._log(LogLevel.Warn, `Starting a new measure over existing measure. Closing current measure first.`);
          this.measure.barlines.push(this.convertBarline('', 'right'));
          if (this.adjustChordsDuration(this.measure)) {
            measures.push(this.measure);
          }
        }
        this.measure = new Converter.Measure(measures.length+1, this.options);

        // Very first bar: add defaults.
        if (!measures.length) {
          this.measure.attributes.push({
            'divisions': this.options.divisions
          }, {
            _name: 'clef',
            _attrs: [{ 'print-object': this.options.clef ? 'yes' : 'no' }],
            _content: [{
              'sign': 'G'
            }, {
              'line': 2
            }]
          }, {
            'staff-details': {
              'staff-lines': 0
            }
          }, {
            'measure-style': [{
              _name: 'slash',
              _attrs: { 'type': 'start', 'use-stems': this.options.notation === 'rhythmic' ? 'yes' : 'no' }
            }]
          }, this.convertKey());

          // Add bpm if any.
          if (this.song.bpm) {
            this.measure.body['_content'].push(this.convertTempo(this.song.bpm));
          }

          // Add style and groove.
          this.measure.body['_content'].push(this.convertStyleAndGroove(this.song.style, this.song.groove));
        }

        // Add starting barline.
        this.measure.barlines.push(this.convertBarline(cell.bars, 'left', (isNewSystem(cellIndex) || this.emptyCellNewSystem) ? 'regular' : undefined));

        // If we're still repeating bars, copy the previous bar now.
        if (this.barRepeat) {
          this.measure.chords = measures[measures.length-this.barRepeat-1].chords.map(chord => chord.clone());
        }
      }

      // Short-circuit loop if no measure exists.
      // It can happen that `measure` is still blank in case of empty cells in iReal layout.
      // e.g. Girl From Ipanema in tests.
      if (!this.measure) {
        if (cell.chord || cell.annots.length || cell.comments.length || (cell.bars && cell.bars !== ')')) {
          this._log(LogLevel.Warn, `Found non-empty orphan cell ${JSON.stringify(cell)}`, measures[measures.length-1]);
        }

        // This is an empty cell between measures.
        // Count the consecutive empty cells because they will be converted to margins.
        // Also remember that a new system has occurred.
        this.emptyCells++;
        if (isNewSystem(cellIndex)) {
          this.emptyCellNewSystem = true;
        }

        return measures;
      }

      // Start a new system every 16 cells.
      if (isNewSystem(cellIndex) || this.emptyCellNewSystem) {
        this.measure.body['_content'].splice(0, 0, {
          _name: 'print',
          _attrs: { 'new-system': 'yes' },
          _content: { ...(this.emptyCellNewSystem && {
            'system-layout': {
              'system-margins': [{
                'left-margin': Converter._mmToTenths(this.cellWidth * this.emptyCells)
              }, {
                'right-margin': '0.00'
              }]
            }
          })}
        });
      }

      // If we accumulated empty cells but not at the start of the current system, then we adjust other distances.
      // There are 2 cases to handle:
      // - We're now in a fresh system: Add a right-margin to the previous measure.
      // - We're in the middle of a system: Add a measure-distance to the current measure.
      if (!this.emptyCellNewSystem && this.emptyCells > 0) {
        if (this.measure.body['_content'][0]?.['_name'] === 'print' && this.measure.body['_content'][0]['_attrs']?.['new-system'] === 'yes') {
          measures[measures.length-1].body['_content'].splice(0, 0, {
            _name: 'print',
            _content: {
              'system-layout': {
                'system-margins': [{
                  'left-margin': '0.00'
                }, {
                  'right-margin': Converter._mmToTenths(this.cellWidth * this.emptyCells)
                }]
              }
            }
          });
        }
        else {
          this.measure.body['_content'].splice(0, 0, {
            _name: 'print',
            _content: {
              'measure-layout': {
                'measure-distance': Converter._mmToTenths(this.cellWidth * this.emptyCells)
              }
            }
          });
        }
      }

      // Reset the empty cells.
      this.emptyCellNewSystem = false;
      this.emptyCells = 0;

      // Chords.
      if (cell.chord) {
        switch (cell.chord.note) {
          case 'x': {
            // Handle single bar repeat.
            this.barRepeat = 1;
            this.measure.chords = measures[measures.length-this.barRepeat].chords.map(chord => chord.clone());
            break;
          }
          case 'r': {
            // Handle double bar repeat.
            // We do this in 2 stages, because a blank measure occurs after 'r' (to keep the measure count correct)
            // Here, we copy the next-to-last measure and set the repeat flag.
            // The next opening measure will pick up the remaining measure.
            this.barRepeat = 2;
            this.measure.chords = measures[measures.length-this.barRepeat].chords.map(chord => chord.clone());
            break;
          }
          case 'p':
            // If slash does not occur as first chord, count it as a space.
            // Otherwise, handle it as 'W'.
            if (this.measure.chords.length) {
              this.measure.chords[this.measure.chords.length-1].spaces++;
              break;
            }
            // Fall into case 'W'.

          case 'W': {
            // Handle invisible root by copying previous chord.
            let target = this.measure;
            if (!target.chords.length) {
              target = measures.slice().reverse().find(m => m.chords.length);
              if (!target) {
                this._log(LogLevel.Error, `Cannot find any measure with chords prior to ${JSON.stringify(cell.chord)}`);
              }
            }
            if (target) {
              const chord = target.chords[target.chords.length-1].ireal;
              chord.over = cell.chord.over;
              chord.alternate = cell.chord.alternate;
              this.measure.chords.push(this.convertChord(chord));
            }
            break;
          }
          case ' ': {
            // TODO Handle alternate chord only.
            this._log(LogLevel.Warn, `Unhandled empty/alternate chord ${JSON.stringify(cell.chord)}`);
            break;
          }
          default: {
            // Process new chord.
            this.measure.chords.push(this.convertChord(cell.chord));
            this.measure.chords[this.measure.chords.length-1].short = this.shortChord;
          }
        }
      }
      else if (!this.barRepeat) {
        // There are 16 cells per row, regardless of time signature.
        // Barlines can occur anywhere and the iReal Pro player uses an unknown algorithm
        // to schedule the chords within a measure, using the empty cells as "hints" for scheduling.
        // https://technimo.helpshift.com/a/ireal-pro/?s=editor&f=chord-spacing-in-the-editor
        // https://technimo.helpshift.com/a/ireal-pro/?s=editor&f=how-do-i-fit-more-than-48-measures-into-one-chart
        //
        // Our approach to emulate the iReal Pro player is as follows:
        // 1. Whenever we find an empty cell, attach it to the previous chord (or discard it if there's no previous chord)
        // 2. At the end of the measure, adjust the chord durations based on existing empty cells across the measure
        if (this.measure.chords.length) {
          this.measure.chords[this.measure.chords.length-1].spaces++;
        }
      }

      // Other attributes.
      cell.annots.forEach(annot => {
        switch(annot[0]) {
          case '*': { // section
            const section = annot.slice(1);
            this.measure.body['_content'].push(this.convertSection(section));
            break;
          }
          case 'T': { // time
            const time = annot.slice(1);
            this.measure.attributes.push(this.convertTime(time));
            break;
          }
          case 'S': { // segno
            this.measure.body['_content'].push(this.convertSegno());
            break;
          }
          case 'N': { // ending
            // TODO This assumes a single ending at a time.
            let ending = parseInt(annot.slice(1));
            if (ending < 1) {
              // It can happen that the ending number comes as 0 from iRP.
              // In this case, we do a best effort of finding the previous ending and incrementing it.
              const target = measures.slice().reverse().find(m => !!m.barEnding);
              ending = target?.barEnding ?? 0 + 1;
            }
            this.measure.barlines[0]['_content'].push(this.convertEnding(ending, 'start'));
            // End the previous ending at the previous measure's right barline.
            // Also, remove the 'discontinue' ending from its starting measure since we found an end to it.
            if (ending > 1) {
              measures[measures.length-1].barlines[1]['_content'].push(this.convertEnding(ending-1, 'stop'));
              const target = measures.slice().reverse().find(m => m.barEnding === ending-1);
              if (!target) {
                this._log(LogLevel.Error, `Cannot find ending ${ending-1} in right barline of any measure`);
              }
              else {
                // The last result is the good one: remove the 'discontinue' ending.
                const index = target.barlines[1]['_content'].findIndex(b => !!b && b['_name'] === 'ending');
                if (index === -1) {
                  this._log(LogLevel.Error, `Cannot find ending ${ending-1} in right barline`, target);
                }
                delete target.barlines[1]['_content'][index];
              }
            }
            // We will add a 'discontinue' ending at this measure's right barline.
            this.measure.barEnding = ending;
            break;
          }
          case 'Q': { // coda
            // We add all codas as "tocoda" because we expect the last one to be the actual coda.
            // After all measures have been built, adjust the last coda.
            // https://irealpro.com/how-the-coda-symbol-works-in-ireal-pro/
            this.measure.body['_content'].push(this.convertToCoda());
            this.codas.push(this.measure);
            break;
          }

          // Short and long chord settings.
          // These will affect the calculation of chord durations.
          // Set the current chord size setting and remember it for subsequent chords.
          case 'l': {
            if (this.measure.chords.length) {
              this.measure.chords[this.measure.chords.length-1].short = false;
            }
            this.shortChord = false;
            break;
          }
          case 's': {
            if (this.measure.chords.length) {
              this.measure.chords[this.measure.chords.length-1].short = true;
            }
            this.shortChord = true;
            break;
          }

          case 'f': { // Fermata
            this.measure.chords[this.measure.chords.length-1].fermata = true;
            break;
          }

          case 'U': { // END, treated as Fine.
            this.measure.body['_content'].push(this.convertFine('END'));
            break;
          }

          default: this._log(LogLevel.Warn, `Unhandled annotation "${annot}"`);
        }
      });

      // Comments and repeats.
      // TODO Handle measure offset.
      // https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/offset/
      cell.comments.map(c => c.trim()).forEach(comment => {
        const repeatFn = this._map(Converter.mapRepeats, comment);
        if (repeatFn) {
          this.measure.body['_content'].push(repeatFn.call(this, comment));
        } else {
          this.measure.body['_content'].push(this.convertComment(comment));
        }
      });

      // Close and insert the measure if needed.
      // Ignore measures without any chords, they're probably empty spaces.
      if (cell.bars.match(/\)|\}|\]|Z/) && this.measure.chords.length) {
        // Add closing barline and ending if needed.
        this.measure.barlines.push(this.convertBarline(cell.bars, 'right'));
        if (this.measure.barEnding) {
          // In case of numbered repeats, end measure an open repeat by default  ┌──────
          //                                                                     │ 2.
          // It may be replaced later by a closing repeat  ┌───────────┐
          //                                               │ 2.        │
          this.measure.barlines[1]['_content'].push(this.convertEnding(this.measure.barEnding, 'discontinue'));
        }

        // Close out the measure.
        if (this.adjustChordsDuration(this.measure)) {
          measures.push(this.measure);
        }
        this.measure = null;
        if (this.barRepeat) this.barRepeat--;
      }

      return measures;
    }, []);

    // Adjust final right margin if needed.
    const remainingCells = this.song.cells.length % 16 - this.emptyCells;
    if (remainingCells > 0 && measures.length > 0) {
      measures[measures.length-1].body['_content'].splice(0, 0, {
        _name: 'print',
        _content: {
          'system-layout': {
            'system-margins': [{
              'left-margin': '0.00'
            }, {
              'right-margin': Converter._mmToTenths(this.cellWidth * remainingCells)
            }]
          }
        }
      });
    }

    // Adjust last coda if any.
    if (this.codas.length) {
      const target = this.codas[this.codas.length-1];
      const direction = target.body['_content'].findIndex(d =>
        d['_name'] === 'direction' &&
        Array.isArray(d['_content']) &&
        d['_content'].some(s =>
          s['_name'] === 'sound' &&
          Object.keys(s['_attrs']).includes('tocoda')
        )
      );
      if (direction === -1) {
        this._log(LogLevel.Warn, `Cannot find sound direction`, target);
      }
      target.body['_content'][direction] = this.convertCoda();
    }

    // `Measure.assemble()` puts all the parts in `Measure.body`.
    return measures.map(measure => measure.assemble());
  }

  // Fix order of elements according to sequence as specified by an xs:sequence.
  // @param {array<element>} elements - Array of elements to sort.
  // @param {array<string>} sequence - Array of element names in order of xs:sequence.
  // @return {array<element>} Ordered array of elements.
  static reorderSequence(measure, elements, sequence) {
    return elements.filter(a => Object.keys(a).length).sort((a1, a2) => {
      let k1 = Object.keys(a1)[0]; if (k1 === '_name') k1 = a1[k1];
      let k2 = Object.keys(a2)[0]; if (k2 === '_name') k2 = a2[k2];
      // TODO indexOf() needs to search every time. Make it faster with memoize?
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
      _name: 'direction',
      _attrs: { 'placement': 'below' },
      _content: [{
        'direction-type': {
          'words': comment
        }
      }, {
        _name: 'sound',
        _attrs: { 'fine': 'yes' }
      }]
    };
  }

  convertDaCapo(comment) {
    return {
      _name: 'direction',
      _attrs: { 'placement': 'below' },
      _content: [{
        'direction-type': {
          'words': comment
        }
      }, {
        _name: 'sound',
        _attrs: { 'dacapo': 'yes' }
      }]
    };
  }

  convertDalSegno(comment) {
    return {
      _name: 'direction',
      _attrs: { 'placement': 'below' },
      _content: [{
        'direction-type': {
          'words': comment
        }
      }, {
        _name: 'sound',
        _attrs: { 'dalsegno': 'yes' }
      }]
    };
  }

  convertComment(comment) {
    return {
      _name: 'direction',
      _attrs: { 'placement': comment[0] === '*' ? 'above' : 'below' },
      _content: {
        'direction-type': {
          'words': comment[0] === '*' ? comment.slice(3) : comment
        }
      }
    };
  }

  convertEnding(ending, type) {
    // TODO This assumes a single ending.
    return {
      _name: 'ending',
      _attrs: { 'number': ending, 'type': type },
      _content: `${ending}.`
    };
  }

  convertBarline(bars, location, forced = undefined) {
    let style = location === 'left' ? 'none' : 'regular';
    let repeat = null;
    if (bars.match(/\[|\]/)) {
      style = 'light-light';
    }
    else if (bars.match(/Z/)) {
      style = 'light-heavy';
    }
    else if (bars.match(/\{|\}/)) {
      style = location === 'left' ? 'heavy-light' : 'light-heavy';
      repeat = location === 'left' ? 'forward' : 'backward';
    }

    // Set the current repeat count to 2, which may be changed later if we find a repeat annotation.
    if (repeat === 'forward') {
      this.repeats = 2;
    }

    return {
      _name: 'barline',
      _attrs: { 'location': location },
      _content: [{
        'bar-style': forced ?? style
      }, { ...(repeat && {
        _name: 'repeat',
        _attrs: { 'direction': repeat, ...(repeat === 'backward' && { 'times': this.repeats }) }
      })}]
    };
  }

  convertSection(section) {
    if (section === 'i') section = 'Intro';
    return {
      _name: 'direction',
      _attrs: { 'placement': 'above' },
      _content: {
        'direction-type': {
          'rehearsal': section
        }
      }
    };
  }

  convertSegno() {
    return {
      _name: 'direction',
      _attrs: { 'placement': 'above' },
      _content: [{
        'direction-type': {
          _name: 'segno'
        }
      }, {
        _name: 'sound',
        _attrs: { 'segno': 'segno' }
      }]
    };
  }

  convertCoda() {
    return {
      _name: 'direction',
      _attrs: { 'placement': 'above' },
      _content: [{
        'direction-type': {
          '_name': 'coda'
        }
      }, {
        _name: 'sound',
        _attrs: { 'coda': 'coda' }  // TODO: We assume a single coda
      }]
    };
  }

  convertToCoda() {
    return {
      _name: 'direction',
      _attrs: { 'placement': 'above' },
      _content: [{
        'direction-type': {
          'words': 'To Coda'
        }
      }, {
        _name: 'sound',
        _attrs: { 'tocoda': 'coda' }  // TODO: We assume a single coda
      }]
    };
  }

  convertTempo(bpm) {
    return {
      _name: 'direction',
      _attrs: { 'placement': 'above' },
      _content: [{
        'direction-type': [{
          _name: 'metronome',
          _attrs: { 'parentheses': 'no' },
          _content: [{
            'beat-unit': this.calculateChordDuration(1)[0].type
          }, {
            'per-minute': bpm
          }]
        }]
      }, {
        _name: 'sound',
        _attrs: { 'tempo': bpm }
      }]
    };
  }

  convertTime(time) {
    this.time = this._map(
      Converter.mapTime, time, {
        beats: parseInt(time[0]), beatType: parseInt(time[1]), beatUnit: 1
      }, `Unexpected time signature ${time}`
    );
    return {
      'time': [{
        'beats': this.time.beats
      }, {
        'beat-type': this.time.beatType
      }]
    };
  }

  adjustChordsDuration(measure) {
    // Now that the measure is closed, we can adjust the chord durations, taking empty cells into consideration.
    // https://www.irealb.com/forums/showthread.php?25161-Using-empty-cells-to-control-chord-duration
    //
    // Rules:
    // - Minimum chord duration is 1 beat
    // => Each chord starts as 1 beat
    // => Short chords always remain as 1 beat
    // => Count of chords <= beats per measure
    // - Starting empty cells are discarded (already discarded during the cell loop)
    // - Each remaining empty cell counts as 1 beat (already counted during cell loop)
    // - Empty cell beats are added to their preceding chords (already added during the cell loop)
    // => Total chord durations <= beats per measure
    // - Remaining beats are distributed evenly among chords from first to last
    //
    if (measure.chords.length > this.time.beats) {
      this._log(LogLevel.Error, `Too many chords (${measure.chords.length} out of ${this.time.beats})`, measure);
      return true;
    }
    let beats = measure.chords.reduce((beats, chord) => beats + chord.beats() * this.time.beatUnit, 0);
    if (!beats) {
      this._log(LogLevel.Warn, `No chord found. Skipping current measure.`, measure);
      return false;
    }
    if (beats > this.time.beats) {
      // Reduce spaces.
      // We're guaranteed to end this loop because measure.chords.length <= this.time.beats
      let chordIndex = 0;
      while (beats > this.time.beats) {
        if (measure.chords[chordIndex].spaces > 0) {
          measure.chords[chordIndex].spaces--;
          beats -= this.time.beatUnit;
        }
        chordIndex = (chordIndex + 1) % measure.chords.length;
      }
    }
    else {
      // Distribute free beats among the chords, except for short chords.
      let chordIndex = 0;
      let hasBeatsChangedInACycle = false;
      while (beats < this.time.beats) {
        if (!measure.chords[chordIndex].short) {
          measure.chords[chordIndex].spaces++;
          beats += this.time.beatUnit;
          hasBeatsChangedInACycle = true;
        }
        chordIndex = (chordIndex + 1) % measure.chords.length;
        if (chordIndex === 0 && !hasBeatsChangedInACycle) {
          // We've made a complete cycle and beat count has not changed - break now.
          this._log(LogLevel.Warn, `Cannot add more beats to the current measure.`, measure);
          break;
        }
      }
    }

    // Adjust actual chord durations.
    measure.chords = measure.chords.map(chord => {
      chord.notes = this.calculateChordDuration(chord.beats() * this.time.beatUnit).map((duration, i, ds) =>
        this.convertChordNote(
          duration,
          i === ds.length - 1 ? chord.fermata : false, // Possible fermata on last chord note only
          this.options.notation === 'rhythmic' && ds.length > 1 ? (i > 0 ? 'stop' : 'start') : null // Possible tie in case of rhythmic notation
        )
      );
      return chord;
    });

    return true;
  }

  calculateChordDuration(beats) {
    // Lowest beat resolution is eighth-note (8).
    const mapDuration = {
      '1': [{ t: 'eighth', d: 0, b: 1 }],
      '2': [{ t: 'quarter', d: 0, b: 2 }],
      '3': [{ t: 'quarter', d: 1, b: 3 }],
      '4': [{ t: 'half', d: 0, b: 4 }],
      '5': [{ t: 'quarter', d: 1, b: 3 }, { t: 'quarter', d: 0, b: 2 }],
      '6': [{ t: 'half', d: 1, b: 6 }],
      '7': [{ t: 'half', d: 2, b: 7 }],
      '8': [{ t: 'whole', d: 0, b: 8 }],
      '9': [{ t: 'half', d: 1, b: 6 }, { t: 'quarter', d: 1, b: 3 }],
      '10': [{ t: 'half', d: 1, b: 6 }, { t: 'half', d: 0, b: 4 }],
      '11': [{ t: 'half', d: 2, b: 7 }, { t: 'half', d: 0, b: 4 }],
      '12': [{ t: 'whole', d: 1, b: 12 }],
      '13': [{ t: 'half', d: 2, b: 7 }, { t: 'half', d: 1, b: 6 }],
      '14': [{ t: 'whole', d: 2, b: 14 }],
      '15': [{ t: 'whole', d: 0, b: 8 }, { t: 'half', d: 2, b: 7 }],
    };

    if (this.options.notation === 'slash') {
      // In case of slash notation, return an array of n=beats elements, each with a duration of 1 beat.
      const index = 1 * 8 / this.time.beatType;
      return Array(beats).fill(this
        ._map(mapDuration, index, [], `Unexpected beat count 1 for time signature ${this.time.beats}/${this.time.beatType}`)
        .map(duration => {
          return {
            duration: duration.b * this.options.divisions / 2,
            type: duration.t,
            dots: duration.d
          };
        })[0] // We're sure to get only one entry in this case.
      );
    }
    else {
      // In case of rhythmic notation, return a single note (or 2 tied notes) corresponding to the desired beat count.
      const index = beats * 8 / this.time.beatType;
      return this
      ._map(mapDuration, index, [], `Unexpected beat count ${beats} for time signature ${this.time.beats}/${this.time.beatType}`)
      .map(duration => {
        return {
          duration: duration.b * this.options.divisions / 2,
          type: duration.t,
          dots: duration.d
        };
      });
    }
  }

  convertChordNote(duration, fermata = false, tie = null) {
    const altered = Converter.mapFifthsToAlters[this.fifths >= 0 ? 'sharp' : 'flat'].slice(0, Math.abs(this.fifths));
    const noteType = {
      _name: 'pitch',
      _content: [{
        'step': this.options.step
      }, {
        'alter': altered.includes(this.options.step) ? (this.fifths > 0 ? 1 : -1) : 0
      }, {
        'octave': this.options.octave
      }]
    };

    const notations = [];
    if (fermata) {
      notations.push({ _name: 'fermata' });
    }
    if (tie) {
      notations.push({ _name: 'tied', _attrs: { 'type': tie } });
    }

    return Converter.reorderSequence(this.measure, [noteType, {
      _name: 'cue'
    }, {
      _name: 'notehead',
      _content: this.options.notehead,
      _attrs: [{ 'font-size': this.options.noteheadSize }]
    }, {
      'duration': duration.duration
    }, {
      'voice': 1,
    }, {
      _name: 'type',
      _attrs: { 'size': 'full' },
      _content: duration.type
    }, { ...(notations.length && {
      'notations': Converter.reorderSequence(this.measure, notations, Converter.sequenceNotations)
    })}]
    .concat(Array(duration.dots).fill({ _name: 'dot' })), Converter.sequenceNote);
  }

  convertChordDegree(value, type, alter) {
    return {
      _name: 'degree',
      _attrs: { 'print-object': 'no' },
      _content: [{
        'degree-value': value
      }, {
        'degree-alter': alter
      }, {
        'degree-type': type
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
    const rootAlter = this._map(Converter.mapAlter, parsedChord.input.rootNote[1] || null, null, `Unrecognized accidental in chord "${parsedChord.input.rootNote}"`);
    const chordText = parsedChord.formatted.descriptor + parsedChord.formatted.chordChanges.join('');

    // Find chord quality (aka kind).
    // `chord-symbol` misses a bunch of MusicXML chord qualities so we'll have to derive them ourselves.
    const mapKind = {
      'major': 'major',
      'major6': 'major-sixth',
      'major7': 'major-seventh',
      'dominant7': 'dominant',
      'minor': 'minor',
      'minor6': 'minor-sixth',
      'minor7': 'minor-seventh',
      'minorMajor7': 'major-minor',
      'augmented': 'augmented',
      'diminished': 'diminished',
      'diminished7': 'diminished-seventh',
      'power': 'power'
    };
    let chordKind = this._map(mapKind, parsedChord.normalized.quality, '', `Unrecognized chord quality "${parsedChord.normalized.quality}"`);

    // Convert extensions to their equivalent MusicXML kind.
    // Find the highest extension, then replace the word following [major, minor, dominant] with it.
    if (parsedChord.normalized.extensions.length) {
      const extension = Math.max(...parsedChord.normalized.extensions.map(e => parseInt(e))).toString();
      const mapExtensionKind = {
        '9': '-ninth',
        '11': '-11th',
        '13': '-13th'
      };
      chordKind = chordKind.split('-')[0] + this._map(mapExtensionKind, extension, '', `Unhandled extension ${extension}`);

      // chord-symbol considers dominant-11th to be suspended - but that's not _necessarily_ the case.
      // https://en.wikipedia.org/wiki/Eleventh_chord
      if (chordKind === 'dominant-11th') {
        parsedChord.normalized.isSuspended = false;
      }
    }

    // Detect other chord kinds by explicit interval comparison.
    [
      { intervals: ['1', '4', '5'], kind: 'suspended-fourth', strict: true },
      { intervals: ['1', '5', '9'], kind: 'suspended-second', strict: true },
      { intervals: ['1', 'b3', 'b5', 'b7'], kind: 'half-diminished', strict: true },
      { intervals: ['1', '3', '#5', 'b7'], kind: 'augmented-seventh', strict: false }
    ].some(chord => {
      if (
        (!chord.strict || parsedChord.normalized.intervals.length === chord.intervals.length) &&
        chord.intervals.every((s, i) => s === parsedChord.normalized.intervals[i])
      ) {
        chordKind = chord.kind;

        // Remove the intervals from the parsedChord to avoid duplication below.
        chord.intervals.forEach(i => {
          parsedChord.normalized.alterations = parsedChord.normalized.alterations.filter(p => p === i);
          parsedChord.normalized.adds = parsedChord.normalized.adds.filter(p => p === i);
          parsedChord.normalized.omits = parsedChord.normalized.omits.filter(p => p === i);
        });

        // Add the missing intervals from the parsedChord to the adds.
        parsedChord.normalized.intervals.forEach(i => {
          if (!chord.intervals.includes(i)) {
            parsedChord.normalized.adds.push(i);
          }
        });

        // Stop looping.
        return true;
      }
    });

    // Handle suspended chords other than triads.
    const chordDegrees = [];
    if (parsedChord.normalized.isSuspended && !chordKind.includes('suspended')) {
      parsedChord.normalized.adds.push('4');
      // Handle case of sus(add3)
      if (!parsedChord.normalized.adds.includes('3')) {
        parsedChord.normalized.omits.push('3');
      }
    }

    // Add chord degrees.
    parsedChord.normalized.alterations.forEach(alteration => {
      const degree = alteration.slice(1);
      chordDegrees.push(
        this.convertChordDegree(
          degree,
          (degree === '5' || parsedChord.normalized.extensions.includes(degree)) ? 'alter' : 'add',
          this._map(Converter.mapAlter, alteration[0], 0, `Unrecognized alter symbol in "${alteration}"`)
        )
      );
    });
    parsedChord.normalized.adds.forEach(add => {
      const alteration = Object.keys(Converter.mapAlter).includes(add[0]) ? add[0] : null;
      const degree = alteration ? add.slice(1) : add;
      chordDegrees.push(
        this.convertChordDegree(degree, 'add', this._map(Converter.mapAlter, alteration, 0, `Unrecognized alter symbol in "${add}"`))
      );
    });
    parsedChord.normalized.omits.forEach(omit => {
      const alteration = Object.keys(Converter.mapAlter).includes(omit[0]) ? omit[0] : null;
      const degree = alteration ? omit.slice(1) : omit;
      chordDegrees.push(
        this.convertChordDegree(degree, 'subtract', this._map(Converter.mapAlter, alteration, 0, `Unrecognized alter symbol in "${omit}"`))
      );
    });

    return { rootStep, rootAlter, chordKind, chordDegrees, chordText };
  }

  convertChord(chord) {
    let harmony = null;

    // Special case: 'n' for no chord
    if (chord.note === 'n') {
      harmony = [{
        'root': [{
          _name: 'root-step',
          _attrs: { 'text': '' },
          _content: this.options.step
        }],
      }, {
        _name: 'kind',
        _attrs: { 'text': 'N.C.' },
        _content: 'none',
      }];
    }
    else {
      const { rootStep, rootAlter, chordKind, chordDegrees, chordText } = this.convertChordSymbol(chord);

      // Handle bass note
      const bass = !chord.over ? null : [{
        'bass-step': chord.over.note[0]
      }, { ...(chord.over.note[1] && {
        'bass-alter': this._map(Converter.mapAlter, chord.over.note[1], null, `Unrecognized accidental in bass note "${chord.over.note}"`)
      })}];

      harmony = [{
        'root': [{
          'root-step': rootStep
        }, { ...(rootAlter && { // Don't generate the root-alter entry if rootAlter is blank
          'root-alter': rootAlter
        })}],
      }, {
        _name: 'kind',
        _attrs: { 'text': chordText, 'use-symbols': 'no' },
        _content: chordKind,
      }, { ...(bass && {
        'bass': bass
      })}].concat(chordDegrees);
    }

    // TODO Handle alternate chord
    if (chord.alternate) {
      this._log(LogLevel.Warn, `Unhandled alternate chord ${JSON.stringify(chord.alternate)}`);
    }

    return new Converter.Chord(
      harmony,
      // Initial chord duration is 1 beat
      this.calculateChordDuration(1).map(duration => this.convertChordNote(duration)),
      chord
    );
  }

  convertKey() {
    const mapKeys = {
      // Major keys
      'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6, 'C#': 7,
      'F': -1, 'Bb': -2, 'Eb': -3, 'Ab': -4, 'Db': -5, 'Gb': -6, 'Cb': -7,
      // Minor keys
      'A-': 0, 'E-': 1, 'B-': 2, 'F#-': 3, 'C#-': 4, 'G#-': 5, 'D#-': 6, 'A#-': 7,
      'D-': -1, 'G-': -2, 'C-': -3, 'F-': -4, 'Bb-': -5, 'Eb-': -6, 'Ab-': -7
    };

    // Remember the fifth.
    this.fifths = this._map(mapKeys, this.song.key, 0, `Unrecognized key signature "${this.song.key}"`);

    return {
      _name: 'key',
      _attrs: [{ 'print-object': this.options.keySignature ? 'yes' : 'no' }],
      _content: [{
        'fifths': this.fifths
      }, {
        'mode': this.song.key.slice(-1) === '-' ? 'minor' : 'major'
      }]
    };
  }

  convertStyleAndGroove(style, groove) {
    return {
      _name: 'direction',
      _attrs: { 'placement': 'above' },
      _content: [{
        'direction-type': [{
          'words': style
        }]
      }, {
        'sound': [{
          'play': [{
            _name: 'other-play',
            _attrs: { 'type': 'groove' },
            _content: groove || style
          }]
        }]
      }]
    };
  }

  _log(logLevel, message, measure = this.measure) {
    if (logLevel < this.options.logLevel) return;
    const log = `[ireal-musicxml] [${this.song.title}${measure ? '#' + measure.number() : ''}] ${message}`;
    let method = 'warn';
    switch (logLevel) {
      case LogLevel.Debug: method = 'debug'; break;
      case LogLevel.Info: method = 'info'; break;
      case LogLevel.Warn: method = 'warn'; break;
      case LogLevel.Error: method = 'error'; break;
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
}
