var Knob;
(function() {

	/**
	 *   Default
	 * Orientation
	 *	   90
	 *	180 + 0
	 *	   270
	 **/

	Knob = function(callback, options) {
		this.__callback = callback;

		this.options = {

			/** Enable turning of the knob in a circular motion */
			gestureSpinEnabled: true,

			/** Enable turning of the knob in a horizontal sliding motion */
			gestureSlideXEnabled: true,

			/** Enable turning of the knob with a vertical sliding motion */
			gestureSlideYEnabled: true,

			/** During spin gestures, point the indicator to the finger as it spins */
			// followFinger: true,

			/** Setting this will prevent the knob from turning below this angle */
			angleStart: Number.NEGATIVE_INFINITY,

			/** Setting this will prevent the knob from turning past this angle */
			angleEnd: Number.POSITIVE_INFINITY,

			/** The minimum value the knob can go down to */
			valueMin: Number.NEGATIVE_INFINITY,

			/** The maximum value the knob can go up to */
			valueMax: Number.POSITIVE_INFINITY,
			// valueMax: 11, // This one goes to eleven.

			/**
			 * How much the value increases per degree turned.
			 * Only used if both angleStart/End and valueMax/valueMin
			 * are NOT +/- Infinity.
			 **/
			angleValueRatio: 0.1,

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

			/** Angle the inicator is at when first rendered */
			indicatorStartAngle: 0,

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
				SPRITE OPTIONS
			---------------------------------------------------------------------------
			*/

			/** Width of the image or individual images in the sprite */
			spriteWidth: 67, /* (default to Apple's standard size in GarageBand) */

			/** Height of the image or individual images in the sprite */
			spriteHeight: 67, /* (default to Apple's standard size in GarageBand) */

			/** Number of images in the sprite */
			spriteCount: 1,

			/** Which way the images turn when viewing left to right in the sprite */
			spriteDirection: 'ccw', /* cw = clockwise, ccw = counter-clockwise */

			/** Angle of the 1st sprite image relative to the default orientation */
			spriteStartAngle: 0,

			/** Number of degrees turned between each image in the sprite */
			spriteSeparationAngle: 3,

			/** The thickness of the gap surrounding images in the sprite */
			spriteSeparationGap: 0,

		};

		for (var key in options) {
			this.options[key] = options[key];
		}

		if(this.options.valueMin > this.options.valueMax) {
			throw new Error("valueMin must be less than valueMax");
		}

	};

	/*
	---------------------------------------------------------------------------
		PRIVATE FUNCTIONS
	---------------------------------------------------------------------------
	*/

	/**
	 * Convenience function to map a variable from one coordinate space
	 * to another.
	 * Thanks to http://www.trembl.org/codec/737/
	 *
	 * @param value {Number} value
	 * @param istart {Number} Lower boundary of first coordinate space
	 * @param istop {Number} Higher boundary of first coordinate space
	 * @param ostart {Number} Lower boundary of second coordinate space
	 * @param ostop {Number} Higher boundary of second coordinate space
	 *
	 * @return {Number} The value mapped from the first coordinate space
	 * to the latter.
	 */
	function map(value, istart, istop, ostart, ostop) {
		return ostart + (ostop - ostart) * ((value - istart)/(istop - istart));
	}

	/**
	 * Convenience function to constrain a value between two numbers.
	 *
	 * @param value {Number} value
	 * @param low {Number} Lower number boundary
	 * @param high {Number} Higher number boundary
	 *
	 * @return {Number} A number from low to high.
	 */
	function constrain(value, low, high) {
		if(low > high) {
			var tmp = low;
			low = high;
			high = tmp;
		}
		return (value < low) ? low : ((value > high) ? high : value);
	};

	/**
	 * Convenience function to see if a number isn't +/- Infinity
	 *
	 * @param value {Number} value
	 *
	 * @return {Boolean} true if value isn't +/- Infinity
	 */
	function isReal(value) {
		return (value != Number.NEGATIVE_INFINITY && value != Number.POSITIVE_INFINITY);
	}

	/**
	 * Convert degrees to radians.
	 *
	 * @param degrees {Number} Angle in degrees
	 *
	 * @return {Number} Angle in radians
	 **/
	function toRadians(degrees) {
		return degrees*(Math.PI/180);
	};

	/**
	 * Convert radians to degrees.
	 *
	 * @param radians {Number} Angle in radians
	 *
	 * @return {Number} Angle in degrees
	 **/
	function toDegrees(radians) {
		return radians*(180/Math.PI);
	};

	/**
	 * Get the smallest distance between two angles.
	 *
	 * @param angle1 {Number} First angle in degrees
	 * @param angle2 {Number} Second angle in degrees
	 *
	 * @return {Number} Angle distance in degrees
	 **/
	function angleDistance(angle1, angle2) {
		var d = Math.abs(angle1 - angle2) % 360;

		return d > 180 ? 360 - d : d;
	}

	/**
	 * Returns true if angle is increasing.
	 * An angle is increasing if going from a lower
	 * number to a higher number or if the angle
	 * crosses bottom to top (e.g. 358 -> 2).
	 *
	 * @param prevAngle {Number} Previous angle in degrees
	 * @param nextAngle {Number} Next angle in degrees
	 *
	 * @return {Boolean} True if the angle is increasing
	 **/
	function isAngleIncreasing(prevAngle, nextAngle) {
		var lowerBound = 30,
			upperBound = 360 - lowerBound;

		if(prevAngle < lowerBound && nextAngle > upperBound) {
			return false;
		} else if(prevAngle > upperBound && nextAngle < lowerBound) {
			return true;
		} else {
			return prevAngle < nextAngle;
		}
	}

	/**
	 * Normalize the angle to 0 - 360.
	 *
	 * @param angle {Number} Angle in degrees
	 *
	 * @return {Number} Normalized angle
	 **/
	function normalizeAngle(angle) {

		// get normalized base angles by chopping off any previous turns
		var normalized = angle % 360;

		// ensure the normalized angle is positive
		while (normalized < 0) { normalized += 360; }

		return normalized;
	};



	var members = {

		/*
		---------------------------------------------------------------------------
			INTERNAL FIELDS ::
		---------------------------------------------------------------------------
		*/

		/** {Number} Current angle of the knob */
		__angle: 0,

		/** {Number} Current value of the knob */
		__value: 0,

		/** {Number} Center of the knob in the context of the page */
		__centerPageX: 0,

		/** {Number} Center of the knob in the context of the page */
		__centerPageY: 0,

		/** {Boolean} Whether only a single finger is used in touch handling */
		__isSingleTouch: false,

		/** {Boolean} Whether a touch event sequence is in progress */
		__isTracking: false,

		/**
		 * {Boolean} Whether the user has moved by such a distance that we have enabled
		 * spinning mode. Hint: It's only enabled after some pixels of movement to
		 * not interrupt with clicks etc.
		 */
		__isTurning: false,



		/*
		---------------------------------------------------------------------------
			INTERNAL FIELDS :: INITIAL POSITIONS
		---------------------------------------------------------------------------
		*/

		/** {Number} Left position of finger at start */
		__initialTouchLeft: null,

		/** {Number} Top position of finger at start */
		__initialTouchTop: null,

		/**
		 * {Number} Position of finger relative to center at start along X axis.
		 * Possible values are "left" and "right".
		 **/
		__initialTouchLocationX: null,

		/**
		 * {Number} Position of finger relative to center at start along Y axis.
		 * Possible values are "top" and "bottom".
		 **/
		__initialTouchLocationY: null,

		/** {Boolean} Flag used for locking */
		__slideXDetected: false,

		/** {Boolean} Flag used for locking */
		__slideYDetected: false,

		/** {Boolean} Flag used for locking */
		__spinDetected: false,



		/*
		---------------------------------------------------------------------------
			INTERNAL FIELDS :: LAST POSITIONS
		---------------------------------------------------------------------------
		*/

		/** {Number} Left position of finger at start */
		__lastTouchLeft: null,

		/** {Number} Top position of finger at start */
		__lastTouchTop: null,

		/** {Date} Timestamp of last move of finger. Used to limit tracking range for deceleration speed. */
		__lastTouchMove: null,

		/** {Array} List of positions, uses three indexes for each state: left, top, timestamp */
		__positions: null,



		/*
		---------------------------------------------------------------------------
			INTERNAL FIELDS :: DIMENSIONS
		---------------------------------------------------------------------------
		*/

		/** {Integer} Available outer left position (from document perspective) */
		__clientLeft: 0,

		/** {Integer} Available outer top position (from document perspective) */
		__clientTop: 0,

		/** {Integer} Available outer width */
		__clientWidth: 0,

		/** {Integer} Available outer height */
		__clientHeight: 0,



		/*
		---------------------------------------------------------------------------
			PUBLIC API
		---------------------------------------------------------------------------
		*/

		/**
		 * Set the width and height of the knob.
		 *
		 * All values which are falsy (null or zero etc.) are ignored and the old value is kept.
		 *
		 * @param clientWidth {Integer ? null} Inner width of outer element
		 * @param clientHeight {Integer ? null} Inner height of outer element
		 */
		setDimensions: function(clientWidth, clientHeight) {

			var self = this;

			// Only update values which are defined
			if (clientWidth) {
				self.__clientWidth = clientWidth;
			}

			if (clientHeight) {
				self.__clientHeight = clientHeight;
			}

			self.__updateCenterLocation();
			self.__publish();
		},

		/**
		 * Sets the client coordinates in relation to the document.
		 *
		 * @param left {Integer ? 0} Left position of outer element
		 * @param top {Integer ? 0} Top position of outer element
		 */
		setPosition: function(left, top) {

			var self = this;

			self.__clientLeft = left || 0;
			self.__clientTop = top || 0;

			self.__updateCenterLocation();
			self.__publish();
		},

		// turnToValue: function(value) {
		// },

		// turnToAngle: function(angle) {
		// },

		// turnByValue: function(value) {
		// },

		// turnByAngle: function(angle) {
		// },

		/**
		 * Returns the knob angle and value.
		 *
		 * @return {Map} `angle` and `value`
		 */
		getValues: function() {

			var self = this;

			return {
				angle: self.__angle,
				val: self.__value
			};

		},


		/*
		---------------------------------------------------------------------------
			EVENT CALLBACKS
		---------------------------------------------------------------------------
		*/

		/**
		 * Mouse wheel/scroll handler for knob turning support
		 */
		doMouseScroll: function(wheelDelta, timeStamp, pageX, pageY) {
			var self = this;

			// Figure out where the touch was relative to the center
			var change = constrain(wheelDelta, -20, 20);
			change = (pageX >= self.__centerPageX) ? -change : change;

			self.__validateAndPublishAngle(self.__angle + change);
		},

		/**
		 * Touch start handler for knob turning support
		 */
		doTouchStart: function(touches, timeStamp) {
			// console.log('doTouchStart ' + touches + ", " + timeStamp);

			// Array-like check is enough here
			if (touches.length == null) {
				throw new Error("Invalid touch list: " + touches);
			}

			if (typeof timeStamp !== "number") {
				throw new Error("Invalid timestamp value: " + timeStamp);
			}

			var self = this,
				isSingleTouch = touches.length === 1,
				currentTouchLeft = touches[0].pageX,
				currentTouchTop  = touches[0].pageY;

			// Store initial positions
			self.__initialTouchLeft = currentTouchLeft;
			self.__initialTouchTop  = currentTouchTop;

			// Store initial touch positions
			self.__lastTouchLeft = currentTouchLeft;
			self.__lastTouchTop  = currentTouchTop;

			// Store initial move time stamp
			self.__lastTouchMove = timeStamp;

			// Reset locking flags
			self.__slideXDetected = !isSingleTouch && self.options.gestureSlideXEnabled;
			self.__slideYDetected = !isSingleTouch && self.options.gestureSlideYEnabled;

			// Figure out where the touch was relative to the center
			self.__initialTouchLocationX = (currentTouchLeft >= self.__centerPageX) ? "right" : "left";
			self.__initialTouchLocationY = (currentTouchTop  >= self.__centerPageY) ? "bottom" : "top";

			// Reset tracking flag
			self.__isTracking = true;

			// Spinning starts directly with two fingers, otherwise lazy with an offset
			self.__isTurning = !isSingleTouch;

			// Some features are disabled in multi touch scenarios
			self.__isSingleTouch = isSingleTouch;

			// Clearing data structure
			self.__positions = [];
		},

		/**
		 * Touch move handler for knob turning support
		 */
		doTouchMove: function(touches, timeStamp, scale) {
			// console.log('doTouchMove ' + touches + ", " + timeStamp + ", " + scale);

			// Array-like check is enough here
			if (touches.length == null) {
				throw new Error("Invalid touch list: " + touches);
			}

			if (typeof timeStamp !== "number") {
				throw new Error("Invalid timestamp value: " + timeStamp);
			}

			var self = this;

			// Ignore event when tracking is not enabled (event might be outside of element)
			if (!self.__isTracking) {
				return;
			}

			var currentTouchLeft = touches[0].pageX,
				currentTouchTop  = touches[0].pageY,
				positions = self.__positions;

			// Are we already in turning mode?
			if (self.__isTurning) {

				self.__validateAndPublishAngle(self.__getAngleFromGesture(currentTouchLeft, currentTouchTop));

			// Otherwise figure out whether we are switching into turning mode now.
			} else {

				var minimumTrackingForChange = 3,
					minimumTrackingForSpin = 10,
					distanceX = Math.abs(currentTouchLeft - self.__initialTouchLeft),
					distanceY = Math.abs(currentTouchTop  - self.__initialTouchTop);

				self.__slideXDetected = self.options.gestureSlideXEnabled && distanceX >= minimumTrackingForChange;
				self.__slideYDetected = self.options.gestureSlideYEnabled && distanceY >= minimumTrackingForChange;
				self.__spinDetected   = self.options.gestureSpinEnabled && self.__slideXDetected && self.__slideYDetected;

				self.__isTurning = (self.__slideXDetected || self.__slideYDetected) && (distanceX >= minimumTrackingForSpin || distanceY >= minimumTrackingForSpin);

				if(self.__isTurning) {
					if(self.__spinDetected)   { console.log("spinning") }
					else {
						if(self.__slideXDetected) { console.log("sliding left/right") }
						if(self.__slideYDetected) { console.log("sliding up/down") }
					}
				}
				// console.log("disx, disy" + distanceX + " " + distanceY)
			}

			// Keep list from growing infinitely (holding min 10, max 20 measure points)
			if (positions.length > 60) {
				positions.splice(0, 30);
			}

			// Track scroll movement for decleration
			positions.push(currentTouchLeft, currentTouchTop, timeStamp);

			// Update last touch positions and time stamp for next event
			self.__lastTouchLeft = currentTouchLeft;
			self.__lastTouchTop = currentTouchTop;
			self.__lastTouchMove = timeStamp;
		},

		/**
		 * Touch end handler for knob turning support
		 */
		doTouchEnd: function(timeStamp) {
			// console.log('doTouchEnd ' + timeStamp);

			if (typeof timeStamp !== "number") {
				throw new Error("Invalid timestamp value: " + timeStamp);
			}

			var self = this;

			// Ignore event when tracking is not enabled (no touchstart event on element)
			// This is required as this listener ('touchmove') sits on the document and not on the element itself.
			if (!self.__isTracking) {
				return;
			}

			// Not touching anymore (when two finger hit the screen there are two touch end events)
			self.__isTracking = false;

			// Reset turning flag
			self.__isTurning = false;

			// Fully cleanup list
			self.__positions.length = 0;
		},



		/*
		---------------------------------------------------------------------------
			PRIVATE API
		---------------------------------------------------------------------------
		*/

		__validateAndPublishAngle: function(angle) {
			var self = this,
				prevAngle = self.__angle,
				nPreviousAngle = normalizeAngle(prevAngle),
				nCurrentAngle  = normalizeAngle(angle),
				diff = angleDistance(nPreviousAngle, nCurrentAngle);


			diff = isAngleIncreasing(nPreviousAngle, nCurrentAngle) ? diff : -diff;
			var nextAngle = self.__validateAngle(self.__angle + diff);

			self.__angle = nextAngle;
			self.__value = self.__determineValue(prevAngle, nextAngle);

			// console.log(prevAngle, nextAngle)

			self.__publish();
		},

		/**
		 * Returns an angle with the angleStart angleEnd constraints applied.
		 *
		 * @param angle {Number} Angle to validate
		 */
		__validateAngle: function(angle) {
			var self = this;

			angle = constrain(angle, self.options.angleStart, self.options.angleEnd);

			// if prevAngle was at a boundary, only allow a legal natural move to change the existing angle.
			var threshold = 30;
			if(self.__angle == self.options.angleStart && Math.abs(angle-self.__angle) > threshold ) {
				angle = self.options.angleStart;
			}
			if(self.__angle == self.options.angleEnd && Math.abs(angle-self.__angle) > threshold) {
				angle = self.options.angleEnd;
			}

			return angle;
		},

		/**
		 * Returns a value with the valueMin valueMax constraints applied.
		 *
		 * @param value {Number} Value to validate
		 */
		__determineValue: function(prevAngle, nextAngle) {
			var self = this;


			// If angle and value bounds are real, map angle directly to value
			if (isReal(self.options.angleStart) &&
				isReal(self.options.angleEnd) &&
				self.options.valueMin != Number.NEGATIVE_INFINITY &&
				self.options.valueMax != Number.POSITIVE_INFINITY) {
				return map(nextAngle, self.options.angleStart, self.options.angleEnd, self.options.valueMin, self.options.valueMax);
			}

			// If bounds aren't real, just increase/decrease value based on the change in angle.
			var value = self.__value + (nextAngle - prevAngle) * self.options.angleValueRatio;

			return constrain(value, self.options.valueMin, self.options.valueMax);
		},

		/**
		 * Applies the values to the callback function.
		 */
		__publish: function() {
			var self = this,
				indicator = self.__getIndicator(self.__angle),
				spriteOffset = self.__getSpriteOffset(self.__angle);

			// Push values out
			if (self.__callback) {
				self.__callback({
					knob: self,
					angle: self.__angle,
					val: self.__value,
					indicator: indicator,
					spriteOffset: spriteOffset
				});
			}
		},

		/**
		 * Returns the indicator position and rotation information.
		 *
		 * @param angle {Number} angle
		 *
		 * @return {Map} `x` and `y` position and `angle`
		 */
		__getIndicator: function(angle) {

			var self = this,
				indicator = {};

			if(self.options.indicatorAutoPosition) {
				var rads = toRadians(angle);
				// Subtract Y component because of canvas's inverted Y coordinate compared to output of sin.
				indicator.x = self.__centerPageX - self.__clientLeft + self.options.indicatorRadius * Math.cos(rads),
				indicator.y = self.__centerPageY - self.__clientTop  - self.options.indicatorRadius * Math.sin(rads);
			}
			else {
				// If not positioning, set x & y to the center of the knob
				indicator.x = self.__centerPageX - self.__clientLeft,
				indicator.y = self.__centerPageY - self.__clientTop;
			}

			if(self.options.indicatorAutoRotate) {
				indicator.angle = angle - self.options.indicatorStartAngle;
			}
			else {
				indicator.angle = 0;
			}

			return indicator;
		},

		/**
		 * Returns the offset for the image within the sprite.
		 *
		 * @param angle {Number} angle
		 *
		 * @return {Map} `x`, `y` offset of image within sprite
		 */
		__getSpriteOffset: function(angle) {

			var self = this,
				offset;

			// If there are multiple images (using sprites), figure out which image to show.
			if(self.options.spriteCount > 1) {

				var spriteAngle = self.options.spriteDirection === 'ccw' ? angle : -angle;
				// Align the background image for sprites
				spriteAngle += self.options.spriteStartAngle;
				var imageIndex = (Math.floor(spriteAngle / self.options.spriteSeparationAngle) % self.options.spriteCount);
				if(imageIndex < 0) {
					imageIndex += self.options.spriteCount;
				}

				offset = (self.options.spriteSeparationGap * (imageIndex+1)) + (self.options.spriteWidth * imageIndex);
			}

			return {
				x: offset,
				y: self.options.spriteSeparationGap
			};
		},

		/**
		 * Return the angle based on the detected gesture.
		 *
		 * @param currentTouchLeft {Number} pageX of the current touch
		 * @param currentTouchTop  {Number} pageY of the current touch
		 *
		 * @return {Number} angle
		 */
		__getAngleFromGesture: function(currentTouchLeft, currentTouchTop) {

			var self = this,
				angle = self.__angle;

			// handle spin, then handle slides
			if(self.__spinDetected) {
				// http://stackoverflow.com/questions/1311049/how-to-map-atan2-to-degrees-0-360
				var y = self.__centerPageY - currentTouchTop,
					x = currentTouchLeft - self.__centerPageX;
				angle = toDegrees(Math.atan2(-y,-x)+Math.PI);
			}
			else {
				if (self.__slideXDetected) {
					var change = (currentTouchLeft - self.__lastTouchLeft) * self.options.angleSlideRatio;
					angle += (self.__initialTouchLocationY === "top") ? -change : change;
				}

				if (self.__slideYDetected) {
					var change = (currentTouchTop - self.__lastTouchTop) * self.options.angleSlideRatio;
					angle += (self.__initialTouchLocationX === "right") ? -change : change;
				}
			}

			return angle;
		},


		/**
		 * Update the page based center of the knob.
		 */
		__updateCenterLocation: function() {
			var self = this;

			// Get the center of knob to base interactions from
			self.__centerPageX = self.__clientLeft + self.__clientWidth/2 + self.options.centerOffsetX;
			self.__centerPageY = self.__clientTop + self.__clientHeight/2 + self.options.centerOffsetY;
		}
	}

	for (var key in members) {
		Knob.prototype[key] = members[key];
	}
})();
