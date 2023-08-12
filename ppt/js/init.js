let nowpage = 0;

function init()
{
	let vh = window.innerHeight;
	vh=vh+"px";
	let block = document.querySelectorAll(".block");
	for (var i = 0; i < block.length; i++) {
    	block[i].style.height=vh;
	}
	let bg = document.querySelectorAll("bg");
	for (var i = 0; i < bg.length; i++) {
    	bg[i].style.height=vh;
	}
	let bg2 = document.querySelectorAll(".bg");
	for (var i = 0; i < bg2.length; i++) {
    	bg2[i].style.height=vh;
	}
}

$(function()
{
	document.body.contentEditable='false';

	$("canvas").css("z-index","-99999999");

	let lfooter=document.querySelectorAll(".lfooter");
	for (var i = 0; i < lfooter.length; i++) {
    	lfooter[i].innerHTML=$("topic").text();
	}

	init(); paintload(); clicker();

	document.addEventListener("keydown",keydown);
	canvas.addEventListener('mousemove', draw, false);
	canvas.addEventListener('mousedown', down, true);
	canvas.addEventListener('mouseup', up, false);
	document.oncontextmenu = function(){event.returnValue=false;};
});

function right()
{
	document.documentElement.scrollTop+=document.documentElement.clientHeight;
	nowpage++;
}
function left()
{
	document.documentElement.scrollTop-=document.documentElement.clientHeight;
	nowpage--;
}

function stable()
{
	let x=document.documentElement.scrollTop,y=document.documentElement.clientHeight;
	nowpage=Math.floor(x/y);
	if((x%y)/y>=0.995) nowpage++;
	document.documentElement.scrollTop=y*nowpage;
	init();
}

$(window).scroll(function(){stable();});
$(window).resize(function(){stable();});