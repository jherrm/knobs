(function($) {
	var setAngle = function(degrees, $knob) {
		var data = $knob.data('knob');
		// console.log('attempted ' + degrees);

		var turnAmount = 0;
		var prevTurns = 0;

		degrees %= 360; // chop off any previous turns, get base angle
		// enforce the angle limits on knob turning by making sure you can't cross between min & max
		// look for very large jumps in the difference between the old and new angle
		var diff = data.currentValue%360 - degrees;
		var cutoff = 225 // 360 * 0.625
		if(Math.abs(diff) > cutoff) {
			turnAmount = (diff > 0) ? 1 : -1;
		}
		// prevTurns is the total number of full turns in degrees
		prevTurns = 360 * (~~(data.currentValue/360) + turnAmount); // ~~ forces integer division

		degrees += prevTurns; // add base angle with previous turns

		// don't allow values below min and above max angle
		degrees = Math.min(Math.max(degrees, data.settings.minAngle), data.settings.maxAngle);

		// var target = $knob;
		// if(data.settings.rotatedTarget !== undefined) {
		// 	target = data.settings.rotatedTarget;
		// }
		data.settings.rotatedTarget.rotate({
			angle: (degrees - data.settings.labelAngle + data.settings.rotation)
		});

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
			y = data.centerTop - pageY;
			x = pageX - data.centerLeft;
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
		'rotatedTarget': undefined,
		'rotation': 0, // angle of the entire knob relative to the default orientation
		'labelAngle': 0, // angle of the image relative to the default orientation
		'minAngle': 0, // relative to 0 (rotation automatically added)
		'maxAngle': 359, // relative to 0 (rotation automatically added)
		'direction': 'clockwise', // direction the knob turns from minAngle to maxAngle
		'linearTurnSpeed': 1.4, // go 2 x number of pixels travelled by gesture (only applies to linear gestures)
		'sampleSize': 40, // how many locations to sample before locking gesture best guess
		'step': 1,
		'circularGestureEnabled': true,
		'verticalGestureEnabled': true,
		'horizontalGestureEnabled': true
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

				if(settings.rotatedTarget === undefined) {
					settings.rotatedTarget = $this;
				}
				settings.rotatedTarget.rotate(0);

				var data = $this.data('knob');

				if(!data) {
					// setup

					$this.data('knob', {
						settings: settings,
						halfway: (settings.minAngle + (settings.maxAngle - settings.minAngle)/2),
						currentValue: settings.value
					});


					var $knob = $this;

					function downHandler(event) {
						event.preventDefault();
						// var $knob = $(event.target);  // seems to only work with touch events
						var data = $knob.data('knob');
						var bPos = $knob.offset();
						var bWidth = $knob.outerWidth(); // include border & padding
						var bHeight = $knob.outerHeight(); // include border & padding

						data.centerLeft = (bWidth + bPos.left) - (bWidth / 2);
						data.centerTop = (bHeight + bPos.top) - (bHeight / 2);
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
						data.touchStartHorizontal = (data.touchStartX >= data.centerLeft) ? "right" : "left";
						data.touchStartVertical = (data.touchStartY >= data.centerTop) ? "bottom" : "top";

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

					setAngle(settings.value, $this);
				}
			});
		},
		destroy : function() {
			return this.each(function() {
				var $this = $(this),
					data = $this.data('knob');
				
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
