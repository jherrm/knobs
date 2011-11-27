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

			/** Angle where the minimum value is if knob has bounds */
			angleStart: Number.NEGATIVE_INFINITY,

			/** Angle where the maximum value is if knob has bounds */
			angleEnd: Number.POSITIVE_INFINITY,

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
			spriteDirection: 'cw', /* cw = clockwise, ccw = counter-clockwise */

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

	};

	/*
	---------------------------------------------------------------------------
		PRIVATE FUNCTIONS
	---------------------------------------------------------------------------
	*/

	/**
	 * @param degrees {Number} Angle in degrees
	 *
	 * @return {Number} Angle in radians
	 **/
	function toRadians(degrees) {
		return degrees*(Math.PI/180);
	};

	/**
	 * @param radians {Number} Angle in radians
	 *
	 * @return {Number} Angle in degrees
	 **/
	function toDegrees(radians) {
		return radians*(180/Math.PI);
	};

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
		 *
		 */
		doMouseZoom: function(wheelDelta, timeStamp, pageX, pageY) {
			console.log('doMouseZoom ' + wheelDelta + ", " + timeStamp + ", " + pageX + ", " + pageY);

			// var self = this;
			// var change = wheelDelta > 0 ? 0.97 : 1.03;

			// return self.zoomTo(self.__zoomLevel * change, false, pageX - self.__clientLeft, pageY - self.__clientTop);

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

			// Are we already is spinning mode?
			if (self.__isTurning) {

				var currentAngle = self.__getAngleFromGesture(currentTouchLeft, currentTouchTop),
					nPreviousAngle = normalizeAngle(self.__angle),
					nCurrentAngle  = normalizeAngle(currentAngle);

				// add normalized angle with previous turns
				var prevTurns = (self.__getTurnCount(self.__angle) + self.__detectCrossover(nPreviousAngle, nCurrentAngle)),
					nextAngle = nCurrentAngle + (360 * prevTurns);

				self.__angle = self.__validateAngle(nextAngle);

				self.__publish();

			// Otherwise figure out whether we are switching into dragging mode now.
			} else {

				var minimumTrackingForChange = 3,
					minimumTrackingForSpin = 10,
					distanceX = Math.abs(currentTouchLeft - self.__initialTouchLeft),
					distanceY = Math.abs(currentTouchTop  - self.__initialTouchTop);

				self.__slideXDetected = self.options.gestureSlideXEnabled && distanceX >= minimumTrackingForChange;
				self.__slideYDetected = self.options.gestureSlideYEnabled && distanceY >= minimumTrackingForChange;
				self.__spinDetected   = self.options.gestureSpinEnabled && self.__slideXDetected && self.__slideYDetected;

				self.__isTurning = (self.__slideXDetected || self.__slideYDetected) && (distanceX >= minimumTrackingForSpin || distanceY >= minimumTrackingForSpin);
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

			// Reset dragging flag
			self.__isTurning = false;

			// Fully cleanup list
			self.__positions.length = 0;
		},



		/*
		---------------------------------------------------------------------------
			PRIVATE API
		---------------------------------------------------------------------------
		*/

		/**
		 * Returns an angle within the angleStart angleEnd constraints applied.
		 *
		 * @param angle {Number} Angle to validate
		 */
		__validateAngle: function(angle) {
			var self = this;

			// Hold angleStart and angleEnd constraints
			if(self.options.angleStart < self.options.angleEnd) {
				// Only allow numbers > angleStart and < than angleEnd
				angle = Math.min(Math.max(angle, self.options.angleStart), self.options.angleEnd);
			}
			else {
				// Only allow numbers < angleStart and > than angleEnd
				// angle = Math.max(Math.min(angle, self.options.angleStart), self.options.angleEnd);
				angle = Math.min(Math.max(angle, self.options.angleEnd), self.options.angleStart);
			}

			// if previous angle is equal to angleStart or angleEnd, or if the prev/next crosses over the angleStart or angleEnd,
			// even if the next angle is valid, check to see if it was arrived at through an invalid path
			// For instance, if angleStart = 0 and angleEnd = 360, a prevAngle of 1 shouldn't be able to jump to 355.
			// Likewise, if angleStart = 180 and angleEnd = 540, a prevAngle of 169 shouldn't be able to jump to 530.

			// Look for very large jumps in the difference between the previous and current angle.
			var diff = self.__angle - angle;
			// Two lines below calculate absolute distance between two angles (e.g. 350° to 15° = 25°)
			// var d = Math.abs(self.__angle - angle) % 360;
			// var diff = d > 180 ? 360 - d : d;
			var cutoff = 225 // 225 = 360 * 0.625
			if(Math.abs(diff) >= cutoff) {
				// set the next angle to the closest boundary
				angle = Math.abs(self.__angle - self.options.angleStart) < Math.abs(self.__angle - self.options.angleEnd) ? self.options.angleStart : self.options.angleEnd;
				if(angle == Math.POSITIVE_INFINITY || angle == Math.NEGATIVE_INFINITY) {
					angle = self.__angle;
				}
			}

			// if prevAngle was at a boundary, only allow a legal natural move to change the existing angle.
			if(self.__angle == self.options.angleStart && angle == self.options.angleEnd) {
				angle = self.options.angleStart;
			}
			if(self.__angle == self.options.angleEnd && angle == self.options.angleStart) {
				angle = self.options.angleEnd;
			}

			return angle;
		},

		/**
		 * Applies the values to the callback function.
		 *
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

			if(self.options.indicatorAutoRotate) {
				indicator.angle = angle + self.options.indicatorStartAngle;
			}

			return indicator;
		},

		/**
		 * Returns the offset for the image within the sprite.
		 *
		 * @param angle {Number} angle
		 *
		 * @return {Integer} offset of image within sprite
		 */
		__getSpriteOffset: function(angle) {

			var self = this,
				offset;

			// If there are multiple images (using sprites), figure out which image to show.
			if(self.options.spriteCount > 1) {

				var spriteAngle = self.options.spriteDirection == 'cw' ? -angle : angle;

				// Align the background image for sprites
				spriteAngle += self.options.spriteStartAngle;
				var imageIndex = (Math.floor(spriteAngle / self.options.spriteSeparationAngle) % self.options.spriteCount);
				if(imageIndex > 0) {
					imageIndex -= self.options.spriteCount;
				}

				offset = (self.options.spriteSeparationGap * imageIndex-1) + (self.options.imageWidth * imageIndex);
			}

			return offset;
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
				console.log("spinning");
			}
			else {
				if (self.__slideXDetected) {
					var change = (currentTouchLeft - self.__lastTouchLeft) * self.options.angleSlideRatio;
					angle += (self.__initialTouchLocationY == "top") ? -change : change;
					console.log("sliding left/right");
				}

				if (self.__slideYDetected) {
					var change = (currentTouchTop - self.__lastTouchTop) * self.options.angleSlideRatio;
					angle += (self.__initialTouchLocationX == "right") ? -change : change;
					console.log("sliding up/down");
				}
			}

			return angle;
		},

		/**
		 * Get the number of turns from the angle.
		 *  360 to  720 =  1
		 *   0  to  359 =  0
		 *   0  to -359 = -1
		 * -360 to -720 = -2
		 *
		 * @param angle {Number}
		 *
		 * @return {Integer} number of full turns
		 */
		__getTurnCount: function(angle) {

			var self = this,
				turnAmount = 0,
				nAngle = normalizeAngle(angle);


			// Because 0-360 is the zeroeth turn, any negative angle is 1 turn behind positive angles.
			// Also, when self.__angle % 360 = 0 and self.__angle != 0, we need to change the number of
			// turns depending on the sign o
			if((angle < 0 && nAngle != 0) ||
			   (angle > 0 && nAngle == 0)) {
				turnAmount--;
			}

			// Get the total number of full turns in degrees
			// ~~ forces integer division
			turnAmount = (~~(angle/360) + turnAmount);

			return turnAmount;
		},

		/**
		 * Detect if the angle has crossed over the 0/360 boundary.
		 *
		 * @param nPreviousAngle {Number} normalized previous angle
		 * @param nCurrentAngle  {Number} normalized current angle
		 *
		 * @return {Integer} 1 if crossover from 360 to 0,
		 *					-1 if crossover from 0 to 360,
		 *					 0 if no crossover.
		 */
		__detectCrossover: function(nPreviousAngle, nCurrentAngle) {
			// If the last angle was close to one side of the discontinuity and
			// the other angle was close to the other side of the discontinuity,
			// assume the user has crossed the discontinuity.
			var lowerBound = 30,
				upperBound = 360 - lowerBound;
			if(nPreviousAngle < lowerBound && nCurrentAngle > upperBound) {
				return -1;
				console.log("FORD THE RIVER 0 -> 360")
			}
			else if(nPreviousAngle > upperBound && nCurrentAngle < lowerBound) {
				return 1;
				console.log("FORD THE RIVER 360 -> 0")
			}

			return 0;
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
