function letvisible()
{
	this.style.opacity="1";
}

function letinvisible()
{
	this.style.opacity="0";
	this.returnValue = false;
}

function clicker()
{
	let click=document.querySelectorAll("click");
	for (var i = 0; i < click.length; i++)
	{
    	click[i].onclick=letvisible;
		click[i].oncontextmenu=letinvisible;
		click[i].style.opacity="0";
	}
}