const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
let isOnOff = false;
let oldX = null;
let oldY = null;
let lineColor = "red";
let lineWidth = 3;

function down(event)
{
	isOnOff = true;
	oldX = event.clientX;
	oldY = event.clientY;
}
function up(){isOnOff = false;}
function draw(event)
{
	if (isOnOff === true)
	{
		let newX = event.clientX;
		let newY = event.clientY;
		ctx.beginPath();
		ctx.moveTo(oldX, oldY);
		ctx.lineTo(newX, newY);
		ctx.strokeStyle = lineColor;
		ctx.lineWidth = lineWidth;
		ctx.lineCap = 'round';
		ctx.stroke();
		oldX = newX;oldY = newY;
	}
}
function paintload()
{
	$("#myCanvas").attr("width", $(window).width());
	$("#myCanvas").attr("height",$(window).height());
}
function ok()
{
	$("canvas").css("z-index","99999999");
	paintload();
}
function no()
{
	$("canvas").css("z-index","-99999999");
	paintload();
}