# iReal Pro notes
Lots lifted from [`ireal-parse`](https://github.com/realtimerealbook/ireal-parse/blob/master/docs/legend.md)

## Styles
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

## Key signatures
```
"C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"
"A-", "Bb-", "B-", "C-", "C#-", "D-", "Eb-", "E-", "F-", "F#-", "G-", "G#-"
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

## Bars
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

## Comments
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

### Other
```
"W" - nothing (see Butterfly "ppsW/C")
"n" - N.C (see Butterfly)
"p" - slash
"s" - small chord (eg sC^7)
"l" - large chord (eg lC^7)
"f" - pause (see Butterfly, Summer Serenade)
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
