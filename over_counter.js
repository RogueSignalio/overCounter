class FlipClockScene extends Phaser.Scene {
    preload() {
//        this.load.setBaseURL(window.location.origin);
        this.load.image('background', 'assets/clock_frame6.png');
    }

    create(config) {
        this.background = this.add.image(0, 0, 'background')
          .setOrigin(0, 0)
          .setDisplaySize(this.sys.canvas.width, this.sys.canvas.height);        
        console.log(config)
        this.totalSeconds = config.startSeconds; // || 300; // Default: 5 minutes
        this.onFinishCallback = config.onFinish || null;
        const fontSize = this.game.config.clockFontSize || 64;
        const digitWidth = fontSize * 0.6;
        const spacing = fontSize * 0.05;
        const totalWidth = (digitWidth + spacing) * 7 - spacing; 
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        const startX = centerX - totalWidth / 2;
        const y = centerY;

        const style = { 
            fontSize: `${fontSize}px`, 
            color: '#664400', 
            fontFamily: 'copperplate' 
        };
        this.digits = {};
        let x = startX;

        const addDigit = (key) => {
            this.digits[key] = this.add.text(x, y, '0', style).setOrigin(0.5);
            x += digitWidth + spacing;
        };
        const addText = (t) => {
            this.add.text(x, y, t, style).setOrigin(0.5);
            x += digitWidth + spacing;
        };

        addDigit('hourTens');
        addDigit('hourUnits');
        addText(':');
        addDigit('minTens');
        addDigit('minUnits');
        addText(':');
        addDigit('secTens');
        addDigit('secUnits');
        this.last_h = 0
        this.last_s = 0
        this.last_m = 0
    }

    updateClock() {
        let jitter = 0
        // console.log(this.totalSeconds)
        if (this.lastTimestamp != undefined) {
          const elapsedMs = performance.now() - this.lastTimestamp;
          const elapsedSec = elapsedMs / 1000; // Convert to seconds
          jitter = Math.floor(Math.max(0, elapsedSec))
          if (jitter > 1) {
            // console.log('Pretime ' + this.totalSeconds)
            this.totalSeconds = this.totalSeconds - jitter
            // console.log('Jitter ' + jitter)
            // console.log('Posttime ' + this.totalSeconds)
          }
        } else {
        }

        if (this.totalSeconds < 0) { 
            this.totalSeconds = 0 
        }

        const h = Math.floor(this.totalSeconds / 3600);
        const m = Math.floor((this.totalSeconds % 3600) / 60);
        let cmp_m = m % 100
        if ((this.last_m == undefined) || (this.last_m != cmp_m)) {
            // console.log('Change Min' + m % 100)
            this.last_m = cmp_m
        }
        const s = this.totalSeconds % 60;

        this.flipDigit(this.digits.hourTens, Math.floor(h / 10));
        this.flipDigit(this.digits.hourUnits, h % 10);
        this.flipDigit(this.digits.minTens, Math.floor(m / 10));
        this.flipDigit(this.digits.minUnits, m % 10);
        this.flipDigit(this.digits.secTens, Math.floor(s / 10));
        this.flipDigit(this.digits.secUnits, s % 10);

        if ((this.timer != undefined) && (this.totalSeconds <= 0)) {
            this.totalSeconds = 0;
            this.timer.paused = true;
            this.lastTimestamp = undefined;
            if (this.onFinishCallback) this.onFinishCallback();
            return;
        }
        this.lastTimestamp = performance.now();
        this.totalSeconds--;
    }

    flipDigit(textObj, newValue) {
        if (textObj.value === newValue) return;
        this.tweens.add({
            targets: textObj,
            scaleY: 0,
            duration: 150,
            ease: 'Linear',
            onComplete: () => {
                textObj.setText(newValue.toString());
                this.tweens.add({
                    targets: textObj,
                    scaleY: 1,
                    duration: 150,
                    ease: 'Linear'
                });
            }
        });
        textObj.value = newValue;
    }

    clearCounter(seconds=0) {
        if (this.timer) {
            this.timer.destroy();
        }
        this.setCountdown(seconds)
    }

    startCountdown(seconds) {
        this.clearCounter(seconds)
        this.setCountdown(seconds)
        this.timer = this.time.addEvent({
            delay: 1000,
            callback: this.updateClock,
            callbackScope: this,
            loop: true
        });        
    }

    // External methods
    setCountdown(seconds) {
        this.totalSeconds = seconds;
        this.updateClock();
    }

    increment(seconds = 1) {
        this.totalSeconds += seconds;
        this.updateClock();
    }

    decrement(seconds = 1) {
        this.totalSeconds = Math.max(0, this.totalSeconds - seconds);
        this.updateClock();
    }

    pause() { if (this.timer) { this.timer.paused = true; } }
    resume() { if (this.timer) { this.timer.paused = false; } }
}

let cw = null
const onFinish = () => console.log('Countdown finished!');

document.addEventListener("DOMContentLoaded", () => {
    const config = {
        type: Phaser.AUTO,
        width: 150,
        height: 45,

        // transparent: true,
        backgroundColor: '#dfcfaf',
        // scene: FlipClockScene,
        parent: 'flip-clocky',
        inputKeyboard: false,
        inputMouse: false,
        inputTouch: false,
        inputGamepad: false,
        disablePreFX: true,
        disablePostFX: true,        
        disableContextMenu: true,
        canvasStyle: 'border-radius:10px;',
        callbacks: {
            preBoot: (game) => {
                // Add the scene after init, with autoStart set to true
                game.config.clockFontSize = 22
                game.scene.add('FlipClockScene', FlipClockScene, true, { startSeconds: 0, onFinish });
                game.cw_startCountdown = function(seconds) { this.counter_01.startCountdown(seconds) }
                game.cw_decrement = function(seconds) { this.counter_01.decrement(seconds) }
                game.cw_increment = function(seconds) { this.counter_01.increment(seconds) }
                game.events.on('blur', function() {
                    // console.log('Game window lost focus');
                    //game.counter_01.pause()
                }),
                game.events.on('focus', function() {
                    // console.log('Game window is now focused');
                    game.counter_01.resume()
                });
            },
            postBoot: (game) => {
               // console.log(game.scene.scenes)
                game.counter_01 = game.scene.getScene('FlipClockScene')
            }
        }
    };

    cw = new Phaser.Game(config);   
});