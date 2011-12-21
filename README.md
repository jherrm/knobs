Knob.js
========

### Javascript Library for Multitouch Virtual Knobs ###

Knob.js makes it easy to include multitouch virtual knobs in your web app.

Knob.js does the heavy lifting for things like:

*    Minimum/maximum angle & value constraints.
*    Figuring out the position and angle of the indicator dot.
*    Doing the math for displaying custom rendered knobs using image sprites.

Knob.js is a purely logical component - rather than drawing or moving things around, it only crunches the numbers and gives back positions and angles. This means that you can render your virtual knobs using CSS, &lt;canvas&gt;, &lt;svg&gt;, or however you like.

- - -

### Gesture support ###

Knob.js recognizes spinning and sliding gestures. Spin the knob and it follows your finger. Start sliding up/down or left/right and it locks into the direction and acts like a slider. Mouse interaction including scrolling is also supported.

<img src="http://jherm.github.com/knobs/images/gestures_diagram.png" />

- - -

### Demos ###

<!--
**Simple Knob:**
<a href="http://jherrman.com/knobs/demo/css.html">CSS</a>
 | <a href="http://jherrman.com/knobs/demo/canvas.html">canvas</a>
 | <a href="http://jherrman.com/knobs/demo/svg.html">SVG</a>
<!--
 | <a href="http://jherrman.com/knobs/demo/sprites.html">Image Sprites</a>
 | <a href="http://jherrman.com/knobs/demo/webgl.html">WebGL</a>
-->


**Indicator Showcase:**
<a href="http://jherrman.com/knobs/demo/css.html">CSS</a>
 | <a href="http://jherrman.com/knobs/demo/canvas.html">canvas</a>
 | <a href="http://jherrman.com/knobs/demo/svg.html">SVG</a>
<!--
 | <a href="http://jherrman.com/knobs/demo/sprites.html">Image Sprites</a>
 | <a href="http://jherrman.com/knobs/demo/webgl.html">WebGL</a>
-->

**More demos coming soon**
<!--
**For Sadists:**
<a href="http://jherrman.com/knobs/demo/flash.html">Flash</a>  |  <a href="http://jherrman.com/knobs/demo/java.html">Java</a>
-->

- - -

### Usage ###

Download the [minified library](http://jherm.github.com/knobs/build/Knob.js) and include it in your html.


```html
	<script src="js/Knob.js"></script>
```

<!--
	Default orientation: 0 starting on the right side, increasing as it is turned counter-clockwise.
-->

This code creates a knob that goes from zero to eleven, starting at 220 degrees and going to -40 degrees (that's 8 o'clock to 4 o'clock for people that like thinking in clockfaces).

```html
	<script>

	var knob = new Knob(function(knob, angle, val, indicator, spriteOffset) {
		// apply knob/indicator position/angle to UI
	}, {
		angleStart: 220, // (~8 o'clock)
		angleEnd: -40,   // (~4 o'clock)
		valueMin: 0,
		valueMax: 11 // this one goes to eleven
	});

	</script>
```

- - -

### Acknowledgements ###

Knob.js wouldn't be here without Apple's Garageband for iOS. The designers/developers really put a lot of thought into the way a virtual knob should work. Thanks.

The layout of the javascript was heavily influenced by <a href="http://github.com/zynga/scroller">Zynga's Scroller</a>.
