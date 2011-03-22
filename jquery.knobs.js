(function($) {
	var setAngle = function(degrees, $knob) {
		var data = $knob.data('knob');

		// enforce the limits on knob turning
		// make sure you can't skip from the min to the max (& vice versa) directly
		// (don't switch to the max unless the previous value was in the higher half 
		// and don't switch to the min unles the previous value was in the lower half)
		if(degrees > data.halfway) {
			if(data.currentValue == settings.minAngle)
				degrees = settings.minAngle;
			else if(degrees > settings.maxAngle)
				degrees = settings.maxAngle;
		}
		else {
			if(data.currentValue == settings.maxAngle)
				degrees = settings.maxAngle;
			else if(degrees < settings.minAngle)
				degrees = settings.minAngle;

		}

		$knob.rotate({
			angle: (degrees - data.settings.labelAngle + data.settings.rotation)
		});

		data.currentValue = degrees;
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
		'value': 50,                  //         90
		'minAngle': 0, // relative to 0 (rotation automatically added)
		'maxAngle': 360, // relative to 0 (rotation automatically added)
		'labelAngle': 0, // angle of the image relative to the default orientation
		'rotation': 0, // angle of the entire knob relative to the default orientation
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

					// this.ontouchstart = methods.downHandler; // don't use jquery object (event doesn't get passed correctly)
					//alert($this.attr('src'))
					$this.bind({
						// 'touchstart': function(event) {
						// 	//alert('touchstart');
						// 	return downHandler(event);
						// },

						'mousedown': function(event) {
					 		return methods.downHandler(event);
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
		},
		downHandler : function(event) {
			var $knob = $('#knob1');
			//var $knob = $(event.target);
			var data = $knob.data('knob');
			var bPos = $knob.offset();
			var bWidth = $knob.width();
			var bHeight = $knob.height();

			$knob.data('knob').centerLeft = (bWidth + bPos.left) - (bWidth / 2);
			$knob.data('knob').centerTop = (bHeight + bPos.top) - (bHeight / 2);
			// var touchStartPos = { x: event.pageX, y: event.pageY };

			// var touchStartX, touchStartY;
			if(event.type == 'touchstart') {
				if(event.targetTouches.length != 1)
					return false;
				$knob.data('knob').touchStartX = event.targetTouches[0].pageX;
				$knob.data('knob').touchStartY = event.targetTouches[0].pageY;
			}
			else {
				$knob.data('knob').touchStartX = event.pageX;
				$knob.data('knob').touchStartY = event.pageY;
			}

			$knob.data('knob').lastTouchX = data.touchStartX;
			$knob.data('knob').lastTouchY = data.touchStartY;
			$knob.data('knob').touchStartHorizontal = (data.touchStartX >= data.centerLeft) ? "right" : "left";
			$knob.data('knob').touchStartVertical = (data.touchStartY >= data.centerTop) ? "bottom" : "top";


			$knob.data('knob').touchStartAngle = 360 - Math.atan2(data.centerTop - data.touchStartY, data.touchStartX - data.centerLeft)/Math.PI*180 - data.settings.rotation;
			$knob.data('knob').touchStartAngle %= 360;
			if (data.touchStartAngle < 0) $knob.data('knob').touchStartAngle += 360;

			$knob.data('knob').gesture = undefined;

			$knob.data('knob').maxMouseX = 0;
			$knob.data('knob').maxMouseY = 0;
			$knob.data('knob').sampleCount = 4;

			//alert('bPos ' + bPos + 'bWidth ' + bWidth + 'centerLeft ' + centerLeft + 'centerTop ' + centerTop + 'touchStartX ' + touchStartX + 'touchStartY ' + touchStartY + ' ' + )
			function moveHandler(e) {
				// e.preventDefault();

				var $knob = $('#knob1');
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

console.log(data.settings.sampleSize)
				if(data.sampleCount < data.settings.sampleSize) {
					$knob.data('knob').sampleCount = data.sampleCount + 1;
console.log($knob.data('knob').sampleCount)
					if(Math.abs(pageX - data.touchStartX) > data.maxMouseX)
						$knob.data('knob').maxMouseX = Math.abs(pageX - data.touchStartX);
					if(Math.abs(pageY - data.touchStartY) > data.maxMouseY)
						$knob.data('knob').maxMouseY = Math.abs(pageY - data.touchStartY);
					var currentGesture = getGesture(data.maxMouseX, data.maxMouseY);
					if(data.gesture == undefined || currentGesture == "circular")  {
						// if(gesture != "circular" && currentGesture == "circular") {
						// 	console.log('changing to circular ' + touchStartAngle)
						// 	touchStartAngle = 360 - Math.atan2(centerTop - e.pageY,e.pageX - centerLeft)/Math.PI*180 - rotation;
						// 	touchStartAngle %= 360;
						// 	if (touchStartAngle < 0) touchStartAngle += 360;
							console.log('new startangle ' + $knob.data('knob').touchStartAngle)
						// }
						$knob.data('knob').gesture = currentGesture;
					}
				}

				// console.log(sampleCount + ' ' + gesture + ' ' + maxMouseX + ' ' + maxMouseY);

				if(data.gesture == "circular") {
					y = data.centerTop - pageY;
					x = pageX - data.centerLeft;
					var inputAngle = 360 - Math.atan2(y,x)/Math.PI*180;
					inputAngle -= data.settings.rotation;
					// console.log(degrees + ' ' + inputAngle)
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

				$knob.data('knob').lastTouchX = pageX;
				$knob.data('knob').lastTouchY = pageY;

				// if(gesture == "circular") {
				// 	console.log('circular: ' + degrees)
				// 	degrees -= touchStartAngle;
				// 	console.log('circular 22: ' + degrees)
				// }
				degrees %= 360;
				if (degrees < 0) degrees += 360;


				// slow down the transition from one position to another
				//degrees = currentValue + (degrees - currentValue)/2;
				//degrees = currentValue + Math.min(degrees - currentValue, 4);

				console.log($knob.data('knob').lastTouchX, degrees)
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















/*



var rotation = 90; // angle where 0 is located
var labelAngle = 270; // angle the image knob tip is pointing at
var minAngle = 40;
var maxAngle = 320;
var halfway = minAngle + (maxAngle - minAngle)/2;
var direction = "clockwise";
var currentValue = minAngle;
var turnSpeed = 2; // change the relation between drag speed and knob rotation
var sampleCount = 0;
var sampleSize = 20;

function setAngle(degrees, $knob) {

	// enforce the limits on knob turning
	// make sure you can't skip from the min to the max (& vice versa) directly
	// (don't switch to the max unless the previous value was in the higher half 
	// and don't switch to the min unles the previous value was in the lower half)
	if(degrees > halfway) {
		if(currentValue == minAngle)
			degrees = minAngle;
		else if(degrees > maxAngle)
			degrees = maxAngle;
	}
	else {
		if(currentValue == maxAngle)
			degrees = maxAngle;
		else if(degrees < minAngle)
			degrees = minAngle;

	}

	currentValue = degrees;
	$('#angle').val(currentValue);
	$('#amount').val(currentValue - minAngle);
	$knob.rotate({ angle: currentValue - labelAngle + rotation });
}

setAngle(currentValue, $('#knob1'));
setAngle(currentValue, $('#knob2'));

function getGesture(maxMouseX, maxMouseY) {
	var gesture;

	if(maxMouseX == 0) gesture = "vertical";
	else if(maxMouseY == 0) gesture = "horizontal";

	if(maxMouseX/maxMouseY > 1.5) gesture = "horizontal";
	else if(maxMouseY/maxMouseX > 1.5) gesture = "vertical";
	else gesture = "circular";

	return gesture;
}

$('#knob1')[0].ontouchstart = downHandler
$('#knob1').bind({
	// 'touchstart': function(event) {
	// 	//alert('touchstart');
	// 	return downHandler(event);
	// },

	'mousedown': function(event) {
		return downHandler(event);
	}
});

$('#knob2')[0].ontouchstart = downHandler
$('#knob2').bind({
	// 'touchstart': function(event) {
	// 	//alert('touchstart');
	// 	return downHandler(event);
	// },

	'mousedown': function(event) {
		return downHandler(event);
	}
});


function downHandler(event) {
	var $knob = $(event.target);
	var bPos = $knob.offset();
	var bWidth = $knob.width();
	var bHeight = $knob.height();

	var centerLeft = (bWidth + bPos.left) - (bWidth / 2);
	var centerTop = (bHeight + bPos.top) - (bHeight / 2);
	// var touchStartPos = { x: event.pageX, y: event.pageY };

	var touchStartX, touchStartY;
	if(event.type == 'touchstart') {
		if(event.targetTouches.length != 1)
			return false;
		touchStartX = event.targetTouches[0].pageX;
		touchStartY = event.targetTouches[0].pageY;
	}
	else {
		touchStartX = event.pageX;
		touchStartY = event.pageY;
	}

	var lastTouchX = touchStartX;
	var lastTouchY = touchStartY;
	var touchStartHorizontal = (touchStartX >= centerLeft) ? "right" : "left";
	var touchStartVertical = (touchStartY >= centerTop) ? "bottom" : "top";


	var touchStartAngle = 360 - Math.atan2(centerTop - touchStartY, touchStartX - centerLeft)/Math.PI*180 - rotation;
	touchStartAngle %= 360;
	if (touchStartAngle < 0) touchStartAngle += 360;

	var gesture = undefined;


	var increasing = false;

	var maxMouseX = 0;
	var maxMouseY = 0;
	sampleCount = 0;

	//alert('bPos ' + bPos + 'bWidth ' + bWidth + 'centerLeft ' + centerLeft + 'centerTop ' + centerTop + 'touchStartX ' + touchStartX + 'touchStartY ' + touchStartY + ' ' + )
	function moveHandler(e) {
		// e.preventDefault();

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

		$('#debug').html('pageX,pageY ' + pageX + ' ' + pageY)
		var degrees = currentValue;

		// TODO: if the gesture started towards the bottom or top, assume horizontal
		// TODO: if the gesture started towards the left or right, assume vertical
		// After initial gesture guess (most likely vertical/horizontal), 
		// look for circular gesture. Stop looking once the sample size is reached.

		if(sampleCount < sampleSize) {
			sampleCount++;
			if(Math.abs(pageX - touchStartX) > maxMouseX)
				maxMouseX = Math.abs(pageX - touchStartX);
			if(Math.abs(pageY - touchStartY) > maxMouseY)
				maxMouseY = Math.abs(pageY - touchStartY);
			var currentGesture = getGesture(maxMouseX, maxMouseY);
			if(gesture == undefined || currentGesture == "circular")  {
				// if(gesture != "circular" && currentGesture == "circular") {
				// 	console.log('changing to circular ' + touchStartAngle)
				// 	touchStartAngle = 360 - Math.atan2(centerTop - e.pageY,e.pageX - centerLeft)/Math.PI*180 - rotation;
				// 	touchStartAngle %= 360;
				// 	if (touchStartAngle < 0) touchStartAngle += 360;
				// 	console.log('new startangle ' + touchStartAngle)
				// }
				gesture = currentGesture;
			}
		}

		// console.log(sampleCount + ' ' + gesture + ' ' + maxMouseX + ' ' + maxMouseY);

		if(gesture == "circular") {
			y = centerTop - pageY;
			x = pageX - centerLeft;
			var inputAngle = 360 - Math.atan2(y,x)/Math.PI*180;
			inputAngle -= rotation;
			// console.log(degrees + ' ' + inputAngle)
			degrees = inputAngle;
		}
		else if(gesture == "vertical") {
			var change = (pageY - lastTouchY) * turnSpeed;
			degrees += (touchStartHorizontal == "right") ? change : -change;
		}
		else if(gesture == "horizontal") {
			var change = (pageX - lastTouchX) * turnSpeed;
			degrees += (touchStartVertical == "top") ? change : -change;
		}

		lastTouchX = pageX;
		lastTouchY = pageY;

		// if(gesture == "circular") {
		// 	console.log('circular: ' + degrees)
		// 	degrees -= touchStartAngle;
		// 	console.log('circular 22: ' + degrees)
		// }
		degrees %= 360;
		if (degrees < 0) degrees += 360;


		// slow down the transition from one position to another
		//degrees = currentValue + (degrees - currentValue)/2;
		//degrees = currentValue + Math.min(degrees - currentValue, 4);

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
				$(this).unbind('mousemove');
				$(this).unbind('mouseup');
				return false;
			}
		});
	}
	return false;
} // end downHandler

*/