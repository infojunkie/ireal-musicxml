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
          _content: this.song.style
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

  convertMeasures() {
    let measure = null;
    let attributes = null;
    const measures = this.song.cells.reduce( (measures, cell) => {
      console.log(cell);
      // Start a new measure if needed.
      if (cell.bars.match(/(\(|\{|\[)/)) {
        attributes = [];
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

      // TODO Other attributes and chords.

      // Close and insert the measure if needed.
      // It can happen that `measure` is still null in case there were "empty" measures
      // e.g. Girl From Ipanema in tests.
      if (measure && cell.bars.match(/(\)|\}|\]|Z)/)) {
        if (attributes.length) {
          measure['_content'].push({
            'attributes': attributes
          });
        }
        if (!measure['_content'].length) {
          delete(measure['_content']);
        }
        measures.push(measure);
        measure = null;
        attributes = null;
      }
      return measures;
    }, []);
    return measures;
  }
}
