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
		// prevTurns is the total degrees already turned
		prevTurns = 360 * (~~(data.currentValue/360) + turnAmount); // ~~ forces integer division

		degrees += prevTurns; // add base angle with previous turns

		// don't allow values below min and above max angle
		degrees = Math.min(Math.max(degrees, settings.minAngle), settings.maxAngle);

		$knob.rotate({
			angle: (degrees - data.settings.labelAngle + data.settings.rotation)
		});

		data.currentValue = degrees;
		// console.log('prev  ' + prevTurns + 'turn ' + turnAmount + ' final degrees ' + degrees)
	};

	var getGesture = function(maxMouseX, maxMouseY) {
		var gesture;

		if(maxMouseX == 0) gesture = "vertical";
		else if(maxMouseY == 0) gesture = "horizontal";

		if(maxMouseX/maxMouseY > 1.5) gesture = "horizontal";
		else if(maxMouseY/maxMouseX > 1.5) gesture = "vertical";
		else gesture = "circular";

		return gesture;
	};


	var settings =  {                 // Default Orientation
		'minValue': 0,                //         270
		'maxValue': 100,              //   180    +    0
		'value': 0,                   //         90
		'rotation': 0, // angle of the entire knob relative to the default orientation
		'labelAngle': 0, // angle of the image relative to the default orientation
		'minAngle': 0, // relative to 0 (rotation automatically added)
		'maxAngle': 359, // relative to 0 (rotation automatically added)
		'direction': 'clockwise', // direction the knob turns from minAngle to maxAngle
		'turnSpeed': 2, // go 2 x number of pixels travelled by gesture (only applies to linear gestures)
		'sampleSize': 20, // how many locations to sample before locking gesture best guess
		'circularGestureEnabled': true,
		'verticalGestureEnabled': true,
		'horizontalGestureEnabled': true
	}


	var methods = {
		init : function(options) {
			return this.each(function() {
				// this.mousedown = function(event) {
				// 	alert('sdf')
				// };
				if(options) {
					$.extend(settings, options);
				}

				// var $this = $(this),
				var $this = $(this).rotate(0)[0],
					data = $this.data('knob');

				if(!data) {
					// setup

					$this.data('knob', {
						settings: settings,
						halfway: (settings.minAngle + (settings.maxAngle - settings.minAngle)/2),
						currentValue: settings.value
					});


					var $knob = $this;

					function downHandler(event) {
						//var $knob = $(event.target);
						var data = $knob.data('knob');
						var bPos = $knob.offset();
						var bWidth = $knob.width();
						var bHeight = $knob.height();

						data.centerLeft = (bWidth + bPos.left) - (bWidth / 2);
						data.centerTop = (bHeight + bPos.top) - (bHeight / 2);
						// var touchStartPos = { x: event.pageX, y: event.pageY };

						// var touchStartX, touchStartY;
						if(event.type == 'touchstart') {
							if(event.targetTouches.length != 1)
								return false;
							data.touchStartX = event.targetTouches[0].pageX;
							data.touchStartY = event.targetTouches[0].pageY;
						}
						else {
							data.touchStartX = event.pageX;
							data.touchStartY = event.pageY;
						}

						data.lastTouchX = data.touchStartX;
						data.lastTouchY = data.touchStartY;
						data.touchStartHorizontal = (data.touchStartX >= data.centerLeft) ? "right" : "left";
						data.touchStartVertical = (data.touchStartY >= data.centerTop) ? "bottom" : "top";


						data.touchStartAngle = 360 - Math.atan2(data.centerTop - data.touchStartY, data.touchStartX - data.centerLeft)/Math.PI*180 - data.settings.rotation;
						data.touchStartAngle %= 360;
						if (data.touchStartAngle < 0) data.touchStartAngle += 360;

						data.gesture = undefined;

						data.maxMouseX = 0;
						data.maxMouseY = 0;
						data.sampleCount = 4;

						//alert('bPos ' + bPos + 'bWidth ' + bWidth + 'centerLeft ' + centerLeft + 'centerTop ' + centerTop + 'touchStartX ' + touchStartX + 'touchStartY ' + touchStartY + ' ' + )
						function moveHandler(e) {
							// e.preventDefault();

							// var $knob = $('#knob1');
							var data = $knob.data('knob');

							var pageX, pageY;
							if(e.type == 'touchmove') {

								if(e.targetTouches.length != 1)
									return false;

								pageX = e.targetTouches[0].pageX;
								pageY = e.targetTouches[0].pageY;
							}
							else {
								pageX = e.pageX;
								pageY = e.pageY;
							}

							$('#debug').html('pageX,pageY ' + pageX + ' ' + pageY);

							var degrees = data.currentValue;

							// TODO: if the gesture started towards the bottom or top, assume horizontal
							// TODO: if the gesture started towards the left or right, assume vertical
							// After initial gesture guess (most likely vertical/horizontal), 
							// look for circular gesture. Stop looking once the sample size is reached.

							if(data.sampleCount < data.settings.sampleSize) {
								data.sampleCount = data.sampleCount + 1;

								if(Math.abs(pageX - data.touchStartX) > data.maxMouseX)
									data.maxMouseX = Math.abs(pageX - data.touchStartX);
								if(Math.abs(pageY - data.touchStartY) > data.maxMouseY)
									data.maxMouseY = Math.abs(pageY - data.touchStartY);
								var currentGesture = getGesture(data.maxMouseX, data.maxMouseY);
								if(data.gesture == undefined || currentGesture == "circular")  {
									// if(gesture != "circular" && currentGesture == "circular") {
									// 	console.log('changing to circular ' + touchStartAngle)
									// 	touchStartAngle = 360 - Math.atan2(centerTop - e.pageY,e.pageX - centerLeft)/Math.PI*180 - rotation;
									// 	touchStartAngle %= 360;
									// 	if (touchStartAngle < 0) touchStartAngle += 360;
										console.log('new startangle ' + data.touchStartAngle)
									// }
									data.gesture = currentGesture;
								}
							}

							// console.log(sampleCount + ' ' + gesture + ' ' + maxMouseX + ' ' + maxMouseY);

							if(data.gesture == "circular") {
								y = data.centerTop - pageY;
								x = pageX - data.centerLeft;
								var inputAngle = 360 - Math.atan2(y,x)/Math.PI*180;
								inputAngle -= data.settings.rotation;
								inputAngle %= 360;
								degrees = inputAngle;
							}
							else if(data.gesture == "vertical") {
								var change = (pageY - data.lastTouchY) * data.settings.turnSpeed;
								degrees += (data.touchStartHorizontal == "right") ? change : -change;
							}
							else if(data.gesture == "horizontal") {
								var change = (pageX - data.lastTouchX) * data.settings.turnSpeed;
								degrees += (data.touchStartVertical == "top") ? change : -change;
							}
							// console.log(data.gesture + degrees + ' ' + inputAngle)

							data.lastTouchX = pageX;
							data.lastTouchY = pageY;

							// if(gesture == "circular") {
							// 	console.log('circular: ' + degrees)
							// 	degrees -= touchStartAngle;
							// 	console.log('circular 22: ' + degrees)
							// }

							if (degrees < 0) degrees += 360;


							// slow down the transition from one position to another
							//degrees = currentValue + (degrees - currentValue)/2;
							//degrees = currentValue + Math.min(degrees - currentValue, 4);

							// console.log(data.lastTouchX, degrees)
							setAngle(degrees, $knob);

							return false;
						}

						if(event.type == 'touchstart') {
							document.addEventListener('touchmove', moveHandler, false);
							document.addEventListener('touchend', function(e) {
								document.removeEventListener('touchmove', moveHandler);
								document.removeEventListener('touchend', arguments.callee);
								return false;
							}, false);

							// $('#knob1').bind({
							// 	'touchmove': function(event) {
							// 		alert("yooo " + event.targetTouches);
							// 		return moveHandler(event);
							// 	},
							// 	'touchend': function(event) {
							// 		alert('touchend');
							// 		$(this).unbind('touchmove');
							// 		$(this).unbind('touchend');
							// 		return false;
							// 	}
							// });
						}
						else {
							$(document).bind({
								'mousemove': function(event) {
									return moveHandler(event);
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





					this.ontouchstart = downHandler; // don't use jquery object (event doesn't get passed correctly)
					//alert($this.attr('src'))
					$this.bind({
						// 'touchstart': function(event) {
						// 	//alert('touchstart');
						// 	return downHandler(event);
						// },

						'mousedown': function(event) {
					 		return downHandler(event);
							// return false;
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
