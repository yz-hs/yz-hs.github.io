
let game = (function() {

    const
        b2Math = Box2D.Common.Math.b2Math,
        b2Vec2 = Box2D.Common.Math.b2Vec2;

    const defaultOptions = {
        six: {
            sides: 6,
            radius: 2.4
        },
        brick: {
            size: 2
        },
        flat: {
            width: 12.5,
            height: 1
        },
        cxBricks: 5
    };

    const defaultAttr = {
        endless: false,
        cntBrickPiles: null,
        autoScrolling: false,
        rollingSpeed: null,
        rollingAccelerate: null,
        maxRollingSpeed: null
    };

    const gameModes = {
        'level': {
            attr: {
                endless: false,
                cntBrickPiles: 6
            }
        },
        'endless': {
            attr: {
                endless: true
            }
        },
        'rolling': {
            attr: {
                autoScrolling: true,
                rollingSpeed: 1.2,
                rollingAccelerate: 0.025,
                maxRollingSpeed: 3.6
            }
        }
    };

    const storageKey = {
        bestScores: 'six_bestScores'
    };

    var bestScores = loadBestScores();

    var state = 'none';
    var endingType;
    var score, bestScore;
    var mode, modeParams, attr, options;

    var scheduledTimer = null;

    var lastClickTime, comboScore;

    function loadBestScores() {
        try {
            var result = JSON.parse(localStorage.getItem(storageKey.bestScores));
            if (!result || typeof result !== 'object') throw 0;
            return result;
        } catch (err) {
            return {};
        }
    }

    function saveBestScores() {
        localStorage.setItem(storageKey.bestScores, JSON.stringify(bestScores));
    }

    function getModeId(mode) {
        if (!Array.isArray(mode)) mode = [mode];
        return mode.slice(0).sort().join(',');
    }

    function getBestScore(mode) {
        var id = getModeId(mode);
        if (typeof bestScores[id] === 'number') return bestScores[id];
        return 0;
    }

    function setBestScore(mode, newBest) {
        var id = getModeId(mode);
        bestScores[id] = newBest;
        saveBestScores();
    }

    function clearSchedule() {
        if (scheduledTimer) {
            clearTimeout(scheduledTimer);
            scheduledTimer = null;
        }
    }

    function scheduleNewGame(delay) {
        clearSchedule();
        var oldMode = mode;
        scheduledTimer = setTimeout(() => {
            UI.switchTo('game', () => {
                stop();
                newGame(oldMode);
            }, 1000, 1000);
        }, delay);
    }

    function setState(newState) {
        UI.onStateChange(state, newState);
        state = newState;
    }

    function makeBricks(cx, cy) {

        var fa = util.makeArray([cx, cy], null);
        var size = util.makeArray([cx, cy], 1);
        function find(x, y) {
            if (fa[x][y]) {
                var { x: x2, y: y2 } = fa[x][y];
                return fa[x][y] = find(x2, y2);
            } else {
                return { x, y };
            }
        }
        function connect(x1, y1, x2, y2) {
            var anc1 = find(x1, y1);
            var anc2 = find(x2, y2);
            if (anc1.x === anc2.x && anc1.y === anc2.y) return false;
            var size2 = size[anc1.x][anc1.y] + size[anc2.x][anc2.y];
            if (size2 > 5) return false;
            fa[anc1.x][anc1.y] = anc2;
            size[anc2.x][anc2.y] = size2;
            return true;
        }

        var count = cx * cy;
        var dest = util.randInt(count * 0.25, count * 0.45);
        for (let tryCount = 0; count > dest && tryCount < 5000; ++tryCount) {
            if (Math.random() < 0.5) { // vertical
                var x = util.randInt(cx - 1);
                var y = util.randInt(cy);
                if (connect(x, y, x + 1, y)) {
                    --count;
                }
            } else { // horizonal
                var x = util.randInt(cx);
                var y = util.randInt(cy - 1);
                if (connect(x, y, x, y + 1)) {
                    --count;
                }
            }
        }

        const dir = [
            ['top',     0, -1],
            ['right',   1,  0],
            ['bottom',  0,  1],
            ['left',   -1,  0]
        ];
        var bricks = [];
        var vis = util.makeArray([cx, cy], false);
        var hue0 = util.randInt(12) * 30;
        for (let i = 0; i < cx; ++i) {
            for (let j = 0; j < cy; ++j) {
                if (fa[i][j]) continue;
                var queue = [];
                var head = 0, tail = 0;
                queue[tail++] = { x: i, y: j };
                vis[i][j] = true;
                while (head < tail) {
                    var node = queue[head++];
                    var { x: x0, y: y0 } = node;
                    node.border = [];
                    dir.forEach(([ d, dx, dy ]) => {
                        var x1 = x0 + dx;
                        var y1 = y0 + dy;
                        var flag;
                        if (x1 < 0 || y1 < 0 || x1 >= cx || y1 >= cy) {
                            flag = true;
                        } else {
                            var anc1 = find(x1, y1);
                            flag = anc1.x !== i || anc1.y !== j;
                        }
                        if (flag) {
                            node.border.push(d);
                        } else if (!vis[x1][y1]) {
                            queue[tail++] = { x: x1, y: y1 };
                            vis[x1][y1] = true;
                        }
                    });
                    node.corner = [];
                    dir.forEach(([ d1, dx1, dy1 ], index) => {
                        var [d2, dx2, dy2] = dir[(index + 1) % 4];
                        if (node.border.includes(d1) || node.border.includes(d2)) return;
                        var x1 = x0 + dx1 + dx2;
                        var y1 = y0 + dy1 + dy2;
                        var anc1 = find(x1, y1);
                        if (anc1.x !== i || anc1.y !== j) {
                            node.corner.push([d1, d2]);
                        }
                    });
                }
                var h = hue0 + util.randInt(60) - 30;
                var s = util.randInt(85, 95);
                var l = util.randInt(55, 60);
                queue.forEach((node) => {
                    node.x -= i;
                    node.y -= j;
                });
                bricks.push({
                    x: i, y: j,
                    sub: queue,
                    data: {
                        color: {
                            background: `hsl(${h}, ${s}%, ${l}%)`,
                            border: `hsl(${h}, ${s - 15}%, ${l - 10}%)`,
                            score: `hsl(${h}, ${s - 5}%, ${l - 30}%)`
                        }
                    }
                });
            }
        }
        return bricks;
    }

    function addNewBricks(cy) {
        var bricks = makeBricks(options.cxBricks, cy);
        simulator.addBricks(bricks, cy);
    }

    function newGame(gameMode) {

        if (!Array.isArray(gameMode)) {
            gameMode = [gameMode];
        }

        clearSchedule();

        setState('playing');
        endingType = null;
        mode = gameMode.slice(0);
        modeParams = mode.map((m) => gameModes[m] || {});
        attr = Object.assign({}, defaultAttr,
            ...modeParams.map((param) => param.attr || {}));
        options = Object.assign({}, defaultOptions,
            ...modeParams.map((param) => param.options || {}));
        
        score = 0;
        bestScore = getBestScore(mode);
        lastClickTime = 0;

        renderer.loadOptions(options);
        renderer.setTitle(null);

        simulator.initWorld(options);

        if (attr.endless) {
            addNewBricks(12);
        } else {
            for (let i = 0; i < attr.cntBrickPiles; ++i) {
                addNewBricks(12);
            }
        }

        simulator.start();
    }

    function getMaxOffsetX() {
        return options.cxBricks * options.brick.size / 2 + options.six.radius;
    }

    function getBackground() {
        const colors = {
            white: [255, 255, 255],
            green: [158, 250, 158],
            blue: [158, 204, 250],
            red: [247, 110, 110],
            yellow: [250, 250, 56]
        };

        if (state === 'none') return colors.white;
        if (state === 'ended') {
            if (endingType === 'win') {
                return colors.green;
            } else {
                return colors.red;
            }
        }

        var danger = 0, safety = 0;

        var sixPos = simulator.sixPos;

        if (attr.autoScrolling) {
            var cameraY = renderer.getCameraY();
            var cameraHeight = renderer.getCameraSize().height;
            var top = cameraY - cameraHeight / 2;
            var k = (sixPos.y - top) / cameraHeight;
            if (k < 2/9) {
                danger += 2;
            } else if (k < 3/8) {
                danger += 1;
            } else if (k > 2/3) {
                safety += 1;
            }
        }

        var halfWidth = options.cxBricks * options.brick.size / 2;
        var diffX = (halfWidth - Math.abs(sixPos.x)) / options.brick.size;
        if (diffX < 0) {
            danger += 2;
        } else if (diffX < 0.6) {
            danger += 1;
        }

        if (danger > 1) return colors.red;
        if (danger > 0) return colors.yellow;
        if (safety > 0) return colors.green;
        return colors.blue;
    }

    function requireBricks(cyMin) {
        var pileHeight = 12;
        var cntPiles = Math.ceil(cyMin / pileHeight);
        while (cntPiles--) {
            addNewBricks(pileHeight);
        }
    }

    function scoreAdditionAt(scoreAdd, pos, color) {
        score += scoreAdd;
        if (score > bestScore) {
            bestScore = score;
            setBestScore(mode, score);
        }
        renderer.scoreAdditionAt(scoreAdd, pos, color);
    }

    function click(x, y) {
        var pos = renderer.toWorldPos(x, y);
        simulator.removeBrickAt(pos, (brick) => {
            var bodyData = brick.GetUserData();

            var timePassed = Date.now() - lastClickTime;

            if (state === 'playing') {
                var scoreAdd;
                if (timePassed <= 750) {
                    if (timePassed <= 400) {
                        comboScore += 1;
                        scoreAdd = comboScore + 1;
                    } else {
                        scoreAdd = comboScore;
                    }
                } else {
                    comboScore = 5;
                    scoreAdd = comboScore;
                }
                if (scoreAdd > 20) scoreAdd = 20;
                scoreAdditionAt(scoreAdd, pos, bodyData.color.score);
            }

            var xf = brick.GetTransform();
            var vBrick = brick.GetLinearVelocity();
            var bgColor = bodyData.color.background;
            var bSize = options.brick.size;
            var hSize = bSize / 2;
            var center = brick.GetWorldCenter();
            for (let fix = brick.GetFixtureList(); fix; fix = fix.GetNext()) {
                var fixData = fix.GetUserData();
                var centerX = fixData.x * bSize;
                var centerY = fixData.y * bSize;
                var cnt = util.randInt(10, 20);
                while (cnt--) {
                    var localX = centerX + Math.random() * bSize - hSize;
                    var localY = centerY + Math.random() * bSize - hSize;
                    var { x, y } = b2Math.MulX(xf, new b2Vec2(localX, localY));
                    var v = util.randInt(5, 10) / 10;
                    renderer.addParticle({
                        pos: { x, y },
                        velocity: {
                            x: vBrick.x + v * (x - center.x + bSize * util.randInt(-5, 5) / 10),
                            y: vBrick.y + v * (y - center.y + bSize * util.randInt(-5, 5) / 10)
                        },
                        angle: Math.random() * (2 * Math.PI),
                        size: util.randInt(25, 45) / 100 * hSize,
                        color: bgColor
                    });
                }
            }

            lastClickTime = Date.now();
        });
    }

    function stop() {
        if (state === 'none') return;
        setState('none');
        endingType = null;
        simulator.stop();
    }

    function pause() {
        if (state !== 'playing') return;
        setState('paused');
        simulator.stop();
    }

    function resume() {
        if (state !== 'paused') return;
        setState('playing');
        simulator.start();
    }

    function gameWin() {      
        if (state !== 'playing') return;
        setState('ended');
        endingType = 'win';

        renderer.setTitle('Good Job!', 500);

        scheduleNewGame(3000);
    }

    function gameOver(type) {
        if (state !== 'playing') return;
        setState('ended');
        endingType = 'lose';

        renderer.setTitle('Game Over', 500);

        scheduleNewGame(4000);
    }
    
    return {
        newGame, gameWin, gameOver, stop, pause, resume,
        scheduleNewGame, clearSchedule,
        requireBricks, click,
        scoreAdditionAt,
        getBackground, getMaxOffsetX,
        get state() { return state; },
        get endingType() { return endingType; },
        get mode() { return mode; },
        get attr() { return attr; },
        get options() { return options; },
        get score() { return score; },
        get bestScore() { return bestScore; }
    };

})();
