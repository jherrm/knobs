Knob.js
========

### Javascript Library for Multitouch Virtual Knobs ###

Knob.js makes it easy to include multitouch virtual knobs in your web app.

For demos and the story behind Knob.js, check out **[🎛 How Apple Designs a Virtual Knob](http://jherrm.github.io/knobs)**

Knob.js does the heavy lifting for things like:

*    Minimum/maximum angle & value constraints.
*    Figuring out the position and angle of the indicator dot.
*    Doing the math for displaying custom rendered knobs using image sprites.

Knob.js is a purely logical component - rather than drawing or moving things around, it only crunches the numbers and gives back positions and angles. This means that you can render your virtual knobs using CSS, &lt;canvas&gt;, &lt;svg&gt;, or however you like.

- - -

### Gesture support ###

Knob.js recognizes spinning and sliding gestures. Spin the knob and it follows your finger. Start sliding up/down or left/right and it locks into the direction and acts like a slider. Mouse interaction including scrolling is also supported.

<img src="https://raw.githubusercontent.com/jherrm/knobs/main/demo/asset/gestures_diagram.svg" />

- - -

### Usage & Demos ###

The easiest way to get started is to check out the various demos here
- <a href="https://jherrm.github.io/knobs/css.html">CSS Knobs</a>
- <a href="https://jherrm.github.io/knobs/canvas.html">Canvas Knobs</a>
- <a href="https://jherrm.github.io/knobs/svg.html">SVG Knobs</a>
- <a href="https://jherrm.github.io/knobs/sprites.html">Sprite Knobs</a>

More demos in the post **[🎛 How Apple Designs a Virtual Knob](http://jherrm.github.io/knobs)**

- - -

### Acknowledgements ###

Knob.js wouldn't be here without Apple's Garageband for iOS. The designers/developers really put a lot of thought into the way a virtual knob should work. Thanks.

The layout of the javascript was heavily influenced by <a href="http://github.com/zynga/scroller">Zynga's Scroller</a>.
