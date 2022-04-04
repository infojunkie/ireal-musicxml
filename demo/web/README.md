# Web Demo

Web app to load an iReal Pro playlist from file or `ireal://` URI and display its sheets using [OpenSheetMusicDisplay](https://opensheetmusicdisplay.github.io/), [Verovio](https://www.verovio.org/index.xhtml), and other renderers.

# Usage

- `npm install && npm run develop`
- For MIDI conversion and playback, clone [`musicxml-mma`](https://github.com/infojunkie/musicxml-mma) and run `npm install && npm run develop` there.
- Open [http://localhost:9000/](http://localhost:9000/)

# Theory of operation

This demo grew from a simple showcase of the iReal Pro to MusicXML conversion library in this repo, to a full-fledged sheet music player, on its way to realize the vision of a musician's practice toolkit, currently codenamed ["Gig Book"](https://github.com/users/infojunkie/projects/2). It brings together a number of music technologies:

- [MusicXML](https://github.com/w3c/musicxml) as the standard for music notation exchange.
- [Web MIDI](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API) and [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) as powerful music-making Web APIs.
- [OpenSheetMusicDisplay (OSMD)](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay) / [VexFlow](https://github.com/0xfe/vexflow) and [Verovio](https://github.com/rism-digital/verovio) as mature music notation engines for the Web.
- [Musical MIDI Accompaniment (MMA)](https://www.mellowood.ca/mma/) as a programmable accompaniment generator using MIDI.
- A number of well-suuported JavaScript libraries for MIDI and Web Audio, including [`midi-player`](https://github.com/chrisguttandin/midi-player), [`webaudiofont`](https://github.com/surikov/webaudiofont/).

On my side, I developed the following modules to supplement the above and tie them together:
- [`ireal-musicxml`](https://github.com/infojunkie/ireal-musicxml) to convert the treasure trove of lead sheet content created by the [iReal Pro community](https://www.irealpro.com/main-playlists/) into MusicXML where it can be edited and replayed by the many tools that support the standard.
- [`musicxml-mma`](https://github.com/infojunkie/musicxml-mma) to convert MusicXML sheets into a format that the Musical MIDI Accompaniment (MMA) tool can process and convert to MIDI.
- The [demo included here](https://blog.karimratib.me/demos/musicxml/) that ties everything together:
  - Accept iReal Pro and MusicXML files as input
  - Display them using OSMD or Verovio
  - Convert them to MIDI
  - Playback the MIDI file in synchronization with the score
  - Send the MIDI output to external synths or to one that is included here
