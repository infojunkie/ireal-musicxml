export class MusicXML {
  static convert(song) {
    return `
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 2.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
    <score-partwise version="2.0">
      <movement-title>${song.title}</movement-title>
      <identification>
        <creator type="composer">${song.composer}</creator>
        <creator type="lyricist">${song.style}</creator>
        <encoding>
          <software>scalextric</software>
          <encoding-date>${MusicXML.convertDate()}</encoding-date>
          <supports element="accidental" type="no"/>
          <supports element="transpose" type="no"/>
          <supports attribute="new-page" element="print" type="yes" value="yes"/>
          <supports attribute="new-system" element="print" type="yes" value="yes"/>
        </encoding>
      </identification>
      <defaults>
        <scaling>
          <millimeters>7</millimeters>
          <tenths>40</tenths>
        </scaling>
        <page-layout>
          <page-height>1700</page-height>
          <page-width>1200</page-width>
          <page-margins type="both">
            <left-margin>72</left-margin>
            <right-margin>72</right-margin>
            <top-margin>72</top-margin>
            <bottom-margin>72</bottom-margin>
          </page-margins>
        </page-layout>
        <system-layout>
          <system-margins>
            <left-margin>22</left-margin>
            <right-margin>0</right-margin>
          </system-margins>
          <system-distance>100</system-distance>
          <top-system-distance>73</top-system-distance>
        </system-layout>
        <appearance>
          <line-width type="beam">5</line-width>
          <line-width type="heavy barline">5</line-width>
          <line-width type="leger">1.5625</line-width>
          <line-width type="light barline">1.5625</line-width>
          <line-width type="slur middle">2.1875</line-width>
          <line-width type="slur tip">0.625</line-width>
          <line-width type="staff">0.9375</line-width>
          <line-width type="stem">0.9375</line-width>
          <line-width type="tie middle">2.1875</line-width>
          <line-width type="tie tip">0.625</line-width>
          <note-size type="grace">60</note-size>
          <note-size type="cue">75</note-size>
        </appearance>
        <music-font font-family="Opus,music"/>
        <word-font font-family="Times New Roman"/>
      </defaults>
      <part-list>
        <score-part id="P1">
          <part-name print-object="no">Lead sheet</part-name>
        </score-part>
      </part-list>
        <!--=========================================================-->
      <part id="P1">
      ${MusicXML.convertMeasures(song)}
      </part>
    </score-partwise>
    `.trim();
  }

  static convertDate() {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset*60*1000))
    return adjustedDate.toISOString().split('T')[0]
  }

  static convertMeasures(song) {
    return song.cells.reduce( (measures) => {
      // TODO
      return measures;
    }, []).join('');
  }
}
