
$(document).ready(function() {

    var $canvas = $('#canvas');
    var canvas = $canvas.get(0);
    
    simulator.init();

    renderer.setCanvas(canvas);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.initRenderFn();

    window.addEventListener('resize', function() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.render();
    }, false);

    UI.init();

});
