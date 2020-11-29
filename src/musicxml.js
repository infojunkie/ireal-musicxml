import { toXML } from 'jstoxml';
import { chordParserFactory, chordRendererFactory } from 'chord-symbol';

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
    '-7': ['B', 'E', 'A', 'D', 'G', 'C', 'F']
  }

  static mapRepeats = {
    "D.C. al Coda": MusicXML.prototype.convertDaCapo,
    "D.C. al Fine": MusicXML.prototype.convertDaCapo,
    "D.C. al 1st End.": MusicXML.prototype.convertDaCapo,
    "D.C. al 2nd End.": MusicXML.prototype.convertDaCapo,
    "D.C. al 3rd End.": MusicXML.prototype.convertDaCapo,
    "D.S. al Coda": MusicXML.prototype.convertDalSegno,
    "D.S. al Fine": MusicXML.prototype.convertDalSegno,
    "D.S. al 1st End.": MusicXML.prototype.convertDalSegno,
    "D.S. al 2nd End.": MusicXML.prototype.convertDalSegno,
    "D.S. al 3rd End.": MusicXML.prototype.convertDalSegno,
    "Fine": MusicXML.prototype.convertFine,
    "3x": MusicXML.prototype.convertRepeatNx,
    "4x": MusicXML.prototype.convertRepeatNx,
    "5x": MusicXML.prototype.convertRepeatNx,
    "6x": MusicXML.prototype.convertRepeatNx,
    "7x": MusicXML.prototype.convertRepeatNx,
    "8x": MusicXML.prototype.convertRepeatNx
  }

  static convert(song, options = {}) {
    const realOptions = Object.assign({}, this.defaultOptions, options);
    return new MusicXML(song, realOptions).musicXml;
  }

  constructor(song, options) {
    this.song = song;
    this.options = options;
    this.time = { beats: 4, type: 4 };
    this.fifths = null; // key signature's degree of fifths
    this.measure = null; // current measure (of class Measure) being built
    this.barRepeat = 0; // current bar number for single- and double-bar repeats
    this.codas = []; // list of measures containing codas
    this.repeats = 0; // repeat count for closing repeat barline

    // chord-symbol.
    this.parseChord = chordParserFactory();
    this.renderChord = chordRendererFactory({
      useShortNamings: true,
      printer: 'raw'
    });

    // Perform the conversion right now.
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
      // Attributes.
      if (this.attributes.length) {
        this.body['_content'].push({
          'attributes': MusicXML.reorderSequence(this.attributes, MusicXML.sequenceAttributes)
        });
      }

      // Chords.
      this.chords.forEach(chord => {
        this.body['_content'].push({
          'harmony': chord.harmony
        }, {
          'note': chord.note
        })
      });

      // Barlines.
      this.barlines[0]['_content'] = MusicXML.reorderSequence(this.barlines[0]['_content'], MusicXML.sequenceBarline);
      this.body['_content'].splice(1, 0, this.barlines[0]);
      this.barlines[1]['_content'] = MusicXML.reorderSequence(this.barlines[1]['_content'], MusicXML.sequenceBarline);
      this.body['_content'].push(this.barlines[1]);

      return this.body;
    }
  }

  convertMeasures() {
    // Loop on cells.
    const measures = this.song.cells.reduce( (measures, cell, cellIndex) => {
      // Start a new measure if needed.
      // This means either finding an opening barline or finding non-empty cells while we're not in any measure.
      if (cell.bars.match(/\(|\{|\[/) || (!this.measure && (cell.chord || cell.annots.length || cell.comments.length))) {
        if (this.measure) {
          console.info(`[MusicXML.convertMeasures] Starting a new measure over existing measure ${JSON.stringify(this.measure)}`)
        }
        this.measure = new MusicXML.Measure(measures.length+1);

        // Very first bar: add defaults.
        if (!measures.length) {
          this.measure.attributes.push({
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
            this.measure.body['_content'].push(this.convertTempo(this.song.bpm));
          }
        }

        // Add starting barline.
        this.measure.barlines.push(this.convertBarline(cell.bars, 'left'));

        // If we're still repeating bars, copy the previous bar now.
        if (this.barRepeat) {
          this.measure.chords = [...measures[measures.length-this.barRepeat-1].chords];
        }
      }

      // Short-circuit loop if no measure exists.
      // It can happen that `measure` is still blank in case of empty cells in iReal layout.
      // e.g. Girl From Ipanema in tests.
      if (!this.measure) {
        if (cell.chord || cell.annots.length || cell.comments.length || cell.bars) {
          console.info(`[MusicXML.convertMeasures] Found non-empty orphan cell ${JSON.stringify(cell)}.`);
        }
        return measures;
      }

      // Start new system every 16 cells.
      if (cellIndex % 16 === 0) {
        this.measure.body['_content'].splice(0, 0, { _name: 'print', _attrs: { 'new-system': 'yes' } });
      }

      // Chords.
      if (cell.chord) {
        switch (cell.chord.note) {
          case 'x': {
            // Handle single bar repeat.
            this.barRepeat = 1;
            this.measure.chords = [...measures[measures.length-this.barRepeat].chords];
            break;
          }
          case 'r': {
            // Handle double bar repeat.
            // We do this in 2 stages, because a blank measure occurs after 'r' (to keep the measure count correct)
            // Here, we copy the next-to-last measure and set the repeat flag.
            // The next opening measure will pick up the remaining measure.
            this.barRepeat = 2;
            this.measure.chords = [...measures[measures.length-this.barRepeat].chords];
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
            // eslint-disable-next-line no-fallthrough
          case 'W': {
            // Handle invisible root by copying previous chord.
            let target = this.measure;
            if (!target.chords.length) {
              target = measures.slice().reverse().find(m => m.chords.length);
              if (!target) console.error(`[MusicXML.convertMeasures] Cannot find any measure with chords prior to ${cell.chord}`);
            }
            const chord = target.chords[target.chords.length-1].ireal;
            chord.over = cell.chord.over;
            chord.alternate = cell.chord.alternate;
            this.measure.chords.push(this.convertChord(chord));
            break;
          }
          case ' ': {
            // TODO Handle alternate chord only.
            console.warn(`[MusicXML.convertMeasures] Unhandled empty/alternate chord ${JSON.stringify(cell.chord)}`);
            break;
          }
          default: {
            // Process new chord.
            this.measure.chords.push(this.convertChord(cell.chord));
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
            const ending = parseInt(annot.slice(1));
            this.measure.barlines[0]['_content'].push(this.convertEnding(ending, 'start'));
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

          // Ignore small and large chord renderings.
          case 'l':
          case 's': break;

          case 'f': { // Fermata
            this.measure.chords[this.measure.chords.length-1].fermata = true;
            break;
          }

          case 'U': { // END, treated as Fine.
            this.measure.body['_content'].push(this.convertFine('END'));
            break;
          }

          default: console.warn(`[MusicXML.convertMeasures] Unhandled annotation "${annot}"`);
        }
      });

      // Comments and repeats.
      // TODO Handle measure offset.
      // https://usermanuals.musicxml.com/MusicXML/Content/EL-MusicXML-offset.htm
      cell.comments.map(c => c.trim()).forEach(comment => {
        const repeatFn = MusicXML.getMap(MusicXML.mapRepeats, comment);
        if (repeatFn) {
          this.measure.body['_content'].push(repeatFn.call(this, comment));
        } else {
          this.measure.body['_content'].push(this.convertComment(comment));
        }
      });

      // Close and insert the measure if needed.
      if (cell.bars.match(/\)|\}|\]|Z/)) {
        // Add closing barline and ending if needed.
        this.measure.barlines.push(this.convertBarline(cell.bars, 'right'));
        if (this.measure.barEnding) {
          // In case of numbered repeats, end measure an open repeat by default  ┌──────
          //                                                                     │ 2.
          // It may be replaced later by a closing repeat  ┌───────────┐
          //                                               │ 2.        │
          this.measure.barlines[1]['_content'].push(this.convertEnding(this.measure.barEnding, 'discontinue'));
        }

        // Adjust chord durations.
        this.adjustChordsDuration(this.measure);

        // Get ready for next measure.
        measures.push(this.measure);
        this.measure = null;
        if (this.barRepeat) this.barRepeat--;
      }
      return measures;
    }, []);

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
        console.warn(`[MusicXML.convertMeasures] Cannot find sound direction in measure ${target.number()}`);
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
    }
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
    }
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
    }
  }

  convertComment(comment) {
    const words = comment[0] === '*' ? comment.slice(3) : comment;
    const placement = comment[0] === '*' ? 'above' : 'below';
    return {
      _name: 'direction',
      _attrs: { 'placement': placement },
      _content: {
        'direction-type': {
          'words': words
        }
      }
    }
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

    // Set the current repeat count to 2, which may be changed later if we find a repeat annotation.
    if (repeat === 'forward') {
      this.repeats = 2;
    }

    return {
      _name: 'barline',
      _attrs: { 'location': location },
      _content: [{
        'bar-style': style
      }, { ...(repeat && {
        _name: 'repeat',
        _attrs: { 'direction': repeat, ...(repeat === 'backward' && { 'times': this.repeats }) }
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
          '_name': 'coda'
        }
      }, {
        _name: 'sound',
        _attrs: { 'coda': 'coda' }  // TODO: We assume a single coda
      }]
    }
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
      chord.note = this.convertChordNote(duration, type, dots, chord.fermata);
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

  convertChordNote(duration, type, dots, fermata = false) {
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
    }, { ...(fermata && {
      'notations': {
        _name: 'fermata'
      }})
    }].concat(Array(dots).fill({ _name: 'dot' })), MusicXML.sequenceNote);
  }

  convertChordSymbol(chord) {
    // TODO Handle minor flat-sixth "-b6" chords
    const parsedChord = this.renderChord(this.parseChord(`${chord.note}${chord.modifiers}`));
    if (!parsedChord) {
      console.warn(`[MusicXML.convertChordSymbol] Unrecognized chord "${chord.note}${chord.modifiers}"`);
      return { rootStep: null, rootAlter: null, chordKind: null, chordText: null, chordDegrees: [] }
    }

    const rootStep = parsedChord.input.rootNote[0];
    const rootAlter = MusicXML.getMap(MusicXML.mapAlter, parsedChord.input.rootNote[1] || null, null, `[MusicXML.convertChordSymbol] Unrecognized accidental in chord "${parsedChord.input.rootNote}"`);
    const chordText = parsedChord.input.symbol;

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
    }
    const chordKind = MusicXML.getMap(mapKind, parsedChord.normalized.quality, '', `[MusicXML.convertChordSymbol] Unrecognized chord quality "${parsedChord.normalized.quality}"`);

    const chordDegrees = [];
    if (parsedChord.normalized.isSuspended) {
      chordDegrees.push({
        'degree': [{ 'degree-value': 3, 'degree-alter': parsedChord.normalized.intents.major ? 0 : -1, 'degree-type': 'subtract' }]
      }, {
        'degree': [{ 'degree-value': 4, 'degree-alter': 0, 'degree-type': 'add' }]
      });
    }
    parsedChord.normalized.extensions.forEach(extension => {
      chordDegrees.push({
        'degree': [{ 'degree-value': extension, 'degree-alter': 0, 'degree-type': 'add' }]
      });
    });
    parsedChord.normalized.alterations.map(alteration => {
      if (alteration === 'alt') {
        const mapAlterations = {
          // TODO If fifthFlat is false and fifthSharp is true, then the 5th will not be altered, only added, which is a bug.
          'fifthFlat': { 'degree': [{ 'degree-value': 5, 'degree-alter': -1, 'degree-type': 'alter' }] },
          'fifthSharp': { 'degree': [{ 'degree-value': 5, 'degree-alter': 1, 'degree-type': 'add' }] },
          'ninthFlat': { 'degree': [{ 'degree-value': 9, 'degree-alter': -1, 'degree-type': 'add' }] },
          'ninthSharp': { 'degree': [{ 'degree-value': 9, 'degree-alter': 1, 'degree-type': 'add' }] },
          'eleventhSharp': { 'degree': [{ 'degree-value': 11, 'degree-alter': 1, 'degree-type': 'add' }] },
          'thirteenthFlat': { 'degree': [{ 'degree-value': 13, 'degree-alter': -1, 'degree-type': 'add' }] },
        }
        Object.keys(parsedChord.parserConfiguration.altIntervals).forEach(interval => {
          if (parsedChord.parserConfiguration.altIntervals[interval]) {
            chordDegrees.push(MusicXML.getMap(mapAlterations, interval, null, `[MusicXML.convertChordSymbol] Unrecognized altered interval "${interval}"`));
          }
        })
      }
      else {
        chordDegrees.push({
          'degree': [{ 'degree-value': alteration.slice(1), 'degree-alter': MusicXML.getMap(MusicXML.mapAlter, alteration[0], 0, `[MusicXML.convertChordSymbol] Unrecognized alter symbol in "${alteration}"`), 'degree-type': 'alter' }]
        });
      }
    });
    parsedChord.normalized.adds.forEach(add => {
      const alteration = Object.keys(MusicXML.mapAlter).includes(add[0]) ? add[0] : null;
      const degree = alteration ? add.slice(1) : add;
      chordDegrees.push({
        'degree': [{ 'degree-value': degree, 'degree-alter': MusicXML.getMap(MusicXML.mapAlter, alteration, 0, `[MusicXML.convertChordSymbol] Unrecognized alter symbol in "${add}"`), 'degree-type': 'add' }]
      });
    });
    parsedChord.normalized.omits.forEach(omit => {
      const alteration = Object.keys(MusicXML.mapAlter).includes(omit[0]) ? omit[0] : null;
      const degree = alteration ? omit.slice(1) : omit;
      chordDegrees.push({
        'degree': [{ 'degree-value': degree, 'degree-alter': MusicXML.getMap(MusicXML.mapAlter, alteration, 0, `[MusicXML.convertChordSymbol] Unrecognized alter symbol in "${omit}"`), 'degree-type': 'subtract' }]
      });
    });

    return { rootStep, rootAlter, chordKind, chordText, chordDegrees };
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
      const { rootStep, rootAlter, chordKind, chordText, chordDegrees } = this.convertChordSymbol(chord)

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

    // TODO Convert this to an inner class
    return { harmony, note: this.convertChordNote(duration, type, dots), ireal: chord, spaces: 0, fermata: false };
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
      if (message) console.warn(message);
      return defaultValue || null;
    }
    return map[key];
  }
}
