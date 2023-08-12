
let UI = (function() {

    var pages, currentPage;
    var $board;

    function definePage(name, dom) {
        pages[name] = {
            $page: $(dom)
        };
    }

    function initPages() {
        pages = {};
        definePage('home', '.ui-container');
        definePage('mode', '.ui-mode');
        definePage('game', '.game-container');
        currentPage = 'home';
    }

    function initListeners() {
        $board = $('#canvas');

        $('#btn-play').click(function() {
            switchTo('mode');
        });

        $('.six-btn-mode[data-mode]').click(function() {
            var mode = $(this).attr('data-mode').split(',');
            switchTo('game', () => {
                game.newGame(mode);
            }, 400, 1000);
        });

        $('#btn-m-back').click(function() {
            switchTo('home');
        });

        if (util.isMobileDevice()) {
            $board.on('touchstart', function(e) {
                if (e.touches.length === 1) {
                    var touch = e.touches[0];
                    game.click(touch.clientX, touch.clientY);
                }
                e.preventDefault();
            });
        } else {
            $board.mousedown(function(e) {
                game.click(e.offsetX, e.offsetY);
            });
        }

        $('#btn-g-play').click(function(e) {
            if (game.state === 'paused') {
                game.resume();
            }
        });

        $('#btn-g-pause').click(function(e) {
            if (game.state === 'playing') {
                game.pause();
            }
        });

        $('#btn-g-retry').click(function(e) {
            game.scheduleNewGame(0);
        });

        $('#btn-g-home').click(function(e) {
            switchTo('home', () => {
                game.stop();
            }, 1000, 400);
        });
    }

    function init() {
        initPages();
        initListeners();
    }

    function switchTo(page, callback = null, timeOut = 400, timeIn = 400) {
        game.clearSchedule();
        pages[currentPage].$page
        .stop(true)
        .addClass('six-page-disabled')
        .fadeOut(timeOut, () => {
            if (callback) callback();
            pages[currentPage].$page.removeClass('six-page-disabled');
            pages[page].$page.fadeIn(timeIn);
            currentPage = page;
        });
    }

    function onStateChange(oldState, newState) {
        var $game = pages.game.$page;
        if (oldState) $game.removeClass(oldState);
        $game.addClass(newState);
    }
    
    return {
        init, switchTo, onStateChange
    };

})();
