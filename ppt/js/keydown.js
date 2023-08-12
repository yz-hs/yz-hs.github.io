function keydown(event)
{
	if(event.keyCode>=48&&event.keyCode<=57)
	{
		lineWidth=event.keyCode-48;
		return;
	}
	
   	switch(event.keyCode){
        case 37: left();break;
        case 38: document.body.contentEditable='false';document.designMode='off';break;
        case 39: right();break;
    	case 89: ok();break;
        case 78: no();break;
	    case 82: lineColor="red";break;
	    case 66: lineColor="blue";break;
	    case 80: lineColor="pink";break;
	    case 71: lineColor="green";break;
	    case 72: lineColor="black";break;
	    case 79: lineColor="orange";break;
	    case 88: paintload();break;	    	
		case 69: document.body.contentEditable='true';document.designMode='on';break;
    }
}