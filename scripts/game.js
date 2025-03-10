const PLAYER = document.querySelector(".player");
const ORIGINAL_OBSTACLE = document.querySelector(".obstacle");
const SCORE_DISPLAY = document.querySelector('.score');
const TOP_SCORE_DISPLAY = document.querySelector('.top-score');
const GAME_INSTRUCTION_ELEMENT = document.querySelector('.instruction-text');

const BODY_COMPUTED_STYLE = window.getComputedStyle(document.body);
const VISUAL_TYPES = ['icecream', 'trashcan', 'fence', 'car', 'tree'];

const sounds = {
    background: document.querySelector('.backgroundMusic'),
    jump: document.querySelector('.jumpSound'),
    collision: document.querySelector('.collisionSound')
};

const INTRO_HYPE_MESSAGES = ['READY', 'SET', 'GO!', 'Press SPACE to JUMP'];
const TIME_BETWEEN_MESSAGES = 1000;

const MAX_FREQUENCY = 1100;
const MIN_FREQUENCY = 3000;
const FREQUENCY_CHANGE_STEP = 500;
const FREQUENCY_CHANGE_RATE = 10 * 1000;

document.body.onkeyup = function (e) {
    if (e.code == "Enter" || e.keyCode == 13) {
        reset();
    }

    if (e.key == " " || e.code == "Space" || e.keyCode == 32) {
        if (!__has_game_started)
            playIntro(startGame);
        else
            jump();
    }
}

const playIntro = function (onIntroComplete) {
    if (__introMessageCompleted != 0)
        return;

    for (let i = 0; i < INTRO_HYPE_MESSAGES.length; i++) {
        __timeouts.push(setTimeout(() => {
            GAME_INSTRUCTION_ELEMENT.classList.add("intro");

            showInstruction(INTRO_HYPE_MESSAGES[__introMessageCompleted]);

            if (__introMessageCompleted == INTRO_HYPE_MESSAGES.length - 1)
                onIntroComplete();

            __introMessageCompleted++;
        }, TIME_BETWEEN_MESSAGES * i));

        __timeouts.push(setTimeout(() => {
            GAME_INSTRUCTION_ELEMENT.classList.remove("intro");
        }, i == 0 ? 300 : 1300 * i));
    }
}

const startGame = function () {
    if (__has_game_started)
        return;
    sounds.background.play()
    if (__has_game_started) return;

    GAME_INSTRUCTION_ELEMENT.classList.remove("intro");

    frequency_check_interval = setInterval(() => {
        if (__obstacle_spawn_frequency > MAX_FREQUENCY)
            __obstacle_spawn_frequency -= FREQUENCY_CHANGE_STEP;
        else
            clearInterval(frequency_check_interval);
    }, FREQUENCY_CHANGE_RATE);

    spawnPlayer();
    spawnObstacles();
    __has_game_started = true;
}

const gameOver = function () {
    if (__is_game_over) return;
    sounds.collision.play();
    sounds.background.pause();
    sounds.background.currentTime = 0

    __timeouts.forEach((element) => clearTimeout(element));
    __obstacles.forEach((element) => { element.classList.add('pause'); });
    PLAYER.classList.add('pause', 'dead');

    showInstruction('GAME OVER');
    __timeouts.push(setTimeout(() => showInstruction('Press ENTER to RESET'), 2000));

    if (__score > __top_score)
        __top_score = __score;

    updateScoreDisplay();

    __is_game_over = true;
}

const jump = function () {
    if (__is_player_jumping || !__has_game_started)
        return;

    if (!__is_game_over)
        sounds.jump.play();

    removeClass('animate_player', PLAYER);
    addClass('jump', PLAYER);

    let timeToSafety = (__obstacle_heights[0] / __player_jump_height) * (__player_jump_duration / 2);
    __timeouts.push(setTimeout(() => {
        setPlayerInHeightDanger(false);
    }, timeToSafety * 1000));

    let timeBackDown = __player_jump_duration - timeToSafety;
    __timeouts.push(setTimeout(() => {
        setPlayerInHeightDanger(true);
    }, timeBackDown * 1000));

    __is_player_jumping = true;
}

