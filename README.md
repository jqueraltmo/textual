<!-- LTeX: language=en-US -->
# Textual - A minimal live-coding language for displaying text

## Local server

To start a local server, run:

```bash
npx serve --cors
```

## Using Textual in Estuary

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

Textual renders on a full-screen 2D canvas. Performance varies significantly between browsers; it is much better in Chrome/Chromium than in Firefox.

## Displaying text

Display text in the center of the screen with the default settings:

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

Emojis:

```js
text(":moon :sun :water :fire :heart :mercury").size(100).out()
```

Font family:

By default, Textual uses the platform's sans-serif font. You can choose a specific font with `.font()`:

```js
text('Textual').font('wingdings').out();
```

When no font is specified, zalgo text uses Helvetica (with Arial and sans-serif as fallbacks). If you set a font explicitly, zalgo will use it even if the marks do not render well.

Stroke:

By default, text is filled. Use `.stroke()` to render it as an outline:

```js
text('textual').stroke(3).size(200).color('blue').out()
text('textual').size(200).color('pink').out()
```

Shadow:

Adds a shadow to the text. The arguments follow Canvas's `setShadow` order: `shadow(x, y, blur, color)`:

```js
text("textual").shadow().out()                    // 2, 2, 4, gray
text("textual").shadow(4, 4).out()                // 4, 4, 4, gray
text("textual").shadow(4, 4, 8, "purple").out()
```

Shadows are expensive on the 2D canvas, especially with large fonts.
Use them sparingly in live performances.

Zalgo:

Adds combining diacritical marks to the text for a glitchy or chaotic look. The optional arguments are the average number of marks per character (default 5) and the random seed:

```js
text("textual").zalgo().out()                // seed 0, always the same result
text("textual").zalgo(5, 1).out()            // another variant
text("textual").zalgo(20).out()              // more marks
```

Hack:

Substitutes characters with similar alternatives. The optional arguments are the probability of each character being changed (default 0.3) and the random seed:

```js
text('textual').hack().out();               // seed 0, always the same result
text('textual').hack(.6, time*2).out();     // changes two times per second (seed is integer)
text('textual').hack().zalgo().out();       // can be combined with other effects
```

