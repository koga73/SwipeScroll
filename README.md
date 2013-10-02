##SwipeScroll##
*By: AJ Savino*

SwipeScroll is a jQuery plug-in that provides touch based swiping for Tablets and Mobile devices.

* Easy to implement
* Built for speed
* Fires events on user interaction
* CSS 3 animation support
* Snapping, Momentum, and Easing
* Scrollbars

#BASIC IMPLEMENTATION#
*The following is an example for Swipeable marquees. See examples/marquee.html*

HTML
	<div id="scrollerWrapper">
		<ul id="scroller">
			<li class="scroller-child" style="background-color:#FF0000;"></li>
			<li class="scroller-child" style="background-color:#00FF00;"></li>
			<li class="scroller-child" style="background-color:#0000FF;"></li>
			<li class="scroller-child" style="background-color:#FFFF00;"></li>
			<li class="scroller-child" style="background-color:#00FFFF;"></li>
			<li class="scroller-child" style="background-color:#FF00FF;"></li>
			<li class="scroller-child" style="background-color:#800000;"></li>
			<li class="scroller-child" style="background-color:#008000;"></li>
			<li class="scroller-child" style="background-color:#000080;"></li>
			<li class="scroller-child" style="background-color:#808000;"></li>
			<li class="scroller-child" style="background-color:#008080;"></li>
			<li class="scroller-child" style="background-color:#800080;"></li>
		</ul>
	</div>

CSS
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

JavaScript
	$(document).on("ready", function(){
		sizeScroller(1);							//Show one child at a time

		scroller = $("#scroller").SwipeScroll({ 	//Initialize SwipeScroll returns jQuery instance
			fps:60,									//Defaults to 30fps. Some devices (such as iPads) are able to run at 60fps.
			scrollbars:true							//Defaults to false
		});
	});
	
	function sizeScroller(numChildrenVisible){		//Used to size children width
		var scrollerChildren = $(".scroller-child");
		var scrollerWidth = (100 / numChildrenVisible) * scrollerChildren.length;
		var childWidth = 100 / scrollerChildren.length;
		$("#scroller").css("width", scrollerWidth + "%");
		scrollerChildren.css("width", childWidth + "%");
	}