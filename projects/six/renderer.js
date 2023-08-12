
let renderer = (function() {

    const
        b2Math = Box2D.Common.Math.b2Math,
        b2Vec2 = Box2D.Common.Math.b2Vec2;

    var canvas = null;
    var ctx = null;

    const syBricks = util.isMobileDevice() ? 14 : 16;

    var cameraInitialized = false;
    var cameraWidth, cameraHeight;
    var cameraScale, cameraY;
    
    var debugMode = 'off';

    var fps = null, fpsStart = Date.now(), fpsFrames = 0;

    var cachedOptions;
    var brickSize;

    var background = null;

    var titleText = null, titleOpacity = null;

    var scoreAdditions = [];

    var particles = [];

    var renderFn = {};

    function setCanvas(dom) {
        canvas = dom;
        ctx = canvas.getContext('2d');
    }

    function resizeCamera() {
        if (!cameraHeight) return;
        cameraScale = canvas.height / cameraHeight;
        cameraWidth = canvas.width / cameraScale;
        cameraInitialized = true;
    }

    function loadOptions(options) {
        cachedOptions = options;
        brickSize = options.brick.size;
        cameraHeight = syBricks * brickSize;
        resizeCamera();
    }

    function setSize(width, height) {
        canvas.width = width;
        canvas.height = height;
        resizeCamera();
    }

    function setCameraY(y) {
        cameraY = y;
    }

    function getCameraY() {
        return cameraY;
    }

    function getCameraSize() {
        return {
            width: cameraWidth,
            height: cameraHeight,
            scale: cameraScale
        };
    }

    function setDebugMode(flag) {
        if (typeof flag === 'boolean') {
            flag = flag ? 'on' : 'off';
        }
        debugMode = flag;
    }

    function isDebugMode() {
        return debugMode === 'on';
    }

    function setTitle(newTitle, duration = 0) {
        titleText = newTitle;
        if (titleText) {
            titleOpacity = new Transition(0, 1, duration);
        } else {
            titleOpacity = null;
        }
    }

    function scoreAdditionAt(score, pos, color) {
        var time0 = 0.3, time1 = 0.3;
        scoreAdditions.push({
            score, pos, color,
            opacity: new Transition(1, 0, 1000 * time1, 1000 * time0),
            offsetY: new Transition(0, -0.8 * brickSize, 1000 * (time0 + time1)),
            destroyed: false
        });
    }

    function addParticle({ pos, velocity, angle, size, color }) {
        var time = 0.3;
        particles.push({
            angle, color,
            size: new Transition(size, 0, 1000 * time),
            x: new Transition(pos.x, pos.x + time * velocity.x, 1000 * time),
            y: new Transition(pos.y, pos.y + time * velocity.y, 1000 * time),
            destroyed: false
        });
    }

    function setRenderFn(type, fn) {
        renderFn[type] = fn;
    }

    function callRenderFn(type, ...arg) {
        var fn = renderFn[type];
        if (typeof fn !== 'function') return;
        fn.apply(null, arg);
    }

    function orientedRect(xf, x, y, width, height) {
        var left = x - width / 2;
        var top = y - height / 2;
        var right = x + width / 2;
        var bottom = y + height / 2;
        var points = [
            new b2Vec2(left, top),
            new b2Vec2(right, top),
            new b2Vec2(right, bottom),
            new b2Vec2(left, bottom)
        ].map((v) => b2Math.MulX(xf, v));
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < 4; ++i) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.lineTo(points[0].x, points[0].y);
    }

    function initRenderFn() {
        setRenderFn('six', (body) => {
            var xf = body.GetTransform();
            var poly = body.GetFixtureList().GetShape();
            var cnt = poly.GetVertexCount();
            var vec = poly.GetVertices();
            var points = vec.map((v) => b2Math.MulX(xf, v));
            ctx.fillStyle = 'hsl(210, 80%, 70%)';
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < cnt; ++i) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
            ctx.fill();
        });
        const borderDir = {
            top:    [ 0, -1],
            right:  [ 1,  0],
            bottom: [ 0,  1],
            left:   [-1,  0]
        };
        setRenderFn('brick', (body, { color }) => {

            var xf = body.GetTransform();

            ctx.fillStyle = color.background;
            for (let fix = body.GetFixtureList(); fix; fix = fix.GetNext()) {
                var data = fix.GetUserData();
                var centerX = data.x * brickSize;
                var centerY = data.y * brickSize;
                
                ctx.beginPath();
                orientedRect(xf, centerX, centerY, brickSize * 1.02, brickSize * 1.02);
                ctx.closePath();
                ctx.fill();
            }

            ctx.fillStyle = color.border;
            for (let fix = body.GetFixtureList(); fix; fix = fix.GetNext()) {
                var data = fix.GetUserData();
                var centerX = data.x * brickSize;
                var centerY = data.y * brickSize;
                var borderWidth = 0.1 * brickSize;
                var borderOffset = (brickSize - borderWidth) / 2;

                data.border.forEach((d) => {
                    var [dx, dy] = borderDir[d];
                    var x = centerX + dx * borderOffset;
                    var y = centerY + dy * borderOffset;
                    var w = dx ? borderWidth : brickSize * 1.02;
                    var h = dy ? borderWidth : brickSize * 1.02;
                    ctx.beginPath();
                    orientedRect(xf, x, y, w, h);
                    ctx.closePath();
                    ctx.fill();
                });

                data.corner.forEach(([ d1, d2 ]) => {
                    var [dx1, dy1] = borderDir[d1];
                    var [dx2, dy2] = borderDir[d2];
                    var x = centerX + (dx1 + dx2) * borderOffset;
                    var y = centerY + (dy1 + dy2) * borderOffset;
                    var s = borderWidth;
                    ctx.beginPath();
                    orientedRect(xf, x, y, s, s);
                    ctx.closePath();
                    ctx.fill();
                });
            }
            /*
            sub.forEach((node) => {
                var centerX = node.x * brickSize;
                var centerY = node.y * brickSize;
                var vec = [];
                var points = vec.map((v) => b2Math.MulX(xf, v));
                ctx.fillStyle = color.background;
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; ++i) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.closePath();
                ctx.fill();
            });
            */
        });
        setRenderFn('flat', (body) => {
            var { x, y } = body.GetPosition();
            var { width, height } = cachedOptions.flat;
            ctx.fillStyle = '#666';
            ctx.fillRect(x - width / 2, y - height / 2, width, height);
        });
    }

    function colorTiming(color0, color1, lambda) {
        return color0.map((val, index) => val + (color1[index] - val) * lambda);
    }

    function drawTitle() {
        if (!titleText) return;
        titleOpacity.update();
        ctx.globalAlpha = titleOpacity.value;
        ctx.fillStyle = '#000';
        ctx.font = 'bold 0.1rem "Clear Sans"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(titleText, cameraWidth / 2, cameraHeight * 0.3);
        ctx.globalAlpha = 1;
    }

    function updateFPS() {
        var timePassed = Date.now() - fpsStart;
        ++fpsFrames;
        if (timePassed >= 500)  {
            fps = fpsFrames * (1000 / timePassed);
            fpsStart = Date.now();
            fpsFrames = 0;
            return true;
        }
        return false;
    }

    function drawFPS() {
        if (!isDebugMode()) return;
        var fpsText = '--';
        if (typeof fps === 'number') {
            if (fps < 1) {
                fpsText = '<1';
            } else if (fps > 99) {
                fpsText = '99+';
            } else {
                fpsText = Math.round(fps).toString();
            }
        }
        fpsText = 'FPS: ' + fpsText;
        ctx.fillStyle = '#000';
        ctx.font = '0.08rem sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(fpsText, cameraWidth * 0.98, cameraHeight * 0.01);
    }

    function drawScore() {
        var str;
        var textOffsetX = brickSize * cachedOptions.cxBricks / 3;

        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        
        ctx.textBaseline = 'bottom';
        ctx.font = `bold 0.1rem "Clear Sans"`;

        str = game.score.toString();
        ctx.fillText(str, cameraWidth / 2 - textOffsetX, cameraHeight * 0.16);

        str = game.bestScore.toString();
        ctx.fillText(str, cameraWidth / 2 + textOffsetX, cameraHeight * 0.16);

        ctx.textBaseline = 'top';
        ctx.font = '0.06rem "Clear Sans"';

        ctx.fillText('Score', cameraWidth / 2 - textOffsetX, cameraHeight * 0.16);
        ctx.fillText('Best', cameraWidth / 2 + textOffsetX, cameraHeight * 0.16);
    }

    function drawScoreAdditions() {
        ctx.font = 'bold 0.06rem "Clear Sans"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        scoreAdditions.forEach((obj) => {
            if (obj.opacity.update()) {
                obj.destroyed = true;
                return;
            }
            obj.offsetY.update();
            ctx.globalAlpha = obj.opacity.value;
            ctx.fillStyle = obj.color;
            ctx.fillText('+' + obj.score, obj.pos.x, obj.pos.y + obj.offsetY.value);
        });
        scoreAdditions = scoreAdditions.filter((obj) => !obj.destroyed);
        ctx.globalAlpha = 1;
    }

    function drawParticles() {
        particles.forEach((particle) => {
            if (particle.size.update()) {
                particle.destroyed = true;
                return;
            }
            particle.x.update();
            particle.y.update();
            var size = particle.size.value;
            var cx = particle.x.value;
            var cy = particle.y.value;
            ctx.fillStyle = particle.color;
            var points = [];
            for (let i = 0; i < 4; ++i) {
                var angle = particle.angle + i * (Math.PI / 2);
                points.push({
                    x: cx + size * Math.cos(angle),
                    y: cy + size * Math.sin(angle)
                });
            }
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < 4; ++i) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
            ctx.fill();
        });
        particles = particles.filter((particle) => !particle.destroyed);
    }

    function drawPerformanceInfo() {
        if (!isDebugMode()) return;
        var info = simulator.getPerformanceInfo();
        if (!info.time.render || !info.time.total) return;
        ctx.fillStyle = 'rgba(192, 192, 192, 0.8)';
        ctx.fillRect(0, 0, canvas.width * (info.time.render / info.time.total), 10);
    }

    function updateBackground() {
        var current = game.getBackground();
        if (!background) {
            background = Transition.staticValue(current);
        } else {
            if (current.join(',') !== background.to.join(',')) {
                var prev = background.value;
                background = new Transition(prev, current, 600, 0, colorTiming);
            }
        }
        background.update();
    }

    function drawBackground() {
        var [R, G, B] = background.value;
        R = Math.round(R);
        G = Math.round(G);
        B = Math.round(B);
        var gradient = ctx.createLinearGradient(0, 0, 0, cameraHeight);
        gradient.addColorStop(0.0, `rgba(${R}, ${G}, ${B}, 0.5)`);
        gradient.addColorStop(0.4, `rgba(${R}, ${G}, ${B}, 0.5)`);
        gradient.addColorStop(1.0, `rgba(${R}, ${G}, ${B}, 0.2)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, cameraWidth, cameraHeight);
    }

    function drawShadow() {
        var [R, G, B] = background.value;
        R = Math.round(255 - (255 - R) / 3);
        G = Math.round(255 - (255 - G) / 3);
        B = Math.round(255 - (255 - B) / 3);
        var gradient = ctx.createLinearGradient(0, 0, 0, cameraHeight);
        gradient.addColorStop(0.0, `rgba(${R}, ${G}, ${B}, 0.8)`);
        gradient.addColorStop(0.3, `rgba(${R}, ${G}, ${B}, 0.5)`);
        gradient.addColorStop(0.4, `rgba(${R}, ${G}, ${B}, 0.0)`);
        gradient.addColorStop(1.0, `rgba(${R}, ${G}, ${B}, 0.0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, cameraWidth, cameraHeight);
    }

    function renderBodies() {
        var world = simulator.world;
        for (var body = world.GetBodyList(); body; body = body.GetNext()) {
            if (body === world.GetGroundBody()) continue;
            var data = body.GetUserData();
            if (!data || !data.type) continue;
            callRenderFn(data.type, body, data);
        }
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!cameraInitialized) return;
        ctx.save();
        ctx.scale(cameraScale, cameraScale);
        updateBackground();
        drawBackground();
        ctx.save();
        ctx.translate(cameraWidth / 2, cameraHeight / 2 - cameraY);
        renderBodies();
        drawParticles();
        drawScoreAdditions();
        ctx.restore();
        drawShadow();
        drawTitle();
        updateFPS();
        drawFPS();
        drawScore();
        ctx.restore();
        drawPerformanceInfo();
    }

    function toWorldPos(x, y) {
        return {
            x: x / cameraScale - cameraWidth / 2,
            y: y / cameraScale - cameraHeight / 2 + cameraY
        };
    }
    
    return {
        setCanvas, loadOptions, setSize, getCameraSize,
        initRenderFn,
        setDebugMode, isDebugMode,
        setCameraY, getCameraY, setTitle, scoreAdditionAt, addParticle,
        render,
        toWorldPos
    };

})();