const land = function () {
    __is_player_jumping = false;
    removeClass('jump', PLAYER);
    addClass('animate_player', PLAYER);
}

const reset = function () {
    if (!__is_game_over) return;

    __obstacles.forEach((element) => {
        clearObstacleVisuals(element);
        element.classList.remove('move', 'pause');
    });

    __timeouts.forEach((element) => clearTimeout(element));
    __timeouts = [];

    GAME_INSTRUCTION_ELEMENT.classList.remove("intro");
    PLAYER.classList.remove('jump', 'pause', 'animate_player', 'dead');

    __introMessageCompleted = 0;
    __is_player_in_hight_danger = true;
    __is_player_in_side_danger = false;
    __has_game_started = false;
    __is_player_jumping = false;
    __obstacle_heights = [];
    __obstacle_spawn_frequency = MIN_FREQUENCY;

    clearInterval(frequency_check_interval);

    __score = 0;
    updateScoreDisplay();
    showInstruction('Press SPACE to START');

    __is_game_over = false;
}

const showInstruction = (message) => {
    GAME_INSTRUCTION_ELEMENT.textContent = message;
};

const subscribeToEvents = function (element) {
    element.addEventListener("animationend", function (e) {
        if (e.animationName == 'obstacle_move') {
            setPlayerInSideDanger(false);
            clearObstacleVisuals(e.target);
            __obstacle_heights.splice(0, 1);

            removeClass('move', e.target);
            incrementScore();
        }

        if (e.animationName == 'player_jump') {
            land();
        }
    });
}

const setPlayerInHeightDanger = function (isInDanger) {
    __is_player_in_hight_danger = isInDanger;
    if (__is_player_in_side_danger && __is_player_in_hight_danger) gameOver();
}

const setPlayerInSideDanger = function (isInDanger) {
    __is_player_in_side_danger = isInDanger;
    if (__is_player_in_side_danger && __is_player_in_hight_danger) gameOver();
}

const initObstacle = function (obstacle) {
    VISUAL_TYPES.forEach(visual => obstacle.classList.remove(visual));

    let obstacleType = VISUAL_TYPES[Math.floor(Math.random() * VISUAL_TYPES.length)];
    obstacle.classList.add(obstacleType);

    let obstacleIndex;
    obstacle.classList.forEach((element) => {
        __obstacles.forEach((obstacle, index) => {
            if (element == `index_${index}`)
                obstacleIndex = index;
        });
    });

    switch (obstacleType) {
        case VISUAL_TYPES[0]:
        case VISUAL_TYPES[1]:
            __obstacle_widths[obstacleIndex] = __obstacle_fizical_width;
            __obstacle_visual_widths[obstacleIndex] = __obstacle_normal_width;
            __obstacle_heights.push(__obstacle_normal_height);
            break;
        case VISUAL_TYPES[2]:
        case VISUAL_TYPES[3]:
            __obstacle_widths[obstacleIndex] = __obstacle_fizical_width;
            __obstacle_visual_widths[obstacleIndex] = __obstacle_wide_width;
            __obstacle_heights.push(__obstacle_normal_height);
            break;
        case VISUAL_TYPES[4]:
            __obstacle_widths[obstacleIndex] = __obstacle_fizical_width;
            __obstacle_visual_widths[obstacleIndex] = __obstacle_normal_width;
            __obstacle_heights.push(__obstacle_tall_height);
            break;
    }

    let widths_sum = 0;
    for (let i = 0; i <= obstacleIndex; i++) {
        if (Number(__obstacle_widths[i]))
            widths_sum += __obstacle_widths[i]
    }

    let startPosition = (widths_sum - (__obstacle_widths[obstacleIndex] - __obstacle_visual_widths[obstacleIndex])) * -1;
    let endPosition = (__canvas_width - startPosition - __obstacle_visual_widths[obstacleIndex]) * -1;

    obstacle.style.setProperty('--obstacle-start-position', `${startPosition}px`);
    obstacle.style.setProperty('--obstacle-move-distance', `${endPosition}px`);
    addClass('move', obstacle);

    let timeToImpact = ((__canvas_width - __player_width) / __canvas_width) * __obstacle_move_duration;
    __timeouts.push(setTimeout(() => {
        setPlayerInSideDanger(true);
    }, timeToImpact * 1000));
}

