import {toXML} from 'jstoxml';

export class MusicXML {
  static defaultOptions = {
    'divisions': 768, // same as used by iReal
    'note': { // params for chord notes
      'type': 'pitch', // 'rest' is also supported
      'step': 'B', // unused for 'rest'
      'octave': 4, // unused for 'rest'
      'notehead': 'slash'
    }
  }

  static sequenceAttributes = [
    // Expected order of attribute elements.
    // https://usermanuals.musicxml.com/MusicXML/Content/EL-MusicXML-attributes.htm
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
  ]

  static sequenceNote = [
    // Expected order of note elements.
    // https://usermanuals.musicxml.com/MusicXML/Content/CT-MusicXML-note.htm
    'pitch',
    'rest',
    'unpitched',
    'duration',
    'voice',
    'type',
    'dot',
    'notehead'
  ]

  static sequenceBarline = [
    // Expected order of barline elements.
    // https://usermanuals.musicxml.com/MusicXML/Content/CT-MusicXML-barline.htm
    'bar-style',
    'footnote',
    'level',
    'wavy-line',
    'segno',
    'coda',
    'fermata',
    'ending',
    'repeat'
  ]

  static mapAlter = {
    '#': 1,
    'b': -1
  }

  static mapFifthsToAlters = {
    '0': [],
    '1': ['F'],
    '2': ['F', 'C'],
    '3': ['F', 'C', 'G'],
    '4': ['F', 'C', 'G', 'D'],
    '5': ['F', 'C', 'G', 'D', 'A'],
    '6': ['F', 'C', 'G', 'D', 'A', 'E'],
    '7': ['F', 'C', 'G', 'D', 'A', 'E', 'B'],
    '-1': ['B'],
    '-2': ['B', 'E'],
    '-3': ['B', 'E', 'A'],
    '-4': ['B', 'E', 'A', 'D'],
    '-5': ['B', 'E', 'A', 'D', 'G'],
    '-6': ['B', 'E', 'A', 'D', 'G', 'C'],
    '-7': ['B', 'E', 'A', 'D', 'G', 'C', 'F'],
  }

  static convert(song, options = {}) {
    const realOptions = Object.assign({}, this.defaultOptions, options);
    return new MusicXML(song, realOptions).musicXml;
  }

