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
			gestureSpinEnabled: true,

			/** Enable turning of the knob in a horizontal sliding motion */
			gestureSlideXEnabled: true,

			/** Enable turning of the knob with a vertical sliding motion */
			gestureSlideYEnabled: true,

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

			/** Angle the inicator is at when first rendered */
			indicatorStartAngle: 0,

			/**  */
			indicatorWidth: 0,

			/**  */
			indicatorHeight: 0,

			/** Path to indicator image */
			// indicatorImagePath: '',

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
				KNOB IMAGE/SPRITE OPTIONS
			---------------------------------------------------------------------------
			*/

			/** Path to background image or sprite */
			// imagePath: '',

			/** Width of the image or individual images in the sprite */
			imageWidth: 67, /* (default to Apple's standard size in GarageBand) */

			/** Height of the image or individual images in the sprite */
			imageHeight: 67, /* (default to Apple's standard size in GarageBand) */

			/** Number of images in the sprite */
			spriteCount: 1,

			/** Which way the images turn when viewing left to right in the sprite */
			spriteDirection: 'cw', /* cw = clockwise, ccw = counter-clockwise */

			/** Angle of the image (or 1st sprite image) relative to the default orientation */
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
		__centerGlobalX: 0,

		/** {Number} Center of the knob in the context of the page */
		__centerGlobalY: 0,

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
		},

		/**
		 * Returns the scroll position and zooming values
		 *
		 * @return {Map} `left` and `top` scroll position and `zoom` level
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

		doTouchStart: function(touches, timeStamp) {
			// console.log('doTouchStart ' + touches + ", " + timeStamp);

			// Array-like check is enough here
			if (touches.length == null) {
				throw new Error("Invalid touch list: " + touches);
			}

			if (typeof timeStamp !== "number") {
				throw new Error("Invalid timestamp value: " + timeStamp);
			}

			var self = this;

			var currentTouchLeft, currentTouchTop;
			var isSingleTouch = touches.length === 1;
			// if (isSingleTouch) {
				currentTouchLeft = touches[0].pageX;
				currentTouchTop = touches[0].pageY;
			// } else {
				// Use center point when dealing with two fingers
				// currentTouchLeft = Math.abs(touches[0].pageX + touches[1].pageX) / 2;
				// currentTouchTop = Math.abs(touches[0].pageY + touches[1].pageY) / 2;
			// }

			// Store initial positions
			self.__initialTouchLeft = currentTouchLeft;
			self.__initialTouchTop = currentTouchTop;

			// Store initial touch positions
			self.__lastTouchLeft = currentTouchLeft;
			self.__lastTouchTop = currentTouchTop;

			// Store initial move time stamp
			self.__lastTouchMove = timeStamp;

			// Reset locking flags
			self.__slideXDetected = !isSingleTouch && self.options.gestureSlideXEnabled;
			self.__slideYDetected = !isSingleTouch && self.options.gestureSlideYEnabled;

			// Figure out where the touch was relative to the center
			self.__initialTouchLocationX = (currentTouchLeft >= self.__centerGlobalX) ? "right" : "left";
			self.__initialTouchLocationY = (currentTouchTop  >= self.__centerGlobalY) ? "bottom" : "top";

			// Reset tracking flag
			self.__isTracking = true;

			// Spinning starts directly with two fingers, otherwise lazy with an offset
			self.__isTurning = !isSingleTouch;

			// Some features are disabled in multi touch scenarios
			self.__isSingleTouch = isSingleTouch;

			// Clearing data structure
			self.__positions = [];
		},

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


			var currentTouchLeft, currentTouchTop,
				angle = self.__angle;

			// Compute move based around of center of fingers
			// if (touches.length === 2) {
				// currentTouchLeft = Math.abs(touches[0].pageX + touches[1].pageX) / 2;
				// currentTouchTop = Math.abs(touches[0].pageY + touches[1].pageY) / 2;
			// } else {
				currentTouchLeft = touches[0].pageX;
				currentTouchTop = touches[0].pageY;
			// }

			var positions = self.__positions;

			// Are we already is spinning mode?
			if (self.__isTurning) {

				// Compute move distance
				var moveX = currentTouchLeft - self.__lastTouchLeft;
				var moveY = currentTouchTop - self.__lastTouchTop;

				// handle spin, then handle slides
				if(self.__spinDetected) {
					console.log("spinning");
					var y = self.__centerGlobalY - currentTouchTop,
						x = currentTouchLeft - self.__centerGlobalX;
					var inputAngle = 360 - toDegrees(Math.atan2(y,x));
					inputAngle %= 360;
					angle = inputAngle;
				}
				else {
					if (self.__slideXDetected) {
						console.log("sliding left/right");
						var change = (currentTouchLeft - self.__lastTouchLeft) * self.options.angleSlideRatio;
						angle += (self.__initialTouchLocationY == "top") ? change : -change;
					}

					if (self.__slideYDetected) {
						console.log("sliding up/down");
						var change = (currentTouchTop - self.__lastTouchTop) * self.options.angleSlideRatio;
						angle += (self.__initialTouchLocationX == "right") ? change : -change;
					}
				}

				if (angle < 0) angle += 360;

				self.__angle = angle;




				var turnAmount = 0;
				var prevTurns = 0;

				// chop off any previous turns, get base angle
				angle %= 360;

				// enforce the angle limits on knob turning by making sure you can't cross between min & max
				// look for very large jumps in the difference between the old and new angle
				var diff = self.__angle%360 - angle;
				var cutoff = 225 // 360 * 0.625
				if(Math.abs(diff) > cutoff) {
					turnAmount = (diff > 0) ? 1 : -1;
				}
				// prevTurns is the total number of full turns in degrees
				// ~~ forces integer division
				prevTurns = 360 * (~~(self.__angle/360) + turnAmount);

				angle += prevTurns; // add base angle with previous turns

				// don't allow values below min and above max angle
				angle = Math.min(Math.max(angle, self.options.angleMin), self.options.angleMax);

				var indicatorX, indicatorY, indicatorAngle, spriteOffset;

				if(self.options.indicatorAutoPosition) {
					var rads = toRadians(angle);

					// TODO: No reason to recalculate this every time. Store indicator x/y after indicator first loads.
					var ix =  self.__clientWidth/2 + self.options.centerOffsetX - self.options.indicatorWidth/2;
					var iy = self.__clientHeight/2 + self.options.centerOffsetY - self.options.indicatorHeight/2;

					indicatorX = ix + self.options.indicatorRadius * Math.cos(rads);
					indicatorY = iy + self.options.indicatorRadius * Math.sin(rads);
				}

				if(self.options.indicatorAutoRotate) {
					indicatorAngle = angle - self.options.indicatorStartAngle;
				}

				// If there are multiple images (using sprites), figure out which image to show.
				if(self.options.spriteCount > 1) {

					var spriteDegrees = self.options.spriteDirection == 'cw' ? -angle : angle;

					// Align the background image for sprites
					spriteDegrees += self.options.spriteStartAngle;
					var imageIndex = (Math.floor( spriteDegrees / self.options.spriteSeparationAngle) % self.options.spriteCount);
					if(imageIndex > 0) {
						imageIndex -= self.options.spriteCount;
					}

					spriteOffset = (self.options.spriteSeparationGap * imageIndex-1) + (self.options.imageWidth * imageIndex);

				}

				self.__angle = angle;
				// console.log('prev  ' + prevTurns + 'turn ' + turnAmount + ' final degrees ' + degrees)








				// Keep list from growing infinitely (holding min 10, max 20 measure points)
				if (positions.length > 60) {
					positions.splice(0, 30);
				}

				// Track scroll movement for decleration
				positions.push(currentTouchLeft, currentTouchTop, timeStamp);


				// Sync data
				self.__publish(self.__angle, self.__value, indicatorX, indicatorY, indicatorAngle, spriteOffset);

			// Otherwise figure out whether we are switching into dragging mode now.
			} else {

				var minimumTrackingForChange = 3;
				var minimumTrackingForSpin = 10;

				var distanceX = Math.abs(currentTouchLeft - self.__initialTouchLeft);
				var distanceY = Math.abs(currentTouchTop - self.__initialTouchTop);

				self.__slideXDetected = self.options.gestureSlideXEnabled && distanceX >= minimumTrackingForChange;
				self.__slideYDetected = self.options.gestureSlideYEnabled && distanceY >= minimumTrackingForChange;
				self.__spinDetected   = self.options.gestureSpinEnabled && self.__slideXDetected && self.__slideYDetected;

				positions.push(currentTouchLeft, currentTouchTop, timeStamp);

				self.__isTurning = (self.__slideXDetected || self.__slideYDetected) && (distanceX >= minimumTrackingForSpin || distanceY >= minimumTrackingForSpin);
				console.log("spinning: "+self.__isTurning+" sliding x: "+self.__slideXDetected+" sliding y: "+self.__slideYDetected);
			}

			// Update last touch positions and time stamp for next event
			self.__lastTouchLeft = currentTouchLeft;
			self.__lastTouchTop = currentTouchTop;
			self.__lastTouchMove = timeStamp;
		},

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
		 * Applies the values to the content element
		 *
		 */
		__publish: function(angle, value, indicatorX, indicatorY, indicatorAngle, spriteOffset) {
			var self = this;


			// console.log("ANGLE: " + self.__angle);

			// Push values out
			if (self.__callback) {
				self.__callback(angle, value, indicatorX, indicatorY, indicatorAngle, spriteOffset);
			}

		},

		__updateCenterLocation: function() {
			var self = this;

			// Get the center of knob to base interactions from
			self.__centerGlobalX = self.__clientLeft + self.__clientWidth/2  + self.options.centerOffsetX;
			self.__centerGlobalY = self.__clientTop  + self.__clientHeight/2 + self.options.centerOffsetY;

		},
	}

	for (var key in members) {
		Knob.prototype[key] = members[key];
	}
})();