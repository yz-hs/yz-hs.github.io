function jsLoader (o,p)
{
	var JSElement=document.createElement("script");
 	JSElement.setAttribute("src",o);
 	JSElement.setAttribute("class",p);
	document.body.appendChild(JSElement);
}

function divLoader (o,p)
{
	var Element=document.createElement("div");
 	Element.setAttribute("id",o);
 	Element.setAttribute("class",p);
	document.body.appendChild(Element);
}

divLoader("clickCanvas","blog-effect");
jsLoader("https://cdn.jsdelivr.net/gh/yz-hs/PicGo/ctitle.js","");
jsLoader("https://cdn.jsdelivr.net/gh/yz-hs/PicGo/clickple.js","");