Based on [text-hacker](https://github.com/geikha/text-hacker/) by GEIKHA (Apache License).

## Transformations

These transformations can be applied to any element.

Position:

```js
text("Textual").move(-.4, .5).out()
```

```js
text("Textual").move(-.4, .5*Math.sin(time)).out()
```

Color:

RGB values from 0 to 1:

```js
text('Textual').color(.5, 0, .5).out()
text('textual').color([.7,.3,.4]).out()
```

RGBA:

```js
text('Textual').color(.5, 0, .5, .4).out()
text('textual').color([.7,.3,.4,.5]).out()
```

Color names:

```js
text('textual').color('cyan').out()
text('textual').color(seq('cyan','orange')).out()
```

Rotation:

```js
text("textual").spin(.2).move(.2,.2).out()
text("textual").spin(time/4%2).out()
```

In `spin()`, 1 equals PI radians.

Zoom:

```js
text('textual').zoom(3,8).out()
text('textual').zoom(seq(1,10).smooth(),1).out()
```

Arbitrary transformations:

Apply any transformation you like by directly accessing the canvas context and calling its native methods:

```js
text('textual').stroke(1).size(100).transform(ctx=>{
  ctx.rotate((time/3)%2*Math.PI);
  ctx.translate(seq(0,300).slow(12.31).smooth(),4);
  ctx.rotate((time/4)%2*Math.PI);
}).out()
```

```js
text(':fire_emoji').
transform(ctx => {
ctx.rotate(Math.PI*saw(.2));
ctx.translate(200,0);
ctx.rotate(-1*Math.PI*saw(.2));
}).out()
fb(.92)
```

Or use `matrix` to provide a custom transformation matrix:

```js
text('textual').matrix(8,3,3,5,0,0).out()
```

`matrix` has six optional parameters (`a=1`, `b=0`, `c=0`, `d=1`, `e=0`, and `f=0`) that define the affine transformation to be applied:

```
| a  c  e |
| b  d  f |
| 0  0  1 |
```

Examples:

- Non-uniform scale: `text('textual').matrix(2, 0, 0, 0.5).out()`, wide and flat text.
- Shear: `text('textual').matrix(1, 0.3, 0, 1).out()`, slanted text, as if you pushed it.
- Rotation:

```js
const a = Math.PI / 4; // const a = time;
text("textual").matrix(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a)).out();
```

- Reflection: `text('textual').matrix(-1, 0, 0, 1).out()`, mirrored text.
- Chaotic transform: `text("textual").matrix(Math.cos(time), Math.cos(time*3), -Math.sin(time), Math.cos(time)).out()`;

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

## Reescaling values

- `bipolar`: from [0, 1] to [-1, 1].
- `unipolar`: from [-1, 1] to [0, 1].
- `remap`: from [-1, 1] to [a, b].
- `linlin`: from [a, b] to [c, d].

```js
text('textual').color(unipolar(saw(.2)), 0, 0).out()
text('textual').color(unipolar(saw([.06, .13, .19]))).out()

text('textual').spin(remap(osc(-.19), -.1, .1)).
  move(remap(osc(.19), -.5, .5)).out()
text('textual').zalgo(remap(tri(.018),1,50)).out()
```

## Feedback

Feedback allows keeping the image obtained in the previous frame in the current frame.

`fb(keep)` where `keep` is a number from 0 (keep nothing) to 1 (keep all).

```js
fb(0.98);
text("Textual").move(-.4, .5*Math.sin(time)).color(.5,0,.3).out()
```

## Sequences

`seq(1, 2, 3)` cycles through the given values, one full pass per cycle, synchronized with Estuary's tempo.

```js
text("textual").move(seq(-0.5, 0, 0.5), 0).out()
```

Modifiers can be chained:

```js
seq(1, 2, 3).fast(2)          // two passes per cycle
seq(1, 2, 3).slow(2)          // half a pass per cycle
seq(1, 2, 3).offset(1)        // start from the second value
seq(1, 2, 3).smooth()         // interpolate instead of stepping
seq(1, 2, 3).fast(2).smooth() // combined
```

The array form `seq([1, 2, 3])` is also accepted and is useful when the values come from a variable:

```js
const vals = [50, 100, 200];
text(":heart").size(seq(vals).smooth()).out()
```

## Bézier curves

Curve:

A simple curve with origin (0,0). The first two arguments are the end point, and the third is the bend.

```js
curve(1, 0).out()                       // straight line
curve(1, 0, 0.3).out()                  // an arc
curve(1, 0, osc(0.5) + 0.5).out()       // oscillating arc
curve(osc(.3), osc(.23), 0.2).out()     // moving end point
curve(1, 1, 0.3).stroke(6).out()        // diagonal, wide stroke
curve(1, 1, 0.3).move(-0.5, -0.5).out() // moved
curve(1, 0, osc(0.3)).fill().out()      // filled
```

Bézier curves have two colors: one for the fill and one for the stroke:

```js
curve(1, 0, osc(.2)).fill().fillColor("navy").stroke(4).strokeColor("cyan").out()
curve(1, 0, osc(.2)).fill().fillColor("red").stroke(0).out()
curve(1, 0, osc(.2)).fill().color("red").stroke(12).out() // both are red
```

sCurve:

An S-shaped curve with origin (0,0). The first two arguments are the end point, and the third is the bend.

```js
sCurve(1, 0).out()
sCurve(1, 0.5, 0.3).out()
sCurve(1, 0, 0.5).color("cyan").stroke(4).out()
sCurve(1, 0, osc(0.5) + 0.5).out()
sCurve(1, 0, seq(0.2, 0.5, 1).smooth()).out()
sCurve(1, 0, 0.5).spin(time).out()
```

Bézier:

A quadratic or cubic Bézier curve.

```js
// Quadratic (3 points: start, control, end)
bezier([0,0], [0.5, 0.5], [1, 0]).out()
bezier([0,0, 0.5,0.5, 1,0]).out()       // flat array
bezier(0, 0, 0.5, 0.5, 1, 0).out()      // flat args

// Cubic (4 points: start, control1, control2, end)
bezier([0,0], [0.3,0.3], [0.8,0], [1,0]).out()
bezier([0,0, 0.3,0.3, 0.8,0, 1,0]).out()
bezier(0,0, 0.3,0.3, 0.8,0, 1,0).out()
```

## Using Textual with Punctual

In Estuary, use two cells: one for Punctual and one for Textual.

Force the creation of the Punctual canvas first, because it is opaque:

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

This method uses a very hacky approach because Punctual does not support streams yet, and it depends on loading Textual before Punctual accesses any video.
