/*
* SwipeScroll v1.0.1 Copyright (c) 2013 AJ Savino
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/
var SwipeScroll = {
	EVENT_CHANGING:"event_changing",		//Fires when tween begins
	EVENT_CHANGED:"event_changed",			//Fires when tween ends or has completed changing
	
	DIRECTION_HORIZONTAL:"horizontal",
	DIRECTION_VERTICAL:"vertical",
	
	defaults:{
		fps:30,					//FPS for rendering
		timing:0.5,				//Seconds to scroll over
		dragThreshold:32,		//Min distance in pixels needed to scroll
		overDrag:0.25,			//Percent of element parent size
		dragMaxSpeed:1024,		//Pixels/second
		dragSpeedFactor:0.5,	//Factor into speed when dragging
		useMomentum:true,		//Momentum
		useSnap:true, 			//Snap
		scrollbars:false,		//Display scrollbars
		scrollEasing:null,		//Easing method when css animation is not used
		cssAnimationClass:null,	//CSS3 animation class to use when tweening (optional)
		bidirectional:false		//Allow scrolling at angles rather than just horizontal or vertical
	},
	
	expoEaseOut:function(elapsedTime, startVal, diffVal, totalTime){ //Default
		return diffVal * (-Math.pow(2, -10 * elapsedTime / totalTime) + 1) + startVal;
	},
	
	NormalTimer:function(){
		var classDefinition = {
			delta:0,
			lastTime:0,
			tick:function(){
				var currentTime = new Date().getTime();
				classDefinition.delta = (currentTime - classDefinition.lastTime) * 0.001;
				classDefinition.lastTime = currentTime;
				return classDefinition.delta;
			}
		};
		return classDefinition;
	}
};

(function($){ //Dependencies: jQuery (Built on 1.8.2)
	$.fn.SwipeScroll = function(options){
		var _options = $.extend({}, $.fn.SwipeScroll.defaults, options);
		
		var _isActive = false;
		var _element = this;
		var _parent = this.parent();
		var _children = null;
		
		var _scrollbarHMask = null;
		var _scrollbarH = null;
		var _scrollbarVMask = null;
		var _scrollbarV = null;
		
		var _isDragging = false;
		var _beginDragPoint = {};
		var _dragPoint = {};
		var _dragElapsedTime = 0;
		var _dragDirection = null;
		
		var _beginDragElementPoint = {};
		var _lastElementPoint = {};
		var _toElementPoint = {};
		var _beginDragPageScrollPoint = {};
		var _toPageScrollPoint = {};
		var _isPageScrolling = false;
		
		var _isRendering = false;
		var _beginTweenPoint = {};
		var _tweenElapsedTime = 0;
		
		var _dragNormalTimer = null;
		var _renderNormalTimer = null;
		var _renderTimer = null;
		var _resizeTimeout = null;
		
		var _selectedChild = null;
		var _selectedIndex = -1;
		var _indexChanged = false;
		
		var _methods = {
			initialize:function(){
				if (!_options.scrollEasing){
					_options.scrollEasing = SwipeScroll.expoEaseOut; //Default
				}
				if (_options.cssAnimationClass){ //Check for CSS3 transition support
					var transitionSupport = ["webkitTransition", "mozTransition", "OTransition", "transition"];
					var transitionSupportLen = transitionSupport.length;
					for (var i = 0; i < transitionSupportLen; i++){
						if (typeof(document.documentElement.style[transitionSupport[i]]) !== typeof(undefined)){
							break;
						}
					}
					if (i == transitionSupportLen){ //CSS3 transition not supported
						_options.cssAnimationClass = null;
					}
				}
				if (_options.scrollbars){
					_methods.buildScrollbars();
				}
				_dragNormalTimer = SwipeScroll.NormalTimer();
				_renderNormalTimer = SwipeScroll.NormalTimer();
				_methods.updateChildren();
				_selectedChild = $(_children[0]);
				_selectedIndex = 0;
			},
			
			destroy:function(){
				if (_scrollbarHMask){
					_scrollbarHMask.remove();
					_scrollbarHMask = null;
				}
				if (_scrollbarH){
					_scrollbarH.remove();
					_scrollbarH = null;
				}
				if (_scrollbarVMask){
					_scrollbarVMask.remove();
					_scrollbarVMask = null;
				}
				if (_scrollbarV){
					_scrollbarV.remove();
					_scrollbarV = null;
				}
				_dragNormalTimer = null;
				_renderNormalTimer = null;
				if (_renderTimer){
					clearInterval(_methods.handler_renderTimer);
					_renderTimer = null;
				}
				if (_resizeTimeout){
					clearTimeout(_methods.handler_resizeTimeout);
					_resizeTimeout = null;
				}
				_children = null;
				_selectedChild = null;
			},
			
			activate:function(){
				if (_isActive){
					return;
				}
				_isActive = true;
				
				_parent.css({
					"-webkit-transform":"translate3d(0, 0, 0)", //Hardware acceleration hacks
					"-moz-transform":"translate3d(0, 0, 0)",
					"-o-transform":"translate3d(0, 0, 0)",
					"transform":"translate3d(0, 0, 0)",
					"-webkit-backface-visibility":"hidden",
					"-moz-backface-visibility":"hidden",
					"-o-backface-visibility":"hidden",
					"backface-visibility":"hidden",
					"-ms-touch-action":"none", //Prevent IE from capturing touch events
				});
				_parent.on("touchstart mousedown", _methods.handler_beginDrag);
				
				var doc = $(document);
				doc.on("touchmove mousemove", _methods.handler_moveDrag);
				doc.on("touchend mouseup", _methods.handler_endDrag);
				
				var resizeEvent = "resize";
				if ("onorientationchange" in window){
					resizeEvent = "orientationchange";
				}
				$(window).on(resizeEvent, _methods.handler_resize);
			},
			
			deactivate:function(){
				if (!_isActive){
					return;
				}
				_isActive = false;
				
				_parent.css({
					"-webkit-transform":"", //Hardware acceleration hacks
					"-moz-transform":"",
					"-o-transform":"",
					"transform":"",
					"-webkit-backface-visibility":"visible",
					"-moz-backface-visibility":"visible",
					"-o-backface-visibility":"visible",
					"backface-visibility":"visible",
					"-ms-touch-action":"auto", //Prevent IE from capturing touch events
				});
				_parent.off("touchstart mousedown", _methods.handler_beginDrag);
				
				var doc = $(document);
				doc.off("touchmove mousemove", _methods.handler_moveDrag);
				doc.off("touchend mouseup", _methods.handler_endDrag);
				
				var resizeEvent = "resize";
				if ("onorientationchange" in window){
					resizeEvent = "orientationchange";
				}
				$(window).off(resizeEvent, _methods.handler_resize);
			},
			
			reset:function(){
				_methods.deactivate();
				_methods.destroy();
				_methods.initialize();
				_methods.activate();
			},
			
			scrollToChild:function(selectChild, tween){ //Selects child
				if (!selectChild || !selectChild.jquery){
					throw new Error("Invalid selectChild must be a jquery object of _element.children().");
				}
				if (typeof(tween) === typeof(undefined)){
					tween = true; //Default
				}
				if (typeof(selectChild.data("SwipeScroll.index")) === typeof(undefined)){
					_methods.updateChildren();
				}
				var selectChildPoint = selectChild.position();
				_toElementPoint.x = -selectChildPoint.left;
				_toElementPoint.y = -selectChildPoint.top;
				_methods.rangeElementPoint();
				
				var snapChild = _methods.getClosestChild(_toElementPoint);
				var snapChildPoint = snapChild.position();
				_toElementPoint.x = -snapChildPoint.left;
				_toElementPoint.y = -snapChildPoint.top;
				if (_element.is(":hidden")){ //Position not accurate
					_toElementPoint.x = 0;
					_toElementPoint.y = 0;
				}
				
				var newIndex = snapChild.data("SwipeScroll.index");
				if (newIndex != _selectedIndex){
					_selectedChild = snapChild;
					_selectedIndex = newIndex;
					_indexChanged = true;
				} else {
					_indexChanged = false
				}
				
				_methods.endDrag();
				_methods.endTween(true); //Calls endRender. Prevent eventChanged
				if (tween){
					_methods.beginRender();
					_methods.beginTween(_methods.getElementPoint());
				} else {
					_methods.setElementPoint(_toElementPoint);
					_methods.fireEventChanged();
				}
			},
			
			scrollToIndex:function(index){
				index = Math.max(Math.min(index, _children.length - 1), 0);
				_methods.scrollToChild($(_children[index]));
			},
			
			scrollPrevious:function(count, tween){
				if (typeof(count) === typeof(undefined)){
					count = 1; //Default
				}
				if (_selectedIndex == -1){
					return;
				}
				_methods.scrollToIndex(_selectedIndex - count);
			},
			
			scrollNext:function(count, tween){
				if (typeof(count) === typeof(undefined)){
					count = 1; //Default
				}
				if (_selectedIndex == -1){
					return;
				}
				_methods.scrollToIndex(_selectedIndex + count);
			},
			
			updateChildren:function(){
				_children = _element.children();
				var childrenLen = _children.length;
				for (var i = 0; i < childrenLen; i++){
					$(_children[i]).data("SwipeScroll.index", i);
				}
				if (_options.scrollbars){
					_methods.sizeScrollbars();
				}
				var aElement = $("a", _element);
				aElement.off("click", _methods.handler_child_click);
				aElement.on("click", _methods.handler_child_click);
			},
			
			handler_child_click:function(){ //Prevent clicks when Swiping
				if (_isRendering){
					return false;
				}
			},
			
			buildScrollbars:function(){
				_scrollbarHMask = $("<div class='swipescroll-scrollbar-mask swipescroll-scrollbar-h-mask'style='display:none;overflow:hidden;position:absolute;bottom:1px;left:1px;width:100%;height:4px;-webkit-border-radius:4px;-moz-border-radius:4px;border-radius:4px;'></div>");
				_scrollbarH = $("<div class='swipescroll-scrollbar swipescroll-scrollbar-h'style='position:absolute;left:0;bottom:0;background-color:rgba(0,0,0,0.6);min-width:4px;height:100%;-webkit-border-radius:4px;-moz-border-radius:4px;border-radius:4px;'></div>");
				_scrollbarHMask.append(_scrollbarH);
				_parent.append(_scrollbarHMask);
				_scrollbarVMask = $("<div class='swipescroll-scrollbar-mask swipescroll-scrollbar-v-mask'style='display:none;overflow:hidden;position:absolute;right:1px;top:1px;width:4px;height:100%;-webkit-border-radius:4px;-moz-border-radius:4px;border-radius:4px;'></div>");
				_scrollbarV = $("<div class='swipescroll-scrollbar swipescroll-scrollbar-v'style='position:absolute;right:0;top:0;background-color:rgba(0,0,0,0.6);width:100%;min-height:4px;-webkit-border-radius:4px;-moz-border-radius:4px;border-radius:4px;'></div>");
				_scrollbarVMask.append(_scrollbarV);
				_parent.append(_scrollbarVMask);
			},
			
			sizeScrollbars:function(){
				var elementWidth = _element.width();
				var elementHeight = _element.height();
				var parentWidth = _parent.width();
				var parentHeight = _parent.height();
				if (elementWidth <= parentWidth){ //Can't scroll horizontally
					_scrollbarHMask.hide();
				} else {
					_scrollbarHMask.css("width", (parentWidth - 2) + "px"); //-2 for 1px on each side
					_scrollbarHMask.show();
					var newWidth = (parentWidth / (elementWidth / parentWidth) >> 0) - 2; //-2 for 1px on each side
					_scrollbarH.css("width", newWidth + "px");
				}
				if (elementHeight <= parentHeight){ //Can't scroll vertically
					_scrollbarVMask.hide();
				} else {
					_scrollbarVMask.css("height", (parentHeight - 2) + "px"); //-2 for 1px on each side
					_scrollbarVMask.show();
					var newHeight = (parentHeight / (elementHeight / parentHeight) >> 0) - 2; //-2 for 1px on each side
					_scrollbarV.css("height", newHeight + "px");
				}
				_methods.positionScrollbars();
			},
			
			positionScrollbars:function(){
				var elementWidth = _element.width();
				var elementHeight = _element.height();
				var parentWidth = _parent.width();
				var parentHeight = _parent.height();
				var elementPoint = _methods.getElementPoint();
				var scrollbarHMaskWidth = _scrollbarHMask.width();
				var scrollbarHWidth = _scrollbarH.width();
				var scrollbarVMaskHeight = _scrollbarVMask.height();
				var scrollbarVHeight = _scrollbarV.height();
				var scrollbarHPercent = (elementWidth - (elementWidth + elementPoint.x)) / (elementWidth - parentWidth);
				var scrollbarHLeft = ((scrollbarHMaskWidth - scrollbarHWidth) * scrollbarHPercent) >> 0;
				var scrollbarVPercent = (elementHeight - (elementHeight + elementPoint.y)) / (elementHeight - parentHeight);
				var scrollbarVTop = ((scrollbarVMaskHeight - scrollbarVHeight) * scrollbarVPercent) >> 0;
				scrollbarHLeft = Math.max(Math.min(scrollbarHLeft, scrollbarHMaskWidth - 8), -scrollbarHWidth + 8); //Scrollbar position range buffer
				scrollbarVTop = Math.max(Math.min(scrollbarVTop, scrollbarVMaskHeight - 8), -scrollbarVHeight + 8); //Scrollbar position range buffer
				_scrollbarH.css("left", scrollbarHLeft + "px");
				_scrollbarV.css("top", scrollbarVTop + "px");
			},
			
			handler_beginDrag:function(evt){
				if (evt.type == "mousedown"){ //Desktop
					evt.preventDefault();
				}
				if (_isDragging){
					return;
				}
				_isDragging = true;
				_beginDragPoint = _methods.getDragPoint(evt);
				_dragDirection = null;
				
				_beginDragElementPoint = _methods.getElementPoint();
				_toElementPoint = _methods.getElementPoint();
				_beginDragPageScrollPoint = _methods.getPageScrollPoint();
				_toPageScrollPoint = _methods.getPageScrollPoint();
				_isPageScrolling = false;
				
				_methods.endTween(); //Calls endRender
				
				_dragElapsedTime = 0;
				_dragNormalTimer.tick();
			},
			
			handler_moveDrag:function(evt){
				if (!_isDragging){
					return;
				}
				evt.preventDefault();
				
				var delta = _dragNormalTimer.tick();
				if (!delta){
					return;
				}
				_dragElapsedTime += delta;
				_dragPoint = _methods.getDragPoint(evt);
				var dragDiffX = _dragPoint.x - _beginDragPoint.x;
				var dragDiffY = _dragPoint.y - _beginDragPoint.y;
				
				var elementWidth = _element.width();
				var elementHeight = _element.height();
				var parentWidth = _parent.width();
				var parentHeight = _parent.height();
				if (!_isRendering){ //Threshold not met
					if (Math.sqrt(dragDiffX * dragDiffX + dragDiffY * dragDiffY) >= _options.dragThreshold){
						if (Math.abs(dragDiffX) >= Math.abs(dragDiffY)){ //Dragged horizontal
							_dragDirection = SwipeScroll.DIRECTION_HORIZONTAL;
							if (elementWidth <= parentWidth){ //Can't scroll horizontally
								_isPageScrolling = true;
							}
						} else { //Dragged vertical
							_dragDirection = SwipeScroll.DIRECTION_VERTICAL;
							if (elementHeight <= parentHeight){ //Can't scroll vertically
								_isPageScrolling = true;
							}
						}
						_methods.beginRender();
					} else {
						return;
					}
				}
				
				if (_dragDirection == SwipeScroll.DIRECTION_HORIZONTAL || _options.bidirectional){ //Dragged horizontal
					if (!_isPageScrolling){
						var overDrag = _options.overDrag * parentWidth;
						_toElementPoint.x = _beginDragElementPoint.x + dragDiffX;
						_toElementPoint.x = Math.max(Math.min(_toElementPoint.x, overDrag), -(elementWidth - parentWidth) - overDrag); //Range
					} else {
						_toPageScrollPoint.x = _beginDragPageScrollPoint.x + dragDiffX;
					}
				}
				if (_dragDirection == SwipeScroll.DIRECTION_VERTICAL || _options.bidirectional){ //Dragged vertical
					if (!_isPageScrolling){
						var overDrag = _options.overDrag * parentHeight;
						_toElementPoint.y = _beginDragElementPoint.y + dragDiffY;
						_toElementPoint.y = Math.max(Math.min(_toElementPoint.y, overDrag), -(elementHeight - parentHeight) - overDrag); //Range
					} else {
						_toPageScrollPoint.y = _beginDragPageScrollPoint.y + dragDiffY;
					}
				}
			},
			
			handler_endDrag:function(evt){
				if (evt.type == "mouseup"){ //Desktop
					evt.preventDefault();
				}
				if (!_methods.endDrag()){
					return;
				}
				if (_isRendering){ //Threshold met
					if (!_isPageScrolling){
						if (_options.useMomentum){
							_methods.calcMomentum(_beginDragElementPoint, _toElementPoint);
						}
						_methods.rangeElementPoint();
						if (_options.useSnap){
							_methods.scrollToChild(_methods.getClosestChild(_toElementPoint));
						} else {
							_methods.beginTween(_methods.getElementPoint());
						}
					} else {
						if (_options.useMomentum){
							_methods.calcMomentum(_beginDragPageScrollPoint, _toPageScrollPoint);
						}
						_methods.rangePageScrollPoint();
						_methods.beginTween(_methods.getPageScrollPoint());
					}
				}
			},
			
			endDrag:function(){
				if (!_isDragging){
					return false;
				}
				_isDragging = false;
				return true;
			},
			
			beginRender:function(){
				if (_isRendering){
					return;
				}
				_isRendering = true;
				
				_renderNormalTimer.tick();
				_renderTimer = setInterval(_methods.handler_renderTimer, (1000 / _options.fps) >> 0);
			},
			
			handler_renderTimer:function(evt){
				if (!_isRendering){
					return;
				}
				var delta = _renderNormalTimer.tick();
				if (!delta){
					return;
				}
				if (_isDragging){ //Exact positioning while dragging
					if (!_isPageScrolling){
						_methods.setElementPoint(_toElementPoint);
					} else {
						_methods.setPageScrollPoint(_toPageScrollPoint);
					}
				} else { //Tween to position after dragging
					if (!_isPageScrolling){
						_methods.setElementPoint(_methods.doTween(_toElementPoint, delta));
					} else {
						_methods.setPageScrollPoint(_methods.doTween(_toPageScrollPoint, delta));
					}
				}
				if (_options.scrollbars){
					_methods.positionScrollbars();
				}
			},
			
			endRender:function(){
				if (!_isRendering){
					return;
				}
				_isRendering = false;
				_isPageScrolling = false;
				clearInterval(_renderTimer);
				_renderTimer = null;
			},
			
			beginTween:function(fromPoint){
				_beginTweenPoint = fromPoint;
				_tweenElapsedTime = 0;
				
				if (!_isPageScrolling){
					$(_element).trigger(SwipeScroll.EVENT_CHANGING, {
						selectedChild:_selectedChild,
						selectedIndex:_selectedIndex
					});
					if (_options.cssAnimationClass){
						_methods.endRender(); //Stop render timer
						_element.on("webkitTransitionEnd otransitionend transitionend", _methods.endTween);
						_element.addClass(_options.cssAnimationClass);
						_methods.setElementPoint(_toElementPoint);
					}
				}
			},
			
			doTween:function(toPoint, delta){ //Called from render
				var newPoint = {};
				_tweenElapsedTime += delta;
				if (_tweenElapsedTime < _options.timing){ //Move towards
					newPoint.x = _beginTweenPoint.x + _options.scrollEasing(_tweenElapsedTime, 0, toPoint.x - _beginTweenPoint.x, _options.timing);
					newPoint.y = _beginTweenPoint.y + _options.scrollEasing(_tweenElapsedTime, 0, toPoint.y - _beginTweenPoint.y, _options.timing);
				} else { //Complete and snap
					_tweenElapsedTime = _options.timing;
					newPoint.x = toPoint.x;
					newPoint.y = toPoint.y;
					_methods.endTween();
				}
				return newPoint;
			},
			
			endTween:function(preventEventChanged){
				_beginTweenPoint = null;
				_tweenElapsedTime = _options.timing;
				
				_methods.endRender();
				if (!_isPageScrolling){
					if (_options.cssAnimationClass){
						_element.off("webkitTransitionEnd otransitionend transitionend", _methods.endTween);
						_element.removeClass(_options.cssAnimationClass);
					}
					if (preventEventChanged !== true){
						_methods.fireEventChanged();
					}
				}
			},
			
			isTweening:function(){
				return _tweenElapsedTime > 0 && _tweenElapsedTime < _options.timing;
			},
			
			handler_resize:function(){
				if (_resizeTimeout){
					clearTimeout(_resizeTimeout);
				}
				_resizeTimeout = setTimeout(function(){
					clearTimeout(_resizeTimeout);
					if (_options.scrollbars){
						_methods.sizeScrollbars();
					}
					if (_options.useSnap){
						_methods.scrollToChild(_selectedChild, false);
					}
				}, (1000 / _options.fps) >> 0);
			},
			
			getDragPoint:function(evt){
				var pointData = evt;
				if (evt.originalEvent){
					if (evt.originalEvent.touches || evt.originalEvent.changedTouches){
						pointData = evt.originalEvent.touches[0] || evt.originalEvent.changedTouches[0];
					}
				}
				return {
					x:pointData.clientX,
					y:pointData.clientY
				};
			},
			
			calcMomentum:function(fromPoint, toPoint){
				var pointDiffX = toPoint.x - fromPoint.x;
				var pointDiffY = toPoint.y - fromPoint.y;
				var pointDist = Math.sqrt(pointDiffX * pointDiffX + pointDiffY * pointDiffY);
				var dragDiffX = _dragPoint.x - _beginDragPoint.x;
				var dragDiffY = _dragPoint.y - _beginDragPoint.y;
				var dragDist = Math.sqrt(dragDiffX * dragDiffX + dragDiffY * dragDiffY);
				var momentumDist = Math.min((dragDist * _options.dragSpeedFactor) / _dragElapsedTime, _options.dragMaxSpeed) * _options.timing;
				toPoint.x += pointDiffX / pointDist * momentumDist;
				toPoint.y += pointDiffY / pointDist * momentumDist;
				return toPoint;
			},
			
			getElementPoint:function(){
				return {
					x:parseInt(_element.css("left")),
					y:parseInt(_element.css("top"))
				};
			},
			
			setElementPoint:function(point){
				var newX = point.x >> 0; //Floor
				var newY = point.y >> 0; //Floor
				if (newX != _lastElementPoint.x){
					_element.css("left", newX);
					_lastElementPoint.x = newX;
				}
				if (newY != _lastElementPoint.y){
					_element.css("top", newY);
					_lastElementPoint.y = newY;
				}
			},
			
			rangeElementPoint:function(){
				_toElementPoint.x = Math.min(Math.max(_toElementPoint.x, _parent.width() - _element.width()), 0);
				_toElementPoint.y = Math.min(Math.max(_toElementPoint.y, _parent.height() - _element.height()), 0);
			},
			
			getPageScrollPoint:function(){
				return {
					x:-(window.pageXOffset || document.documentElement.scrollLeft),
					y:-(window.pageYOffset || document.documentElement.scrollTop)
				};
			},
			
			setPageScrollPoint:function(point){
				window.scrollTo(-point.x >> 0, -point.y >> 0);
			},
			
			rangePageScrollPoint:function(){
				_toPageScrollPoint.x = Math.min(Math.max(_toPageScrollPoint.x, $(window).width() - $(document).width()), 0);
				_toPageScrollPoint.y = Math.min(Math.max(_toPageScrollPoint.y, $(window).height() - $(document).height()), 0);
			},
			
			getClosestChild:function(fromPoint){
				var bestDist = -1;
				var bestChild = null;
				var children = _children;
				var childrenLen = children.length;
				for (var i = 0; i < childrenLen; i++){
					var child = $(children[i]);
					var childPoint = child.position();
					var diffX = fromPoint.x + childPoint.left;
					var diffY = fromPoint.y + childPoint.top;
					var dist = Math.sqrt(diffX * diffX + diffY * diffY);
					if (bestDist == -1 || dist < bestDist){
						bestDist = dist;
						bestChild = child;
					}
				}
				return bestChild;
			},
			
			fireEventChanged:function(){
				if (!_indexChanged){
					return;
				}
				$(_element).trigger(SwipeScroll.EVENT_CHANGED, {
					selectedChild:_selectedChild,
					selectedIndex:_selectedIndex
				});
				_indexChanged = false;
			}
		};
		_methods.initialize();
		_methods.activate();
		
		this.SwipeScroll = { //Expose public methods
			initialize:_methods.initialize,
			destroy:_methods.destroy,
			activate:_methods.activate,
			deactivate:_methods.deactivate,
			reset:_methods.reset,
			scrollToChild:_methods.scrollToChild,
			scrollToIndex:_methods.scrollToIndex,
			scrollPrevious:_methods.scrollPrevious,
			scrollNext:_methods.scrollNext,
			updateChildren:_methods.updateChildren,
			getSelectedChild:function(){
				return _selectedChild;
			},
			getSelectedIndex:function(){
				return _selectedIndex;
			}
		};
		return this; //jQuery chaining
	}
	
	$.fn.SwipeScroll.defaults = SwipeScroll.defaults;
}(jQuery));