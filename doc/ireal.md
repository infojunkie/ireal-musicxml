# iReal Pro Features

## Sources
- iReal Pro [app](https://irealpro.com/), [forum](https://irealb.com/forums/) and [support docs](https://irealpro.com/support/)
- [`ireal-parse`](https://github.com/realtimerealbook/ireal-parse/blob/master/docs/legend.md)
- [`ireal-renderer`](https://github.com/daumling/ireal-renderer)

## Application model and playback algorithm

- iReal Pro sheets are made of rows of cells
- Each cell can contain a chord and other music annotations such as barlines, time signature, repeats, etc.
- A row contains exactly 16 cells and barlines can be placed on any cell - one cell does NOT correspond to one beat!
- The iReal Pro sequencer generates a playback sequence and detects illegal input (e.g. too many chords in a bar)

## Styles (for display)
```
"Afoxe"
"Afro"
"Baião"
"Ballad"
"Bossa Nova"
"Chacarera"
"Even 8ths"
"Funk"
"Latin"
"Medium Swing"
"Medium Up Swing"
"Pop"
"Pop Ballad"
"Reggae"
"RnB"
"Rock"
"Rock Pop"
"Samba"
"Samba Funk"
"Shuffle"
"Slow Bossa"
"Slow Swing"
"Up Tempo Swing"
"Waltz"
```

## Grooves (for playback)
```
"Jazz": [
  "Afro 12/8"
  "Ballad Double Time Feel"
  "Ballad Even"
  "Ballad Melodic"
  "Ballad Swing"
  "Blue Note"
  "Bossa Nova"
  "Doo Doo Cats"
  "Double Time Swing"
  "Even 8ths"
  "Even 8ths Open"
  "Even 16ths"
  "Guitar Trio"
  "Gypsy Jazz"
  "Latin"
  "Latin/Swing"
  "Long Notes"
  "Medium Swing"
  "Medium Up Swing"
  "Medium Up Swing 2"
  "New Orleans Swing"
  "Second Line"
  "Slow Swing"
  "Swing Two/Four"
  "Trad Jazz"
  "Up Tempo Swing"
  "Up Tempo Swing 2"
]
"Latin": [
  "Argentina: Tango"
  "Brazil: Bossa Acoustic"
  "Brazil: Bossa Electric"
  "Brazil: Samba"
  "Cuba: Bolero"
  "Cuba: Cha Cha Cha"
  "Cuba: Son Montuno 2-3"
  "Cuba: Son montuno 3-2"
]
"Pop": [
  "Bluegrass"
  "Country"
  "Disco"
  "Funk"
  "Glam Funk"
  "Reggae"
  "House"
  "Rock"
  "Rock 12/8"
  "Shuffle"
  "Slow Rock"
  "Smooth"
  "Soul"
  "RnB"
  "Virtual Funk"
]
```

## Key signatures
```
"C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"
"A-", "Bb-", "B-", "C-", "C#-", "D-", "Eb-", "E-", "F-", "F#-", "G-", "G#-"
```

## Cells
```
"T44" - time signature 44
"(N1|N2|N3)chord" - first and second house (represents ONE BAR ONLY, see
I Got Rhythm, Like Someone In Love, On the Sunny Side of the Street, Misty)
"XyQ" - blank space for row alignment
"x" - repeat previous bar (see Butterfly)
"Kcl" or "XyQKcl" - also repeat previous bar (Besame Mucho, Butterfly, Solar)
"r" - repeat previous 2 bars (see Mas Que Nada)
"()" - alternative chord written in small (above actual chord)
" " - represents a chord seperator
"," - equivalent to space, especially for whole notes in 44
"<stuff here>" - comments (see La Fiesta)
"*A" - section A (could be *B, *C, *i, *v etc)
"S" - segno (see Butterfly)
"Q" - coda (see Butterfly)
"Y" - vertical spacer (see Nearness of You, Night in Tunisia)
"U" - ?? (see Mas Que Nada, Scrapple From The Apple, Triste, Wave)
```

## Barlines
```
"[" - start double barline
"]" - end double barline
"{" - start repeat
"}" - end repeat
"LZ" - normal barline
"|" - also normal barline (see Au Privave, Stormy Weather)
"Z" - end double barline (that has a bolded second line)
```

## Comments and free text
```
"D.C. al Coda"
"D.C. al Fine"
"D.C. al 1st End."
"D.C. al 2nd End."
"D.C. al 3rd End."
"D.S. al Coda"
"D.S. al Fine"
"D.S. al 1st End."
"D.S. al 2nd End."
"D.S. al 3rd End."
"Fine"
"3x"
"4x"
"4x"
"6x"
"7x"
"8x"
```

## Time signatures
```
"2/4"
"3/4"
"4/4"
"5/4"
"6/4"
"7/4"
"3/8"
"5/8"
"6/8"
"7/8"
"9/8"
"12/8" (represented as "12")
"2/2"
"3/2"
```

## Chords and modifiers
### Roots
```
"Cb", "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"
```

### Inversions (aka bass notes)
```
"/Cb", "/C", "/C#", "/Db", "/D", "/D#", "/Eb", "/E", "/F", "/F#", "/Gb", "/G", "/G#", "/Ab", "/A", "/A#", "/Bb", "/B"
```

### Quality
```
"^7", "-7", "7", "7sus"
"^", "-", "7alt", "sus"
"6", "-6", "o7", "ø7"
"^9", "-9", "9", "9sus"
"^13", "-11", "13", "13sus"
"6/9", "-6/9", "-^7", "-^9"
"^7#11", "^9#11", "-b6", "-#5"
"^7#5", "add9", "-7b5", "ø9"
"2", "5", "+", "o", "ø"
"7b9", "7#9", "7b5", "7#5"
"7b13", "7#11", "9#11", "13#11"
"11", "7b9sus", "7b13sus", "7add3sus"
"9b5", "9#5", "13b9", "13#9"
"7b9b13", "7b9#5", "7b9b5", "7b9#9"
"7#9#5", "7#9b5", "7#9#11", "7b9#11"
```

### Other
```
"W" - nothing (see Butterfly "ppsW/C")
"n" - N.C (see Butterfly)
"p" - slash
"s" - small chord (eg sC^7)
"l" - large chord (eg lC^7)
"f" - pause (see Butterfly, Summer Serenade)
```
