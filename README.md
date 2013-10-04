##SwipeScroll##
*By: AJ Savino*

SwipeScroll is a jQuery plug-in that provides touch based swiping for Tablets and Mobile devices.

* Easy to implement
* Built for speed
* Fires events on user interaction
* CSS 3 animation support
* Snapping, Momentum, and Easing
* Scrollbars

###BASIC IMPLEMENTATION###
*The following is an example for Swipeable marquees. See examples/marquee.html*

HTML
```HTML
	<div id="scrollerWrapper">
		<ul id="scroller">
			<li class="scroller-child" style="background-color:#FF0000;"></li>
			<li class="scroller-child" style="background-color:#00FF00;"></li>
			<li class="scroller-child" style="background-color:#0000FF;"></li>
			<li class="scroller-child" style="background-color:#FFFF00;"></li>
			<li class="scroller-child" style="background-color:#00FFFF;"></li>
			<li class="scroller-child" style="background-color:#FF00FF;"></li>
		</ul>
	</div>
```
`scroller` is what gets targeted using jQuery to apply SwipeScroll.
`scrollerWrapper` acts as a mask.
When snapping is enabled for the SwipeScroll instance the top-left of `scroller` children will snap with the top-left of `scrollerWrapper`.

CSS
```CSS
	#scrollerWrapper {
		overflow:hidden;
		width:100%;
		height:400px;
		position:relative;
	}
	
	#scroller {
		position:relative;
		top:0;
		left:0;
		height:100%;
	}
	
	.scroller-child {
		float:left;
		height:100%;
	}
```

JavaScript
```JavaScript
	$(document).on("ready", function(){
		sizeScroller(1);								//Show one child at a time

		var scroller = $("#scroller").SwipeScroll({ 	//Initialize SwipeScroll returns jQuery instance
			fps:60,										//Defaults to 30fps. Some devices (such as iPads) are able to run at 60fps
			scrollbars:true								//Defaults to false
		});
	});
	
	function sizeScroller(numChildrenVisible){			//Used to size children width
		var scrollerChildren = $(".scroller-child");
		var scrollerWidth = (100 / numChildrenVisible) * scrollerChildren.length;
		var childWidth = 100 / scrollerChildren.length;
		$("#scroller").css("width", scrollerWidth + "%");
		scrollerChildren.css("width", childWidth + "%");
	}
```
There is no need to tell SwipeScroll which direction it needs to move. This is determined automatically based on the size of the `scroller` in relation to the size of `scrollerWrapper`. For example if both `scroller` and `scrollerWrapper` are the same height (as in this case) but `scroller` is wider than `scrollerWrapper` then horizontal scrolling will be enabled.

####Optional Parameters####
*All parameters are optional and can be passed in using an object when initializing a SwipeScroll instance*
<pre>
• fps						DEFAULT = 30					FPS for rendering
• timing					DEFAULT = 0.5					Number of seconds to tween over for momentum
• dragThreshold			DEFAULT = 32					Minimum distance in pixels needed before dragging
• overDrag				DEFAULT = 0.25					Percent of elements parent size when over-dragging
• dragMaxSpeed			DEFAULT = 1024					Maximum pixels/second for momentum
• dragSpeedFactor			DEFAULT = 0.5					Factors into momentum
• useMomentum				DEFAULT = true					Use momentum after the user stops dragging
• useSnap					DEFAULT = true					Snap to immediate children
• scrollbars				DEFAULT = false					Show scrollbars
• scrollEasing			DEFAULT = null (expoEaseOut)	Easing method for tweening
• cssAnimationClass		DEFAULT = null (disabled)		CSS3 animation class for tweening
• bidirectional			DEFAULT = false					Allow horizontal/vertical dragging at the same time
</pre>

*One thing to note is when `scrollEasing` is null it defaults to an expoEaseOut equation. When `cssAnimationClass` is defined it will apply this class instead of using the easing equation (while falling back on the easing equation for older browsers). In my tests the easing equation always performs better than using css3 transitions. I think this is due to the speed the easing equation executes at in comparison to the calculations done by the browser for computing easing. Both the easing equation and css3 animations utilize hardware-accelerated rendering, the only difference is whether the JavaScript or CSS engine if performing the calculations.*