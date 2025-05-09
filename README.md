# ireal-musicxml
iReal Pro to MusicXML converter.

[![npm version](https://badge.fury.io/js/ireal-musicxml.svg)](https://badge.fury.io/js/ireal-musicxml)
![GitHub Build Status](https://github.com/infojunkie/ireal-musicxml/workflows/Test/badge.svg)

# Demo
[Check out the demo!](https://blog.karimratib.me/demos/chirp/) You can upload one of the [iReal Pro main playlists](https://www.irealpro.com/main-playlists/) as a test.

# Installation
- Install `xmllint` (included in [libxml2](http://www.xmlsoft.org/) on most platforms) - only needed for validation
- `npm install && npm run build`
- `npm test`

# Usage
```javascript
import {
  convertSync,
  convert,
  Playlist,
  Converter
} from 'ireal-musicxml'
const ireal = // Content of HTML file generated by iReal Pro or irealb:// URI
const playlistSync = convertSync(ireal)
const playlistAsync = await convert(ireal)
// => {
//   name:              // Playlist name
//   songs: [{
//     title:           // Title
//     composer:        // Composer
//     style:           // Song style for display
//     groove:          // Song style for playback
//     key:             // Key signature
//     transpose:       // Transposition in semitones
//     bpm:             // Beats per minute
//     repeats:         // Repeat count
//     music:           // Raw song encoding
//     cells: [ Cell ]  // Array of parsed cells
//     musicXml:        // MusicXML output
//   }]
// }

const playlistManual = new Playlist(ireal)
// => Same as above minus `musicXml` attribute.

const musicXml = Converter.convert(playlistManual.songs[0])
// => MusicXML output of the first song in the above playlist.
```

```bash
$ ireal-musicxml test/data/jazz1460.txt --songs=Blues --validate
```

# Theory of operation
This module parses an iReal Pro URI or playlist file, and transforms each song it finds to a MusicXML lead sheet. The conversion process tries to produce a high-fidelity replica of the source sheet by recreating the following aspects of the [iReal Pro format](doc/irealpro.md):

## Harmonic information
The chords found in the iReal Pro song are translated to their MusicXML representation. Because the chords supported by iReal Pro are a subset of the [harmonic expressivity of MusicXML](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/harmony/), this translation is exact. [More information can be found in this blog post](https://blog.karimratib.me/2020/11/30/ireal-musicxml.html#emitting-correct-chord-information).

An additional detail is the handling of "alternate chords" that can be specified in iReal Pro - these also [will be handled in this converter eventually](https://github.com/infojunkie/ireal-musicxml/issues/2).

## Rhythmic information
Because iReal Pro uses a fixed grid for each bar, timing assumptions need to be made about chord onsets, [both in the iReal Pro app itself](https://www.irealb.com/forums/showthread.php?25161-Using-empty-cells-to-control-chord-duration) and in this converter. The [timing algorithm is described in this blog post](https://blog.karimratib.me/2020/11/30/ireal-musicxml.html#emulating-the-ireal-pro-playback-model).

## Layout and styling information
iReal Pro has a distinctive visual sheet style that aims to enhance readability. This converter attempts to recreate this visual style:
- Using rhythmic notation or slash notation to display the chords
- Increasing the size of noteheads and chord names
- Removing uneeded elements from the score, such as clef and staff lines
- Respecting the original positioning of measures to best reflect the structure of the song
- Fitting the score on one page where at all possible

MusicXML support for layout and style is expressive enough to represent all these customizations. Unfortunately, existing engraving software do not support the full set of MusicXML directives, thus recreating the intended style only partially. The (heavy-handed) solution is to go one additional step and [convert the MusicXML output from this present converter to the native format of the desired engraving software](https://github.com/infojunkie/ireal-musicxml/issues/16).

## Backing track information
The backing track patterns of the iReal Pro styles are not documented. Therefore, a mapping is done to support playing back the converted MusicXML scores that replicates or approximates the original iReal Pro playback. This is achieved in 2 phases:

  - First, the MusicXML `sound/play/other-play[@type = 'groove']` element is used to capture the playback style as specified in the iReal Pro song. Because MusicXML does not currently feature a dedicated element to specify the performance style, the generic `other-play` element was [selected to capture this information](https://github.com/w3c/musicxml/discussions/449).

  - Next, the downstream playback component interprets the above MusicXML element to generate a backing track for the score. This is done in [`musicxml-midi`](https://github.com/infojunkie/musicxml-midi) which utilizes an extensive library of "grooves" to map the incoming iReal Pro style to MIDI accompaniment tracks.
