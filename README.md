# Textual - Minimal livecoding language to display text

## Local server

How to start a local server:

```bash
npx serve --cors
```

## Including Textual in Estuary

```js
!exolang "textual" "http://localhost:3000/exolang.js"
```

```js
!exolang "textual" "https://textual.savamala.top/exolang.js"
```

Tell Estuary that you are using Textual by starting your code with this line:

```js
##textual
```

## Performance

Textual renders on a fullscreen 2D canvas. Performance varies significantly between browsers and it's much better in chrome/chromium than in firefox.

## Displaying text

Display a text in the middle of the screen with default settings:

```js
text("Hello, world!").out();
```

`text` supports multi-line text:

```js
text("Hello,\nTextual!").out();
```

```js
text(`Hello,
Textual!`).out();
```

Size:

```js
text("Hello, Textual!").size(200).out();
```

Position:

```js
text("Textual").move(-.4, .5).out()
```

```js
text("Textual").move(-.4, .5*Math.sin(time)).out()
```

Color:

RGB from 0 to 1:

```js
text("Textual").color(.5, 0, .5).out()
```

RGBA:

```js
text("Textual").color(.5, 0, .5, .4).out()
```

Feedback:

```js
fb(0.98);
text("Textual").move(-.4, .5*Math.sin(time)).color(.5,0,.3).out()
```

Emojis:

```js
text(":moon :sun :water :fire :heart :mercury").size(100).out()
```

Font family:

```js
text('Textual').font('wingdings').out();
```

Rotation:

```js
text("textual").spin(.2).move(.2,.2).out()
text("textual").spin(time/4%2).out()
```

In `spin()` 1 is PI radiants.

Stroke:

By default, text is filled. Use `.stroke()` to render it as an outline:

```js
text('textual').stroke(3).size(200).color('blue').out()
text('textual').size(200).color('pink').out()
```

Shadow:

Adds a shadow to the text. Arguments follow Canvas's `setShadow` order: `shadow(x, y, blur, color)`:

```js
text("textual").shadow().out()                    // 2, 2, 4, gray
text("textual").shadow(4, 4).out()                // 4, 4, 4, gray
text("textual").shadow(4, 4, 8, "purple").out()
```

Shadows are expensive on the 2D canvas, especially with large fonts.
Use them sparingly in live performances.

## Oscillators

All oscillators take a frequency in Hz. To synchronize with the tempo, pass `cps`:

```js
osc(1)              // 1 Hz, free-running
osc(cps)            // one cycle per beat
saw(cps * 2)        // sawtooth, two cycles per beat
tri(cps)            // triangle
sqr(cps / 2)        // square
```

Oscillator phase is anchored to the current tempo reference, so changing the tempo (e.g. with tap tempo) resets the phase.

```js
text('textual').move(0,osc(cps)).out()
text(":moon").spin(saw(0.5)).size(500).out()
text(":moon").spin(saw(-0.5)).size(500).out()
fb(.9)
```

## Using Textual alongside with Punctual

In Estuary, use two cells, one for Punctual and one for Textual.

Force the creation of the Punctual canvas first, as it is opaque:

```haskell
hline 0 0.001 >> add;
```

Load Textual by using any sentence:

```js
##textual
text('Hello, Punctual!').out()
```

Now, you can redirect your text into a stream:

```js
text('Hello, Punctual!').out('my-stream')
```

The text is now invisible. Get it from Punctual:

```haskell
v << vid "stream://my-stream";
v >> add;
```

Add any Punctual effects and enjoy!

This method uses a very hacky approach, because Punctual doesn't support streams right now, and it depends on loading Textual before Punctual accesses any video.
