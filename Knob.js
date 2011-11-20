var Knob;
(function() {

	/**
	 *   Default
	 * Orientation
	 *	   270
	 *	180 + 0
	 *	   90
	 **/

	Knob = function(callback, options) {

		this.__callback = callback;

		this.options = {

			/** Enable turning of the knob in a circular motion */
			gestureSpin: true,

			/** Enable turning of the knob in a horizontal sliding motion */
			gestureSlideX: true,

			/** Enable turning of the knob with a vertical sliding motion */
			gestureSlideY: true,

			/** During spin gestures, point the indicator to the finger as it spins */
			// followFinger: true,

			/** Which way the knob turns to increase the value */
			direction: 'cw', /* cw = clockwise, ccw = counter-clockwise */

			/** Angle where the minimum value is if knob has bounds */
			angleMin: Number.NEGATIVE_INFINITY,

			/** Angle where the maximum value is if knob has bounds */
			angleMax: Number.POSITIVE_INFINITY,

			/** Maximum value the knob can go up to */
			valueMin: Number.NEGATIVE_INFINITY,

			/** Maximum value the knob can go up to */
			valueMax: Number.POSITIVE_INFINITY,

			/**
			 *	How much the value increases per degree turned.
			 *  Automatically set if both valueMax/valueMin aren't +/- infinity.
			 **/
			angleValueRatio: 1,

			/** How much the angle increases per pixel moved during the slide */
			angleSlideRatio: 1,

			/** Number of pixels the rotational center of the knob is shifted from element's center along the X axis */
			centerOffsetX: 0,

			/** Number of pixels the rotational center of the knob is shifted from element's center along the Y axis */
			centerOffsetY: 0,



			/*
			---------------------------------------------------------------------------
				INDICATOR OPTIONS
			---------------------------------------------------------------------------
			*/

			/** Path to indicator image */
			indicatorImagePath: '',

			/** Automatically rotate the indicator based on the angle */
			indicatorAutoRotate: false,

			/** Automatically position the indicator around the rotational center */
			indicatorAutoPosition: false,

			/**
			 * The distance of the indicator from the rotational center.
			 * Only used when indicatorAutoPosition is true.
			 **/
			indicatorRadius: 0,



			/*
			---------------------------------------------------------------------------
				IMAGE/SPRITE OPTIONS
			---------------------------------------------------------------------------
			*/

			/** Path to background image or sprite */
			imagePath: '',

			/** Width of the image or individual images in the sprite */
			imageWidth: 67, /* (default to Apple's standard size in GarageBand) */

			/** Height of the image or individual images in the sprite */
			imageHeight: 67, /* (default to Apple's standard size in GarageBand) */

			/** Angle of the image (or 1st sprite image) relative to the default orientation */
			imageAngle: 0,

			/** Number of images in the sprite */
			imageCount: 1,

			/** Number of degrees turned between each image in the sprite */
			imageSeparationAngle: 3,

			/** The thickness of the gap surrounding images in the sprite */
			imageSeparationGap: 0,

			/** Which way the knob images turn when going from left to right in the sprite */
			imageDirection: 'cw', /* cw = clockwise, ccw = counter-clockwise */

		};

		for (var key in options) {
			this.options[key] = options[key];
		}
	};

	var members = {

		// how many locations to sample before locking gesture best guess
		__sampleSize: 40,

		__step: 1,

		// angle of the entire knob relative to the default orientation
		__rotation: 0,

	}

	for (var key in members) {
		Knob.prototype[key] = members[key];
	}
})();