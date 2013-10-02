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
```
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
```
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
```
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