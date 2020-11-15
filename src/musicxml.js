import {toXML} from 'jstoxml';

export class MusicXML {
  static defaultOptions = {
    'divisions': 768, // as used by iReal
    'note': {
      'step': 'B',
      'octave': 4,
      'notehead': 'slash'
    }
  }

  static convert(song, options = {}) {
    const realOptions = Object.assign({}, this.defaultOptions, options);
    return new MusicXML(song, realOptions).musicxml;
  }

  constructor(song, options) {
    this.song = song;
    this.options = options;
    this.time = { beats: 4, type: 4 };
    this.musicxml = toXML(this.convert(), {
      header: `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
      `.trim(),
      indent: '  '
    });
  }

  convert() {
    return {
      'score-partwise': [{
        'movement-title': this.song.title
      }, {
        'identification': [{
          _name: 'creator',
          _attrs: { 'type': 'composer' },
          _content: this.song.composer
        }, {
          _name: 'creator',
          _attrs: { 'type': 'lyricist' },
          _content: this.song.exStyle || this.song.style
        }, {
          'encoding': [{
            'software': '@infojunkie/ireal-musicxml'
          }, {
            'encoding-date': this.convertDate(new Date())
          }, {
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
        'part-list': {
          _name: 'score-part',
          _attrs: { 'id': 'P1' },
          _content: {
            _name: 'part-name',
            _attrs: { 'print-object': 'no' },
            _content: 'Lead sheet'
          }
        }
      }, {
        _name: 'part',
        _attrs: { 'id': 'P1' },
        _content: this.convertMeasures()
      }]
    }
  }

  // Date in yyyy-mm-dd
  // https://stackoverflow.com/a/50130338/209184
  convertDate(date) {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000 ))
      .toISOString()
      .split('T')[0];
  }

  // Fix order of elements according to sequence as specified by an xs:sequence.
  // @param {array<object>} elements - Array of elements to adjust.
  // @param {object} sequence - Map of element name to its order in xs:sequence.
  // @return {array<object>} Sorted elements.
  adjustSequence(elements, sequence) {
    return elements.sort((a1, a2) => {
      let k1 = Object.keys(a1)[0]; if (k1 == '_name') k1 = a1[k1];
      let k2 = Object.keys(a2)[0]; if (k2 == '_name') k2 = a2[k2];
      if (!(k1 in sequence)) {
        console.warn(`[MusicXML::convertMeasure] Unrecognized element "${k1}"`);
      }
      if (!(k2 in sequence)) {
        console.warn(`[MusicXML::convertMeasure] Unrecognized element "${k2}"`);
      }
      return sequence[k1] - sequence[k2];
    });
  }

  convertSection(annot) {
    let section = annot.slice(1);
    if (section === 'i') section = 'Intro';
    return {
      _name: 'direction',
      _attrs: { 'placement': 'above' },
      _content: {
        'direction-type': {
          'rehearsal': section
        }
      }
    }
  }

  convertTime(annot) {
    let beats = annot[1];
    let beatType = annot[2];
    if (annot.slice(1) === '12') {
      beats = 12;
      beatType = 8;
    }
    this.time = { beats, type: beatType };
    return {
      'time': [{
        'beats': beats
      }, {
        'beat-type': beatType
      }]
    }
  }

  calculateChordDuration(beats) {
    const mapDuration = {
      '1': { t: 'eighth', d: 0 },
      '2': { t: 'quarter', d: 0 },
      '3': { t: 'quarter', d: 1 },
      '4': { t: 'half', d: 0 },
      '5': { t: null, d: null }, // TODO
      '6': { t: 'half', d: 1 },
      '7': { t: 'half', d: 2 },
      '8': { t: 'whole', d: 0 },
      '9': { t: null, d: null }, // TODO
      '10': { t: null, d: null }, // TODO
      '11': { t: null, d: null }, // TODO
      '12': { t: 'whole', d: 1 }
    };
    const index = beats * 8 / this.time.type; // Lowest beat resolution is eighth-note (8)
    if (!(index in mapDuration)) {
      console.warn(`[MusicXML::calculateChordDuration] Unexpected beat count ${beats} for time signature ${this.time.beats}/${this.time.type}`);
    }
    const type = mapDuration[index].t;
    if (!type) {
      console.warn(`[MusicXML::calculateChordDuration] Unhandled beat count ${beats} for time signature ${this.time.beats}/${this.time.type}`);
    }
    const duration = beats * this.options.divisions / this.time.beats;
    return { duration, type, dots: mapDuration[index].d };
  }

  convertChordNote(duration, type, dots) {
    return this.adjustSequence([{
      'unpitched': [{
        'display-step': this.options.note.step
      }, {
        'display-octave': this.options.note.octave
      }]
    }, {
      'duration': duration
    }, {
      'type': type
    }, {
      'notehead': this.options.note.notehead
    }].concat(Array(dots).fill({ _name: 'dot' })), {
      'unpitched': 1,
      'duration': 2,
      'type': 3,
      'dot': 4,
      'notehead': 5
    });
  }

  convertChord(chord) {
    // TODO Handle alternate chord
    // TODO Handle slash chord
    const rootStep = chord.note[0];
    const mapRootAlter = { '#': 1, 'b': -1 };
    const rootAlter = chord.note[1] && chord.note[1] in mapRootAlter ? mapRootAlter[chord.note[1]] : undefined;
    if (chord.note[1] && !rootAlter) {
      console.warn(`[MusicXML::convertChord] Unrecognized accidental in chord "${chord.note}"`);
    }
    // To map iReal chord modifiers to a MusicXML structure, enumerate all the possibilities.
    // Maybe there's a way to parse based on actual understanding of the chord naming practice,
    // but it's _very_ complicated :-)
    // https://github.com/felixroos/jazzband/blob/master/src/harmony/Harmony.ts#L12-L73
    // https://github.com/no-chris/chord-symbol
    // https://usermanuals.musicxml.com/MusicXML/Content/ST-MusicXML-kind-value.htm
    // TODO Configure output nomenclature (in `text`), e.g. minor => '-' vs. 'm' vs 'MI' vs 'min'
    const mapChord = {
      '': { text: '', kind: 'major' },
      '^': { text: '', kind: 'major' },
      '-': { text: 'm', kind: 'minor' },
      '-♯5': { text: 'm', kind: 'minor', degrees: [ { d: 5, a: 1, t: 'alter' } ] },
      '-♭6': { text: 'm', kind: 'minor', degrees: [ { d: 6, a: -1, t: 'add' } ] },
      '+': { text: '+', kind: 'augmented' },
      'sus': { text: 'sus4', kind: 'suspended-fourth' },
      'sus4': { text: 'sus4', kind: 'suspended-fourth' },
      '2': { text: 'sus2', kind: 'suspended-second' },
      'sus2': { text: 'sus2', kind: 'suspended-second' },
      'o': { text: 'o', kind: 'diminished' },
      '^7': { text: '△7', kind: 'major-seventh' },
      '^7♯5': { text: '△7', kind: 'major-seventh', degrees: [ { d: 5, a: 1, t: 'alter' } ] },
      '^7♯11': { text: '△7', kind: 'major-seventh', degrees: [ { d: 11, a: 1, t: 'add' } ] },
      '-^7': { text: 'm△7', kind: 'major-minor' },
      '-7': { text: 'm7', kind: 'minor-seventh' },
      '-7♭5': { text: 'm7♭5', kind: 'half-diminished' },
      'h7': { text: 'ø7', kind: 'half-diminished' },
      'h': { text: 'ø7', kind: 'half-diminished' },
      'o7': { text: 'o7', kind: 'diminished-seventh' },
      '7': { text: '7', kind: 'dominant' },
      '7♯5': { text: '7', kind: 'dominant', degrees: [ { d: 5, a: 1, t: 'alter' } ] },
      '7+': { text: '7', kind: 'dominant', degrees: [ { d: 5, a: 1, t: 'alter' } ] },
      '7♭5': { text: '7', kind: 'dominant', degrees: [ { d: 5, a: -1, t: 'alter' } ]},
      '7sus': { text: '7sus4', kind: 'dominant', degrees: [ { d: 3, a: 1, t: 'alter' } ] },
      '7♭9': { text: '7', kind: 'dominant', degrees: [ { d: 9, a: -1, t: 'add' } ] },
      '7♭9♭5': { text: '7', kind: 'dominant', degrees: [ { d: 5, a: -1, t: 'alter' }, { d: 9, a: -1, t: 'add' } ] },
      '7♭9sus': { text: '7', kind: 'dominant', degrees: [ { d: 7, a: -1, t: 'add' }, { d: 9, a: -1, t: 'add' } ] },
      '7♭9♯5': { text: '7', kind: 'dominant', degrees: [ { d: 5, a: 1, t: 'alter' }, { d: 9, a: -1, t: 'add' } ] },
      '7♭9♯9': { text: '7', kind: 'dominant', degrees: [ { d: 9, a: -1, t: 'add' }, { d: 9, a: 1, t: 'add' } ] },
      '7♭9b13': { text: '7', kind: 'dominant', degrees: [ { d: 9, a: -1, t: 'add' }, { d: 13, a: -1, t: 'add' } ] },
      '7♭9♯11': { text: '', kind: 'dominant', degrees: [ { d: 9, a: -1, t: 'add' }, { d: 11, a: 1, t: 'add' } ] },
      '7♯9': { text: '7', kind: 'dominant', degrees: [ { d: 9, a: 1, t: 'add' } ] },
      '7♯9♭5': { text: '7', kind: 'dominant', degrees: [ { d: 5, a: -1, t: 'alter' }, { d: 9, a: 1, t: 'add' } ] },
      '7♯9♯5': { text: '7', kind: 'dominant', degrees: [ { d: 5, a: 1, t: 'alter' }, { d: 9, a: 1, t: 'add' } ] },
      '7♯9♯11': { text: '7', kind: 'dominant', degrees: [ { d: 9, a: 1, t: 'alter' }, { d: 11, a: 1, t: 'add' } ] },
      '7♯11': { text: '7', kind: 'dominant', degrees: [ { d: 11, a: 1, t: 'add' }] },
      '7♭13': { text: '7', kind: 'dominant', degrees: [ { d: 13, a: -1, t: 'add' } ] },
      '6': { text: '6', kind: 'major-sixth' },
      '69': { text: '6/9', kind: 'major-sixth', degrees: [ { d: 9, a: null, t: 'add' } ] },
      '-6': { text: 'm6', kind: 'minor-sixth' },
      '-69': { text: 'm6/9', kind: 'minor-sixth', degrees: [ { d: 9, a: null, t: 'add' } ] },
      '^9': { text: '△9', kind: 'major-ninth' },
      '^9♯11': { text: '△9', kind: 'major-ninth', degrees: [ { d: 11, a: 1, t: 'add' } ] },
      '-9': { text: 'm9', kind: 'minor-ninth' },
      '-^9': { text: 'm△9', kind: 'major-minor', degrees: [ { d: 9, a: null, t: 'add' } ] },
      '9': { text: '9', kind: 'dominant-ninth' },
      '9sus': { text: '9sus4', kind: 'dominant-ninth', degrees: [ { d: 3, a: 1, t: 'alter' } ] },
      '9♯5': { text: '9', kind: 'dominant-ninth', degrees: [ { d: 5, a: 1, t: 'alter' } ] },
      '9♭5': { text: '9', kind: 'dominant-ninth', degrees: [ { d: 5, a: -1, t: 'alter' } ] },
      '9♯11': { text: '9', kind: 'dominant-ninth', degrees: [ { d: 11, a: 1, t: 'add' } ] },
      '^11': { text: '△11', kind: 'major-11th' },
      '-11': { text: 'm11', kind: 'minor-11th' },
      '11': { text: '11', kind: 'dominant-11th' },
      '^13': { text: '△13', kind: 'major-13th' },
      '-13': { text: 'm13', kind: 'minor-13th' },
      '13': { text: '13', kind: 'dominant-13th' },
      '13sus': { text: '13sus4', kind: 'dominant-13th', degrees: [ { d: 3, a: 1, t: 'alter' } ] },
      '13♭9': { text: '13', kind: 'dominant-13th', degrees: [ { d: 9, a: -1, t: 'alter' } ] },
      '13♯9': { text: '13', kind: 'dominant-13th', degrees: [ { d: 9, a: 1, t: 'alter' } ] },
      '13♯11': { text: '13', kind: 'dominant-13th', degrees: [ { d: 11, a: 1, t: 'alter' } ] }
    };
    let chordKind = null;
    let chordText = null;
    let chordDegrees = [];
    if (chord.modifiers in mapChord) {
      const mappedChord = mapChord[chord.modifiers];
      chordText = mappedChord.text;
      chordKind = mappedChord.kind;
      if ('degrees' in mappedChord) {
        chordDegrees = mappedChord.degrees.map(degree => {
          return {
            'degree': [{
              'degree-value': degree.d
            }, {
              'degree-alter': degree.a
            }, {
              'degree-type': degree.t
            }]
          }
        });
      }
    } else {
      console.warn(`[MusicXML::convertChord] Unrecognized chord modifiers "${chord.modifiers}"`);
    }

    // Special case: 'n' for no chord
    if (rootStep == 'n') {
      chordKind = 'none';
      chordText = 'N.C.';
    }

    const harmony = [{
      'root': [{ ...(rootStep !== 'n' && { // Regular chord
        'root-step': rootStep
      })}, { ...(rootStep === 'n' && { // No chord
        _name: 'root-step',
        _attrs: { 'text': '' },
        _content: this.options.note.step
      })}, { ...(rootAlter && { // Don't generate the root-alter entry if rootAlter is blank
        'root-alter': rootAlter
      })}],
    }, {
      _name: 'kind',
      _attrs: { 'text': chordText },
      _content: chordKind,
    }].concat(chordDegrees);

    const { duration, type, dots } = this.calculateChordDuration(1); // Every new chord starts as 1 beat
    return { harmony, note: this.convertChordNote(duration, type, dots) };
  }

  convertKey() {
    const mapKeys = {
      'C': 0,
      'G': 1,
      'D': 2,
      'A': 3,
      'E': 4,
      'B': 5,
      'F#': 6,
      'C#': 7,
      'F': -1,
      'Bb': -2,
      'Eb': -3,
      'Ab': -4,
      'Db': -5,
      'Gb': -6,
      'Cb': -7,
      'A-': 0,
      'E-': 1,
      'B-': 2,
      'F#-': 3,
      'C#-': 4,
      'G#-': 5,
      'D#-': 6,
      'A#-': 7,
      'D-': -1,
      'G-': -2,
      'C-': -3,
      'F-': -4,
      'Bb-': -5,
      'Eb-': -6,
      'Ab-': -7
    }
    if (!(this.song.key in mapKeys)) {
      console.warn(`[MusicXML::convertKey] Unrecognized song key "${this.song.key}"`);
      return null;
    }

    return {
      'key': [{
        'fifths': mapKeys[this.song.key]
      }, {
        'mode': this.song.key.slice(-1) === '-' ? 'minor' : 'major'
      }]
    }
  }

  convertMeasures() {
    let measure = null;
    let attributes = null;
    let chords = null;

    const measures = this.song.cells.reduce( (measures, cell) => {
      // Start a new measure if needed.
      if (cell.bars.match(/(\(|\{|\[)/)) {
        attributes = [];
        chords = [];
        measure = {
          _name: 'measure',
          _attrs: { 'number': measures.length+1 },
          _content: []
        }
        // Very first bar: add defaults.
        if (!measures.length) {
          attributes.push({
            'divisions': this.options.divisions
          }, {
            'clef': [{
              'sign': 'G'
            }, {
              'line': 2
            }]
          }, this.convertKey());
        }
      }

      // Short-circuit loop if no measure exists.
      // It can happen that `measure` is still blank in case of empty cells in iReal layout.
      // e.g. Girl From Ipanema in tests.
      if (!measure) return measures;

      // Other attributes.
      cell.annots.forEach(annot => {
        switch(annot[0]) {
          case '*': measure['_content'].push(this.convertSection(annot)); break;
          case 'T': attributes.push(this.convertTime(annot)); break;
          // TODO More attributes
          default: console.warn(`[MusicXML::convertMeasures] Unrecognized annotation "${annot}"`);
        }
      });

      // Chords.
      if (cell.chord) {
        if (cell.chord.note == 'x') {
          // Handle bar repeat.
          // Copy last measure, but on keep chords and empty out intermediate objects.
          attributes = [];
          chords = [];
          measure = JSON.parse(JSON.stringify(measures[measures.length-1]));
          measure['_content'] = measure['_content'].filter(c => 'harmony' in c || 'note' in c);
          measure['_attrs']['number']++;
        } else if (cell.chord.note == 'r') {
          // TODO Handle Handle double bar repeat.
        } else if (cell.chord.note == 'W') {
          // TODO Handle invisible root.
        } else if (cell.chord.note == ' ') {
          // TODO Handle alternate chord only.
        } else {
          // Process new chord.
          chords.push(this.convertChord(cell.chord));
        }
      } else {
        // In case of blank chord, add a beat to last chord if any.
        let lastChord = chords.pop();
        if (lastChord) {
          const beats = lastChord['note'].filter(e => 'duration' in e)[0]['duration'] * this.time.beats / this.options.divisions;
          const { duration, type, dots } = this.calculateChordDuration(beats + 1);
          lastChord.note = this.convertChordNote(duration, type, dots);
          chords.push(lastChord);
        }
      }

      // Close and insert the measure if needed.
      if (cell.bars.match(/(\)|\}|\]|Z)/)) {
        if (attributes.length) {
          measure['_content'].push({
            'attributes': this.adjustSequence(attributes, {
              'divisions': 1,
              'key': 2,
              'time': 3,
              'staves': 4,
              'part-symbol': 5,
              'instruments': 6,
              'clef': 7,
              'staff-details': 8,
              'transpose': 9,
              'directive': 10,
              'measure-style': 11
            })
          });
        }
        chords.forEach(chord => {
          measure['_content'].push({
            'harmony': chord.harmony
          }, {
            'note': chord.note
          })
        });

        // Remove empty content.
        if (!measure['_content'].length) {
          delete(measure['_content']);
        }

        measures.push(measure);
        measure = null;
        attributes = null;
        chords = null;
      }
      return measures;
    }, []);
    return measures;
  }
}
