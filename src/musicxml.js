import {toXML} from 'jstoxml';

export class MusicXML {
  static defaultOptions = {
    'divisions': 768, // divisions of the quarter note: 2^8 * 3^1
    'notehead': 'slash'
  }

  static convert(song, options = {}) {
    const realOptions = Object.assign({}, this.defaultOptions, options);
    return new MusicXML(song, realOptions).musicxml;
  }

  constructor(song, options) {
    this.song = song;
    this.options = options;
    this.tempo = { beats: 4, type: 4 };
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
      .split("T")[0];
  }

  convertSection(annot) {
    let section = annot.slice(1);
    if (section === 'i') section = "Intro";
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
    return {
      'time': [{
        'beats': beats
      }, {
        'beat-type': beatType
      }]
    }
  }

  // Create a chord structure made of harmony and base (dummy) note
  convertChord(chord) {
    // TODO Handle chord.note == 'n' => N.C.
    // TODO Handle alternate chord
    const rootStep = chord.note[0];
    const alterMap = { '#': 1, 'b': -1 };
    const rootAlter = chord.note[1] && chord.note[1] in alterMap ? alterMap[chord.note[1]] : undefined;
    if (chord.note[1] && !rootAlter) {
      console.warn(`[MusicXML::convertChord] Unknown accidental in chord "${chord.note}"`);
    }
    console.log(rootAlter);
    const chordKind = 'major'; // TODO
    const chordText = `${chord.note}${chord.modifiers}` + (chord.over ? `/${chord.over.note}` : '');
    const beats = 1; // TODO
    const noteType = 'quarter'; // TODO
    const noteDuration = beats * this.options.divisions / this.tempo.beats; // TODO

    const harmony = [{
      'root': [{
        'root-step': rootStep
      }, {
        'root-alter': rootAlter
      }],
    }, {
      _name: 'kind',
      _attrs: { 'text': chordText },
      _content: chordKind,
    }];
    const note = [{
      'pitch': [{
        'step': 'B'
      }, {
        'octave': 4,
      }]
    }, {
      'duration': noteDuration
    }, {
      'type': noteType
    }, {
      'notehead': this.options.notehead
    }];
    return { harmony, note };
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
        // Very first bar: add note division.
        if (!measures.length) {
          attributes.push({
            'divisions': this.options.divisions
          });
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
          // TODO Other attributes
          default: console.warn(`[MusicXML::convertMeasures] Unrecognized annotation "${annot}"`);
        }
      });

      // Chords.
      if (cell.chord) {
        if (cell.chord.note == 'x') {
          // TODO Handle bar repeat.
        } else if (cell.chord.note == 'r') {
          // TODO Handle Handle double bar repeat.
        } else if (cell.chord.note == 'W') {
          // TODO Handle invisible root.
        } else {
          // Process new chord. It may change the full `chords` array.
          chords.push(this.convertChord(cell.chord));
        }
      } else {
        // TODO In case of blank chord, add a beat to last chord if any.
      }

      // Close and insert the measure if needed.
      if (cell.bars.match(/(\)|\}|\]|Z)/)) {
        if (attributes.length) {
          measure['_content'].push({
            'attributes': attributes
          });
        }
        chords.forEach(chord => {
          measure['_content'].push({
            'harmony': chord.harmony
          }, {
            'note': chord.note
          })
        });
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
