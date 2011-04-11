(function($) {
	var setAngle = function(degrees, $knob) {
		var data = $knob.data('knob');

		var turnAmount = 0;
		var prevTurns = 0;

		// chop off any previous turns, get base angle
		degrees %= 360;

		// enforce the angle limits on knob turning by making sure you can't cross between min & max
		// look for very large jumps in the difference between the old and new angle
		var diff = data.currentValue%360 - degrees;
		var cutoff = 225 // 360 * 0.625
		if(Math.abs(diff) > cutoff) {
			turnAmount = (diff > 0) ? 1 : -1;
		}
		// prevTurns is the total number of full turns in degrees
		// ~~ forces integer division
		prevTurns = 360 * (~~(data.currentValue/360) + turnAmount);

		degrees += prevTurns; // add base angle with previous turns

		// don't allow values below min and above max angle
		degrees = Math.min(Math.max(degrees, data.settings.minAngle), data.settings.maxAngle);

		if(data.indicator !== undefined) {
			if(data.settings.positionIndicator) {
				var rads = degrees * Math.PI/180;
				data.indicator.css({
					top:  data.settings.centerY + data.settings.radius * Math.sin(rads) - data.indicator.height() * 0.5,
					left: data.settings.centerX + data.settings.radius * Math.cos(rads) - data.indicator.width() * 0.5
				});
			}
			if(data.settings.rotateIndicator) {
				data.indicator.rotate({
					angle: (degrees - data.settings.imageAngle + data.settings.rotation)
				});
			}
		}

		// If there are multiple images (using sprites), figure out which image to show.
		if(data.settings.imageCount > 1) {
			
			var spriteDegrees = data.settings.imageDirection == 'clockwise' ? -degrees : degrees;

			// Align the background image with the imageAngle
			spriteDegrees += data.settings.imageAngle;
			var imageIndex = (Math.floor( spriteDegrees / data.settings.imageAngleSeparation) % data.settings.imageCount);
			if(imageIndex > 0) {
				imageIndex -= data.settings.imageCount;
			}
			var offset = (data.settings.imageGridGap * imageIndex-1) + (data.settings.imageWidth * imageIndex);

			data.element.css({
				'background-position': offset + 'px'
			});

		}

		data.currentValue = degrees;
		// console.log('prev  ' + prevTurns + 'turn ' + turnAmount + ' final degrees ' + degrees)
	};

	var getGesture = function(maxMouseX, maxMouseY) {
		var gesture;

		if(maxMouseX == 0) {
			gesture = "vertical";
		}
		else if(maxMouseY == 0) {
			gesture = "horizontal";
		}
		else {
			if(maxMouseX/maxMouseY > 1.3) gesture = "horizontal";
			else if(maxMouseY/maxMouseX > 1.3) gesture = "vertical";
			else gesture = "circular";
		}

		return gesture;
	};

	var updateKnob = function($knob, pageX, pageY) {
		var data = $knob.data('knob');

		var degrees = data.currentValue;

		// TODO: if the gesture started towards the bottom or top, assume horizontal
		// TODO: if the gesture started towards the left or right, assume vertical
		// After initial gesture guess (most likely vertical/horizontal), 
		// look for circular gesture. Stop looking once the sample size is reached.

		if(data.sampleCount < data.settings.sampleSize) {
			data.sampleCount++;

			if(Math.abs(pageX - data.touchStartX) > data.maxMouseX)
				data.maxMouseX = Math.abs(pageX - data.touchStartX);
			if(Math.abs(pageY - data.touchStartY) > data.maxMouseY)
				data.maxMouseY = Math.abs(pageY - data.touchStartY);
			var currentGesture = getGesture(data.maxMouseX, data.maxMouseY);
			if(data.gesture == undefined || currentGesture == "circular")  {
				data.gesture = currentGesture;
			}
		}

		if(data.gesture == "circular") {

			y = data.centerY - pageY;
			x = pageX - data.centerX;
			var inputAngle = 360 - Math.atan2(y,x)/Math.PI*180;
			inputAngle -= data.settings.rotation;
			inputAngle %= 360;
			degrees = inputAngle;
		}
		else if(data.gesture == "vertical") {
			var change = (pageY - data.lastTouchY) * data.settings.linearTurnSpeed;
			degrees += (data.touchStartHorizontal == "right") ? change : -change;
		}
		else if(data.gesture == "horizontal") {
			var change = (pageX - data.lastTouchX) * data.settings.linearTurnSpeed;
			degrees += (data.touchStartVertical == "top") ? change : -change;
		}

		data.lastTouchX = pageX;
		data.lastTouchY = pageY;

		if (degrees < 0) degrees += 360;

		// slow down the transition from one position to another
		//degrees = currentValue + (degrees - currentValue)/2;
		//degrees = currentValue + Math.min(degrees - currentValue, 4);

		setAngle(degrees, $knob);
	}

	var defaults =  {                 // Default Orientation
		'minValue': 0,                //         270
		'maxValue': 100,              //   180    +    0
		'value': 0,                   //         90
		'rotation': 0, // angle of the entire knob relative to the default orientation
		'imageAngle': 0, // angle of the image relative to the default orientation
		'minAngle': 0, // relative to 0 (rotation automatically added)
		'maxAngle': 359, // relative to 0 (rotation automatically added)
		'direction': 'clockwise', // direction the knob turns from minAngle to maxAngle
		'linearTurnSpeed': 1.4, // go linearTurnSpeed * number of pixels travelled by gesture (only applies to linear gestures)
		'sampleSize': 40, // how many locations to sample before locking gesture best guess
		'step': 1,

		'circularGestureEnabled': true,
		'verticalGestureEnabled': true,
		'horizontalGestureEnabled': true,

		'centerX': undefined,
		'centerY': undefined,

		'imagePath': '', // path to background image/sprite (depending on knob type)
		'imageCount': 1, // number sprites in image (for dynamic/fully rendered knobs)
		'imageAngleSeparation': 3, // number of degrees turned between each image sprite
		'imageGridGap': 0, // if the sprites are spearated by a grid or whitespace, specify the thickness of the grid here
		'imageWidth': 67, // sprite width (default to Apple's standard size in GarageBand)
		'imageHeight': 67, // sprite height (default to Apple's standard size in GarageBand)
		'imageDirection': 'clockwise', // direction each sprite turns compared to the previous sprite in the image

		'indicatorPath': '', // path to indicator image
		//'positionIndicator': false,
		'rotateIndicator': false,
		'indicatorOffsetY': 0,
		'indicatorOffsetX': 0
	}

	var activeKnobs = {};



	var methods = {
		init : function(options) {
			return this.each(function() {

				var settings = {};
				if(options) {
					settings = $.extend(settings, defaults, options); // don't modify defaults
				}

				var $this = $(this);
				var $el = $(document.createElement('div'));
				$this.append($el)



				// TODO: base sample size off of radius (image size if radius not available)



				$this.css({
					'position': 'relative',
					'display': 'block',
					'overflow': 'auto', // prevent margin collapsing
					'height': settings.imageHeight + 'px',
					'width': settings.imageWidth + 'px',
					'margin': '0 auto 0 auto'
				});


				if(settings.imagePath) {
					$el.css({
						'position': 'relative',
						'display': 'block',
						'background-position': -settings.imageGridGap + 'px' + ' ' + -settings.imageGridGap + 'px',
						'height': settings.imageHeight + 'px',
						'width': settings.imageWidth + 'px',
						'background-image': 'url(' + settings.imagePath + ')',
						'background-repeat': 'no-repeat',
						'margin': '0 auto 0 auto'
					});
				}

				// TODO: only vertically align if specified in settings

				$el.css({
					'position': 'relative',
					'top': '50%',
					'margin-top': (-$el.outerHeight()/2) + 'px'
				});

				$this.css({
					'position': 'relative',
					'top': '50%',
					'margin-top': (-$this.outerHeight()/2) + 'px'
				});



				var $indicator;
				if(settings.indicatorPath) {
					$indicator = $(document.createElement('img'));
					$indicator.attr('src', settings.indicatorPath + '');
					$indicator.css({
						'position': 'relative',
						'margin-left': settings.indicatorOffsetX + 'px',
						'margin-top': settings.indicatorOffsetY + 'px'
					});
					$el.append($indicator)

					$indicator.load(function() {
						setAngle($this.data('knob').currentValue, $this);
					});
				}


				var data = $this.data('knob');

				if(!data) {
					// setup

					$this.data('knob', {
						settings: settings,
						indicator: $indicator,
						element: $el,
						halfway: (settings.minAngle + (settings.maxAngle - settings.minAngle)/2),
						currentValue: 0 // TODO: set to value from settings
					});






					var $knob = $this;



					function downHandler(event) {
						event.preventDefault();
						// var $knob = $(event.target);  // seems to only work with touch events
						var data = $knob.data('knob');

						var pos = $knob.offset();

						// Get the center of knob to base interactions from

						// if the center of the knob wasn't provided, use the midpoint of the element
						if(data.settings.centerX !== undefined) {
							data.centerX = pos.left + data.settings.centerX;
						}
						else {
							var w = $knob.outerWidth(); // include border & padding
							data.centerX = (w + pos.left) - (w / 2);
						}

						if(data.settings.centerY !== undefined) {
							data.centerY = pos.top + data.settings.centerY;
						}
						else {
							var h = $knob.outerHeight(); // include border & padding
							data.centerY = (h + pos.top) - (h / 2);
						}

						// var touchStartPos = { x: event.pageX, y: event.pageY };

						if(event.type == 'touchstart') {
							data.touchStartX = event.targetTouches[0].pageX;
							data.touchStartY = event.targetTouches[0].pageY;
							activeKnobs[event.targetTouches[0].identifier] = $knob;
						}
						else {
							data.touchStartX = event.pageX;
							data.touchStartY = event.pageY;
						}

						data.lastTouchX = data.touchStartX;
						data.lastTouchY = data.touchStartY;
						data.touchStartHorizontal = (data.touchStartX >= data.centerX) ? "right" : "left";
						data.touchStartVertical = (data.touchStartY >= data.centerY) ? "bottom" : "top";

						data.gesture = undefined;

						data.maxMouseX = 0;
						data.maxMouseY = 0;
						data.sampleCount = 4;

						function mousemoveHandler(e) {
							e.preventDefault();

							updateKnob($knob, e.pageX, e.pageY);

							return false;
						}

						function touchmoveHandler(e) {
							e.preventDefault();

							for(var i=0; i < e.changedTouches.length; i++) {
								var $k = activeKnobs[e.changedTouches[i].identifier];
								if($k !== undefined) {
									updateKnob($k, e.changedTouches[i].pageX, e.changedTouches[i].pageY);
								}
							}

							return false;
						}

						if(event.type == 'touchstart') {
							$(document).bind({
								'touchmove': function(event) {
									return touchmoveHandler(event.originalEvent);
								},
								'touchend': function(event) {
									var e = event.originalEvent;
									e.preventDefault();
									for(var i=0; i < e.changedTouches.length; i++) {
										delete activeKnobs[e.changedTouches[i].identifier];
									}
									var count = 0;
									for (var key in activeKnobs) {
										count++;
									}
									// $('#debug2').append('before: ' + count);
									if(count <= 0) {
										$(document).unbind('touchmove');
										$(document).unbind('touchend');										
									}
									return false;
								}
							});
						}
						else {
							$(document).bind({
								'mousemove': function(event) {
									return mousemoveHandler(event);
								},
								'mouseup': function(event) {
									$(document).unbind('mousemove');
									$(document).unbind('mouseup');
									return false;
								}
							});
						}
						return false;
					}

					$this.bind({
						'touchstart': function(event) {
							return downHandler(event.originalEvent);
						},
						'mousedown': function(event) {
					 		return downHandler(event);
						}
					});


					setAngle($this.data('knob').currentValue, $this);
				}
			});
		},

		destroy : function() {
			return this.each(function() {
				// var $this = $(this),
				//	 data = $this.data('knob');
				
				//$(window).unbind('.knob');
				//data.knob.remove();
				//$this.removeData('knob');
			});
		}

	}; // end methods

	$.fn.knob = function(method) {
		if(methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if(typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on jQuery.knob');
		}
	};
})(jQuery);