const getObstacle = function () {
    for (let i = 0; i < __obstacles.length; i++) {
        let existingObstacle = __obstacles[i];
        if (!existingObstacle.classList.contains('move'))
            return existingObstacle;
    }

    let newObstacle;
    if (__obstacles.length != 0) {
        newObstacle = ORIGINAL_OBSTACLE.cloneNode();
        __obstacles.forEach((obstacle, index) => {
            newObstacle.classList.remove(`index_${index}`)
        });
        ORIGINAL_OBSTACLE.parentNode.appendChild(newObstacle);
    } else {
        newObstacle = ORIGINAL_OBSTACLE;
    }

    addClass(`index_${__obstacles.length}`, newObstacle);

    subscribeToEvents(newObstacle);
    __obstacles.push(newObstacle);

    return newObstacle;
}

const spawnObstacles = function () {
    let newObstacle = getObstacle();
    initObstacle(newObstacle);

    __timeouts.push(setTimeout(spawnObstacles, __obstacle_spawn_frequency));
}

const spawnPlayer = function () {
    subscribeToEvents(PLAYER);
    addClass('animate_player', PLAYER);
}

const clearObstacleVisuals = function (element) {
    for (let i = 0; i < VISUAL_TYPES.length; i++)
        removeClass(VISUAL_TYPES[i], element);
}

const incrementScore = function () {
    __score++;
    updateScoreDisplay();
}

const updateScoreDisplay = function () {
    SCORE_DISPLAY.innerText = `Score: ${__score}`;
    TOP_SCORE_DISPLAY.innerText = `TOP Score: ${__top_score}`;
}

const addClass = function (item, element) {
    if (!element.classList.contains(item)) element.classList.add(item);
}

const removeClass = function (item, element) {
    if (element.classList.contains(item)) element.classList.remove(item);
}

let __obstacle_spawn_frequency = MIN_FREQUENCY;
let frequency_check_interval;
let __top_score = 0;
let __score = 0;
let __has_game_started = false;
let __is_game_over = false;
let __is_player_in_hight_danger = true;
let __is_player_in_side_danger = false;
let __is_player_jumping = false;
let __introMessageCompleted = 0;
let __obstacle_widths = [];
let __obstacle_visual_widths = [];
let __obstacle_heights = [];
let __obstacles = [];
let __timeouts = [];
let __canvas_width = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--canvas-width'));
let __player_width = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--player-width'));
let __player_jump_duration = parseFloat(BODY_COMPUTED_STYLE.getPropertyValue('--jump-duration'));
let __player_jump_height = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--jump-height'));
let __obstacle_move_duration = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-move-duration'));
let __obstacle_normal_height = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-height'));
let __obstacle_tall_height = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-tall-height'));
let __obstacle_normal_width = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-width'));
let __obstacle_wide_width = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-wide-width'));
let __obstacle_fizical_width = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-fizical-width'));

window.addEventListener("resize", (event) => {
    __canvas_width = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--canvas-width'));
    __player_width = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--player-width'));
    __player_jump_duration = parseFloat(BODY_COMPUTED_STYLE.getPropertyValue('--jump-duration'));
    __player_jump_height = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--jump-height'));
    __obstacle_move_duration = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-move-duration'));
    __obstacle_normal_height = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-height'));
    __obstacle_tall_height = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-tall-height'));
    __obstacle_normal_width = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-width'));
    __obstacle_wide_width = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-wide-width'));
    __obstacle_fizical_width = parseInt(BODY_COMPUTED_STYLE.getPropertyValue('--obstacle-fizical-width'));
});

showInstruction('Press SPACE to START');