  constructor(song, options) {
    this.song = song;
    this.options = options;
    this.time = { beats: 4, type: 4 };
    this.fifths = null;
    this.musicXml = toXML(this.convert(), {
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
          // TODO Find better MusicXML element
          // https://github.com/w3c/musicxml/issues/347
          _name: 'creator',
          _attrs: { 'type': 'lyricist' },
          _content: this.song.style + (this.song.groove ? ` (${this.song.groove})` : '')
        }, {
          'encoding': [{
            'software': '@infojunkie/ireal-musicxml'
          }, {
            'encoding-date': MusicXML.convertDate(new Date())
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
      this.barEnding = 0;
    }

    number() {
      return this.body['_attrs']['number'];
    }

    assemble() {
      if (this.attributes.length) {
        this.body['_content'].push({
          'attributes': MusicXML.reorderSequence(this.attributes, MusicXML.sequenceAttributes)
        });
      }

      this.chords.forEach(chord => {
        this.body['_content'].push({
          'harmony': chord.harmony
        }, {
          'note': chord.note
        })
      });

      // Finalize barlines.
      this.barlines[0]['_content'] = MusicXML.reorderSequence(this.barlines[0]['_content'], MusicXML.sequenceBarline);
      this.body['_content'].splice(1, 0, this.barlines[0]);
      this.barlines[1]['_content'] = MusicXML.reorderSequence(this.barlines[1]['_content'], MusicXML.sequenceBarline);
      this.body['_content'].push(this.barlines[1]);

      return this.body;
    }
  }

  convertMeasures() {
    let measure = null; // current measure (of class Measure) being built
    let barRepeat = 0; // current bar number for single- and double-bar repeats

    // Loop on cells.
    const measures = this.song.cells.reduce( (measures, cell, cellIndex) => {
      // Start a new measure if needed.
      // This means either finding an opening barline or finding non-empty cells while we're not in any measure.
      if (cell.bars.match(/\(|\{|\[/) || (!measure && (cell.chord || cell.annots.length || cell.comments.length || cell.bars))) {
        if (measure) {
          console.log(`[MusicXML.convertMeasures] Starting a new measure over existing measure ${JSON.stringify(measure)}`)
        }
        measure = new MusicXML.Measure(measures.length+1);

        // Very first bar: add defaults.
        if (!measures.length) {
          measure.attributes.push({
            'divisions': this.options.divisions
          }, {
            'clef': [{
              'sign': 'G'
            }, {
              'line': 2
            }]
          }, {
            'measure-style': [{
              _name: 'slash',
              _attrs: { 'type': 'start', 'use-stems': 'no' }
            }]
          }, this.convertKey());

          // Add bpm if any.
          if (this.song.bpm) {
            measure.body['_content'].push(this.convertTempo(this.song.bpm));
          }
        }

        // Add starting barline.
        measure.barlines.push(this.convertBarline(cell.bars, 'left'));

        // If we're still repeating bars, copy the previous bar now.
        if (barRepeat) {
          measure.chords = [...measures[measures.length-barRepeat-1].chords];
        }
      }

      // Short-circuit loop if no measure exists.
      // It can happen that `measure` is still blank in case of empty cells in iReal layout.
      // e.g. Girl From Ipanema in tests.
      if (!measure) {
        if (cell.chord || cell.annots.length || cell.comments.length || cell.bars) {
          console.log(`[MusicXML.convertMeasures] Found non-empty orphan cell ${JSON.stringify(cell)}.`);
        }
        return measures;
      }

      // Start new system every 16 cells.
      if (cellIndex % 16 === 0) {
        measure.body['_content'].splice(0, 0, { _name: 'print', _attrs: { 'new-system': 'yes' } });
      }

      // TODO Comments.

      // Other attributes.
      cell.annots.forEach(annot => {
        switch(annot[0]) {
          case '*': { // section
            const section = annot.slice(1);
            measure.body['_content'].push(this.convertSection(section));
            break;
          }
          case 'T': { // time
            const time = annot.slice(1);
            measure.attributes.push(this.convertTime(time));
            break;
          }
          case 'S': { // segno
            measure.body['_content'].push(this.convertSegno());
            break;
          }
          case 'N': { // ending
            // TODO This assumes a single ending at a time.
            const ending = parseInt(annot.slice(1));
            measure.barlines[0]['_content'].push(this.convertEnding(ending, 'start'));
            // End the previous ending at the previous measure's right barline.
            // Also, remove the 'discontinue' ending from its starting measure since we found an end to it.
            if (ending > 1) {
              measures[measures.length-1].barlines[1]['_content'].push(this.convertEnding(ending-1, 'stop'));
              const target = measures.slice().reverse().find(m => m.barEnding === ending-1);
              if (!target) console.error(`[MusicXML.convertMeasures] Cannot find ending ${ending-1} in right barline of any measure`);
              // The last result is the good one: remove the 'discontinue' ending.
              const index = target.barlines[1]['_content'].findIndex(b => b['_name'] === 'ending');
              if (index === -1) console.error(`[MusicXML.convertMeasures] Cannot find ending ${ending-1} in right barline of measure ${target.number()}`)
              delete target.barlines[1]['_content'][index];
            }
            // We will add a 'discontinue' ending at this measure's right barline.
            measure.barEnding = ending;
            break;
          }
          case 'Q': { // coda
            measure.body['_content'].push(this.convertCoda());
            break;
          }

          // Ignore small and large chord renderings.
          case 'l':
          case 's': break;

          // TODO More attributes: U, f
          default: console.warn(`[MusicXML.convertMeasures] Unrecognized annotation "${annot}"`);
        }
      });

      // Chords.
      if (cell.chord) {
        switch (cell.chord.note) {
          case 'x': {
            // Handle single bar repeat.
            barRepeat = 1;
            measure.chords = [...measures[measures.length-barRepeat].chords];
            break;
          }
          case 'r': {
            // Handle double bar repeat.
            // We do this in 2 stages, because a blank measure occurs after 'r' (to keep the measure count correct)
            // Here, we copy the next-to-last measure and set the repeat flag.
            // The next opening measure will pick up the remaining measure.
            barRepeat = 2;
            measure.chords = [...measures[measures.length-barRepeat].chords];
            break;
          }
          case 'p':
            // If slash does not occur as first chord, count it as a space.
            // Otherwise, handle it as 'W'.
            if (measure.chords.length) {
              measure.chords[measure.chords.length-1].spaces++;
              break;
            }
            // Fall into case 'W'.
            // eslint-disable-next-line no-fallthrough
          case 'W': {
            // Handle invisible root by copying previous chord.
            let target = measure;
            if (!target.chords.length) {
              target = measures.slice().reverse().find(m => m.chords.length);
              if (!target) console.error(`[MusicXML.convertMeasures] Cannot find any measure with chords prior to ${cell.chord}`);
            }
            const chord = target.chords[target.chords.length-1].ireal;
            chord.over = cell.chord.over;
            chord.alternate = cell.chord.alternate;
            measure.chords.push(this.convertChord(chord));
            break;
          }
          case ' ': {
            // TODO Handle alternate chord only.
            console.warn(`[MusicXML.convertMeasures] Unhandled empty/alternate chord ${JSON.stringify(cell.chord)}`);
            break;
          }
          default: {
            // Process new chord.
            measure.chords.push(this.convertChord(cell.chord));
          }
        }
      }
      else if (!barRepeat) {
        // There are 16 cells per row, regardless of time signature.
        // Barlines can occur anywhere and the iReal Pro player uses an unknown algorithm
        // to schedule the chords within a measure, using the empty cells as "hints" for scheduling.
        // https://technimo.helpshift.com/a/ireal-pro/?s=editor&f=chord-spacing-in-the-editor
        // https://technimo.helpshift.com/a/ireal-pro/?s=editor&f=how-do-i-fit-more-than-48-measures-into-one-chart
        //
        // Our approach to emulate the iReal Pro player is as follows:
        // 1. Whenever we find an empty cell, attach it to the previous chord (or discard it if there's no previous chord)
        // 2. At the end of the measure, adjust the chord durations based on existing empty cells across the measure
        if (measure.chords.length) {
          measure.chords[measure.chords.length-1].spaces++;
        }
      }

      // Close and insert the measure if needed.
      if (cell.bars.match(/\)|\}|\]|Z/)) {
        // Add closing barline and ending if needed.
        measure.barlines.push(this.convertBarline(cell.bars, 'right'));
        if (measure.barEnding) {
          measure.barlines[1]['_content'].push(this.convertEnding(measure.barEnding, 'discontinue'));
        }

        // Adjust chord durations.
        this.adjustChordsDuration(measure);

        // Get ready for next measure.
        measures.push(measure);
        measure = null;
        if (barRepeat) barRepeat--;
      }
      return measures;
    }, []);

    // `Measure.assemble()` puts all the parts in `Measure.body`.
    return measures.map(measure => measure.assemble());
  }

  // Fix order of elements according to sequence as specified by an xs:sequence.
  // @param {array<element>} elements - Array of elements to sort.
  // @param {array<string>} sequence - Array of element names in order of xs:sequence.
  // @return {array<element>} Ordered array of elements.
  static reorderSequence(elements, sequence) {
    return elements.filter(a => Object.keys(a).length).sort((a1, a2) => {
      let k1 = Object.keys(a1)[0]; if (k1 === '_name') k1 = a1[k1];
      let k2 = Object.keys(a2)[0]; if (k2 === '_name') k2 = a2[k2];
      // TODO indexOf() needs to search every time. Make it faster with memoize?
      const i1 = sequence.indexOf(k1);
      const i2 = sequence.indexOf(k2);
      if (i1 === -1) {
        console.warn(`[MusicXML.reorderSequence] Unrecognized element "${k1}"`);
      }
      if (i2 === -1) {
        console.warn(`[MusicXML.reorderSequence] Unrecognized element "${k2}"`);
      }
      return i1 - i2;
    });
  }

  convertEnding(ending, type) {
    // TODO This assumes a single ending.
    return {
      _name: 'ending',
      _attrs: { 'number': ending, 'type': type },
      _content: `${ending}.`
    }
  }

  convertBarline(bars, location) {
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

    return {
      _name: 'barline',
      _attrs: { 'location': location },
      _content: [{
        'bar-style': style
      }, { ...(repeat && {
        _name: 'repeat',
        _attrs: { 'direction': repeat }
      })}]
    }
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
    }
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
    }
  }

  convertCoda() {
    return {
      _name: 'direction',
      _attrs: { 'placement': 'above' },
      _content: [{
        'direction-type': {
          _name: 'coda'
        }
      }, {
        _name: 'sound',
        _attrs: { 'coda': 'coda' }
      }]
    }
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
            'beat-unit': this.calculateChordDuration(1).type
          }, {
            'per-minute': bpm
          }]
        }]
      }, {
        _name: 'sound',
        _attrs: { 'tempo': bpm }
      }]
    }
  }

  convertTime(time) {
    let beats = parseInt(time[0]);
    let beatType = parseInt(time[1]);
    if (time === '12') {
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

  adjustChordsDuration(measure) {
    // Now that the measure is closed, we can adjust the chord durations, taking empty cells into consideration.
    // https://www.irealb.com/forums/showthread.php?25161-Using-empty-cells-to-control-chord-duration
    //
    // Rules:
    // - Minimum chord duration is 1 beat
    // => Each chord starts as 1 beat
    // => Count of chords <= beats per measure
    // - Starting empty cells are discarded (already discarded during the cell loop)
    // - Each remaining empty cell counts as 1 beat (already counted during cell loop)
    // - Empty cell beats are added to their preceding chords (already added during the cell loop)
    // => Total chord durations <= beats per measure
    // - Remaining beats are distributed evenly among chords from first to last
    //
    if (measure.chords.length > this.time.beats) {
      console.error(`[MusicXML.adjustChordDuration] Too many chords (${measure.chords.length} out of ${this.time.beats}) in measure ${measure.number()}. Aborting.`);
      return;
    }
    let beats = measure.chords.reduce((beats, chord) => beats+1+chord.spaces, 0);
    if (beats > this.time.beats) {
      console.warn(`[MusicXML.adjustChordDuration] Too many beats (${beats} out of ${this.time.beats}) in measure ${measure.number()}. Removing some spaces...`);
      // Reduce spaces.
      // We're guaranteed to end this loop because measure.chords.length <= this.time.beats
      let chordIndex = 0;
      while (beats > this.time.beats) {
        if (measure.chords[chordIndex].spaces > 0) {
          measure.chords[chordIndex].spaces--;
          beats--;
        }
        chordIndex = (chordIndex + 1) % measure.chords.length;
      }
    }
    else {
      // Distribute free beats among the chords.
      let chordIndex = 0;
      while (beats < this.time.beats) {
        measure.chords[chordIndex].spaces++;
        beats++;
        chordIndex = (chordIndex + 1) % measure.chords.length;
      }
    }

    // Adjust actual chord durations.
    measure.chords = measure.chords.map(chord => {
      const { duration, type, dots } = this.calculateChordDuration(1+chord.spaces);
      chord.note = this.convertChordNote(duration, type, dots);
      return chord;
    });
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

    let index = beats * 8 / this.time.type; // Lowest beat resolution is eighth-note (8)
    // Special case: full bar always equals whole.
    if (beats === this.time.beats) {
      index = 8;
    }
    if (!(index in mapDuration)) {
      console.warn(`[MusicXML.calculateChordDuration] Unexpected beat count ${beats} for time signature ${this.time.beats}/${this.time.type}`);
    }
    const type = mapDuration[index].t;
    if (!type) {
      console.warn(`[MusicXML.calculateChordDuration] Unhandled beat count ${beats} for time signature ${this.time.beats}/${this.time.type}`);
    }
    const duration = beats * this.options.divisions;
    return { duration, type, dots: mapDuration[index].d };
  }

  convertChordNote(duration, type, dots) {
    const noteType = this.options.note.type === 'rest' ? {
      _name: 'rest'
    } : {
      _name: 'pitch',
      _content: [{
        'step': this.options.note.step
      }, {
        'alter': MusicXML.getMap(MusicXML.mapFifthsToAlters, this.fifths, [], `[MusicXML.convertChordNote] Unhandled fifths "${this.fifths}"`)
        .includes(this.options.note.step) ? (this.fifths > 0 ? 1 : -1) : 0
      }, {
        'octave': this.options.note.octave
      }]
    }

    return MusicXML.reorderSequence([noteType, {
      'notehead': this.options.note.notehead
    }, {
      'duration': duration
    }, {
      'voice': 1,
    }, {
      'type': type
    }].concat(Array(dots).fill({ _name: 'dot' })), MusicXML.sequenceNote);
  }

  convertChord(chord) {
    let harmony = null;

    // Special case: 'n' for no chord
    if (chord.note === 'n') {
      harmony = [{
        'root': [{
          _name: 'root-step',
          _attrs: { 'text': '' },
          _content: this.options.note.step
        }],
      }, {
        _name: 'kind',
        _attrs: { 'text': 'N.C.' },
        _content: 'none',
      }];
    }
    else {
      const rootStep = chord.note[0];
      const rootAlter = MusicXML.getMap(MusicXML.mapAlter, chord.note[1], null, `[MusicXML.convertChord] Unrecognized accidental in chord "${chord.note}"`);

      // To map iReal chord modifiers to a MusicXML structure, enumerate all the possibilities.
      // Maybe there's a way to parse based on actual understanding of the chord naming practice,
      // but it's _very_ complicated :-)
      // https://github.com/felixroos/jazzband/blob/master/src/harmony/Harmony.ts#L12-L73
      // https://usermanuals.musicxml.com/MusicXML/Content/ST-MusicXML-kind-value.htm
      // TODO Replace with https://github.com/no-chris/chord-symbol
      const mapChord = {
        '': { text: '', kind: 'major' },
        '-': { text: 'm', kind: 'minor' },
        '-#5': { text: 'm', kind: 'minor', degrees: [{ d: 5, a: 1, t: 'alter' }] },
        '-b6': { text: 'm', kind: 'minor', degrees: [{ d: 6, a: -1, t: 'add' }] },
        '+': { text: '+', kind: 'augmented' },
        'sus': { text: 'sus4', kind: 'suspended-fourth' },
        'sus4': { text: 'sus4', kind: 'suspended-fourth' },
        '2': { text: 'sus2', kind: 'suspended-second' },
        'sus2': { text: 'sus2', kind: 'suspended-second' },
        'o': { text: 'o', kind: 'diminished' },
        '^': { text: '△7', kind: 'major-seventh' },
        '^7': { text: '△7', kind: 'major-seventh' },
        '^7#5': { text: '△7', kind: 'major-seventh', degrees: [{ d: 5, a: 1, t: 'alter' }] },
        '^7#11': { text: '△7', kind: 'major-seventh', degrees: [{ d: 11, a: 1, t: 'add' }] },
        '-^7': { text: 'm△7', kind: 'major-minor' },
        '-7': { text: 'm7', kind: 'minor-seventh' },
        '-7b5': { text: 'm7♭5', kind: 'half-diminished' },
        'h7': { text: 'ø7', kind: 'half-diminished' },
        'h': { text: 'ø7', kind: 'half-diminished' },
        'o7': { text: 'o7', kind: 'diminished-seventh' },
        '7': { text: '7', kind: 'dominant' },
        '7#5': { text: '7', kind: 'dominant', degrees: [{ d: 5, a: 1, t: 'alter' }] },
        '7+': { text: '7', kind: 'dominant', degrees: [{ d: 5, a: 1, t: 'alter' }] },
        '7b5': { text: '7', kind: 'dominant', degrees: [{ d: 5, a: -1, t: 'alter' }]},
        '7sus': { text: '7sus4', kind: 'dominant', degrees: [{ d: 3, a: 1, t: 'alter' }] },
        '7b9': { text: '7', kind: 'dominant', degrees: [{ d: 9, a: -1, t: 'add' }] },
        '7b9b5': { text: '7', kind: 'dominant', degrees: [{ d: 5, a: -1, t: 'alter' }, { d: 9, a: -1, t: 'add' }] },
        '7b9sus': { text: '7', kind: 'dominant', degrees: [{ d: 7, a: -1, t: 'add' }, { d: 9, a: -1, t: 'add' }] },
        '7b9#5': { text: '7', kind: 'dominant', degrees: [{ d: 5, a: 1, t: 'alter' }, { d: 9, a: -1, t: 'add' }] },
        '7b9#9': { text: '7', kind: 'dominant', degrees: [{ d: 9, a: -1, t: 'add' }, { d: 9, a: 1, t: 'add' }] },
        '7b9b13': { text: '7', kind: 'dominant', degrees: [{ d: 9, a: -1, t: 'add' }, { d: 13, a: -1, t: 'add' }] },
        '7b9#11': { text: '', kind: 'dominant', degrees: [{ d: 9, a: -1, t: 'add' }, { d: 11, a: 1, t: 'add' }] },
        '7#9': { text: '7', kind: 'dominant', degrees: [{ d: 9, a: 1, t: 'add' }] },
        '7#9b5': { text: '7', kind: 'dominant', degrees: [{ d: 5, a: -1, t: 'alter' }, { d: 9, a: 1, t: 'add' }] },
        '7#9#5': { text: '7', kind: 'dominant', degrees: [{ d: 5, a: 1, t: 'alter' }, { d: 9, a: 1, t: 'add' }] },
        '7#9#11': { text: '7', kind: 'dominant', degrees: [{ d: 9, a: 1, t: 'alter' }, { d: 11, a: 1, t: 'add' }] },
        '7#11': { text: '7', kind: 'dominant', degrees: [{ d: 11, a: 1, t: 'add' }] },
        '7alt': { text: '7alt', kind: 'dominant', degrees: [
          { d: 5, a: -1, t: 'alter' },
          { d: 5, a: 1, t: 'add' },
          { d: 9, a: -1, t: 'add' },
          { d: 9, a: 1, t: 'add' },
          { d: 11, a: 1, t: 'add' },
          { d: 13, a: -1, t: 'add' }
        ] },
        '7b13': { text: '7', kind: 'dominant', degrees: [{ d: 13, a: -1, t: 'add' }] },
        '6': { text: '6', kind: 'major-sixth' },
        '69': { text: '6/9', kind: 'major-sixth', degrees: [{ d: 9, a: null, t: 'add' }] },
        '-6': { text: 'm6', kind: 'minor-sixth' },
        '-69': { text: 'm6/9', kind: 'minor-sixth', degrees: [{ d: 9, a: null, t: 'add' }] },
        '^9': { text: '△9', kind: 'major-ninth' },
        '^9#11': { text: '△9', kind: 'major-ninth', degrees: [{ d: 11, a: 1, t: 'add' }] },
        '-9': { text: 'm9', kind: 'minor-ninth' },
        '-^9': { text: 'm△9', kind: 'major-minor', degrees: [{ d: 9, a: null, t: 'add' }] },
        '9': { text: '9', kind: 'dominant-ninth' },
        '9sus': { text: '9sus4', kind: 'dominant-ninth', degrees: [{ d: 3, a: 1, t: 'alter' }] },
        '9#5': { text: '9', kind: 'dominant-ninth', degrees: [{ d: 5, a: 1, t: 'alter' }] },
        '9b5': { text: '9', kind: 'dominant-ninth', degrees: [{ d: 5, a: -1, t: 'alter' }] },
        '9#11': { text: '9', kind: 'dominant-ninth', degrees: [{ d: 11, a: 1, t: 'add' }] },
        '^11': { text: '△11', kind: 'major-11th' },
        '-11': { text: 'm11', kind: 'minor-11th' },
        '11': { text: '11', kind: 'dominant-11th' },
        '^13': { text: '△13', kind: 'major-13th' },
        '-13': { text: 'm13', kind: 'minor-13th' },
        '13': { text: '13', kind: 'dominant-13th' },
        '13sus': { text: '13sus4', kind: 'dominant-13th', degrees: [{ d: 3, a: 1, t: 'alter' }] },
        '13b9': { text: '13', kind: 'dominant-13th', degrees: [{ d: 9, a: -1, t: 'alter' }] },
        '13#9': { text: '13', kind: 'dominant-13th', degrees: [{ d: 9, a: 1, t: 'alter' }] },
        '13#11': { text: '13', kind: 'dominant-13th', degrees: [{ d: 11, a: 1, t: 'alter' }] }
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
      }
      else {
        console.warn(`[MusicXML.convertChord] Unrecognized chord modifiers "${chord.modifiers}"`);
      }

      // Handle bass note
      let bass = !chord.over ? null : [{
        'bass-step': chord.over.note[0]
      }, { ...(chord.over.note[1] && {
        'bass-alter': MusicXML.getMap(MusicXML.mapAlter, chord.over.note[1], null, `[MusicXML.convertChord] Unrecognized accidental in bass note "${chord.over.note}"`)
      })}]

      harmony = [{
        'root': [{
          'root-step': rootStep
        }, { ...(rootAlter && { // Don't generate the root-alter entry if rootAlter is blank
          'root-alter': rootAlter
        })}],
      }, {
        _name: 'kind',
        _attrs: { 'text': chordText },
        _content: chordKind,
      }, { ...(bass && {
        'bass': bass
      })}].concat(chordDegrees);
    }

    // TODO Handle alternate chord
    if (chord.alternate) {
      console.warn(`[MusicXML.convertChord] Unhandled alternate chord ${JSON.stringify(chord.alternate)}`);
    }

    const { duration, type, dots } = this.calculateChordDuration(1); // Every new chord starts as 1 beat
    return { harmony, note: this.convertChordNote(duration, type, dots), ireal: chord, spaces: 0 };
  }

  convertKey() {
    const mapKeys = {
      // Major keys
      'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6, 'C#': 7,
      'F': -1, 'Bb': -2, 'Eb': -3, 'Ab': -4, 'Db': -5, 'Gb': -6, 'Cb': -7,
      // Minor keys
      'A-': 0, 'E-': 1, 'B-': 2, 'F#-': 3, 'C#-': 4, 'G#-': 5, 'D#-': 6, 'A#-': 7,
      'D-': -1, 'G-': -2, 'C-': -3, 'F-': -4, 'Bb-': -5, 'Eb-': -6, 'Ab-': -7
    }
    if (!(this.song.key in mapKeys)) {
      console.warn(`[MusicXML.convertKey] Unrecognized key signature "${this.song.key}"`);
      return null;
    }

    // Remember the fifth.
    this.fifths = mapKeys[this.song.key];

    return {
      'key': [{
        'fifths': this.fifths
      }, {
        'mode': this.song.key.slice(-1) === '-' ? 'minor' : 'major'
      }]
    }
  }

  static getMap(map, key, defaultValue, message) {
    if (!key) return defaultValue;
    if (!(key in map)) {
      console.warn(message);
      return defaultValue;
    }
    return map[key];
  }
}
