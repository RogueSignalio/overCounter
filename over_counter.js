class FlipClockScene extends Phaser.Scene {
    preload() {
        // this.load.setBaseURL(window.location.origin);
        if (this.config.backgroundImage) {
            this.load.image('background', this.config.backgroundImage);
        }
        if (this.config.foregroundImage) {
            this.load.image('foreground', this.config.foregroundImage);
        }
    }
    init(config) {
        this.config = config
        console.log(config)
    }

    create(config) {
        // this.config = config
        if (this.config.backgroundImage) {
            this.background = this.add.image(0, 0, 'background',this.config.backgroundImage)
              .setOrigin(0, 0)
              .setDisplaySize(this.sys.canvas.width, this.sys.canvas.height);
        }
        if (this.config.backgroundColor) { this.cameras.main.setBackgroundColor(this.config.backgroundColor); }

        this.totalSeconds = this.config.startSeconds; // || 300; // Default: 5 minutes
        this.onFinishCallback = this.config.onFinish || null;
        const fontSize = this.config.fontSize || 64;
        const fontColor = this.config.fontColor || '#dfdfdf';
        const fontFamily = this.config.fontFamily || 'monospace';
        const digitWidth = fontSize * 0.6;
        const spacing = fontSize * 0.05;
        const totalWidth = (digitWidth + spacing) * 7 - spacing; 
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        const startX = centerX - totalWidth / 2;
        const y = centerY;

        const style = { 
            fontSize: `${fontSize}px`, 
            color: fontColor, 
            fontFamily: fontFamily,
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
        if (this.config.foregroundImage) {
            this.foreground = this.add.image(0, 0, 'foreground',this.config.foregroundImage)
               .setOrigin(0, 0)
               .setDisplaySize(this.sys.canvas.width, this.sys.canvas.height);        
        }
    }

    updateClock(do_jitter=true) {
        let jitter = 0
        if (do_jitter && this.lastTimestamp != undefined) {
          const elapsedMs = performance.now() - this.lastTimestamp;
          const elapsedSec = elapsedMs / 1000; // Convert to seconds
          jitter = Math.floor(Math.max(0, elapsedSec))
          if (jitter > 1) {
            this.totalSeconds = this.totalSeconds - jitter
          }
        } else {
        }

        this.updateTime();

        if ((this.timer != undefined) && (this.totalSeconds <= 0)) {
            this.totalSeconds = 0;
            this.timer.paused = true;
            this.lastTimestamp = undefined;
            if (this.onFinishCallback) this.onFinishCallback();
            return;
        }
        this.totalSeconds--;
        this.lastTimestamp = performance.now();
    }

    updateTime() {
        if (this.totalSeconds < 0) { 
            this.totalSeconds = 0 
        }

        this.displaySeconds = this.totalSeconds

        const h = Math.floor(this.displaySeconds / 3600);
        const m = Math.floor((this.displaySeconds % 3600) / 60);
        let cmp_m = m % 100
        if ((this.last_m == undefined) || (this.last_m != cmp_m)) {
            // console.log('Change Min' + m % 100)
            this.last_m = cmp_m
        }
        const s = this.displaySeconds % 60;

        this.flipDigit(this.digits.hourTens, Math.floor(h / 10));
        this.flipDigit(this.digits.hourUnits, h % 10);
        this.flipDigit(this.digits.minTens, Math.floor(m / 10));
        this.flipDigit(this.digits.minUnits, m % 10);
        this.flipDigit(this.digits.secTens, Math.floor(s / 10));
        this.flipDigit(this.digits.secUnits, s % 10);

    }

    flipDigit(textObj, newValue) {
        if (textObj.value === newValue) return;
        let tween_start = {}
        let tween_end = {}

        this.config.tweenTypes.forEach((e) => { 
            tween_start[e[0]] = e[1]                
            tween_end[e[0]] = e[2]            
        })

        this.tweens.add({
            targets: textObj,
            duration: 150,
            ease: 'Linear',
            onComplete: () => {
                textObj.setText(newValue.toString());
                this.tweens.add({
                    targets: textObj,
                    duration: 150,
                    ease: 'Linear',
                    ...tween_end
                });
            },
            ...tween_start
        });
        textObj.value = newValue;
    }

    clearTimer() {
        if (this.timer) {
            this.timer.destroy();
            this.timer = null
        }
    }

    clearCounter(seconds=0) {
        this.clearTimer()
        this.lastTimestamp = null;
        this.setCountdown(seconds)
    }

    startCountdown(seconds=null) {
        if (seconds != null) {
            this.clearCounter()
            this.setCountdown(seconds)
        } else {
            this.clearTimer()
        }
        this.updateClock(false)
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
        this.updateTime();
    }

    increment(seconds = 1) {
        this.totalSeconds += seconds;
        console.log(this.timer)
        if (!this.timer || this.timer.paused) { 
            this.updateTime(); 
        }
    }

    decrement(seconds = 1) {
        this.totalSeconds = Math.max(0, this.totalSeconds - seconds);
        if (!this.timer || this.timer.paused) { 
            this.updateTime(); 
        }
    }

    pause() { 
        if (this.timer) { 
            this.timer.paused = true; 
        }
        this.lastTimestamp = null; 
    }

    resume() { 
        if (this.timer) { this.timer.paused = false; } 
        else { this.startCountdown(); }
    }
}

class OverCounter {
    constructor (config={},ph_config={}) {
        this.config = {
            debug: false,
            audio_on: false,
            preload: false,
            volume: 0.25,
            zIndex: 500,
            width: 800,
            height: 600,
            fontSize: 64,
            fontFamily: 'monospace',
            fontColor: '#0f0',
            backgroundImage: null,
            foregroundImage: null,
            tweenTypes: [['scaleY',0,1]],
            imagePath: 'assets',
            audioPath: 'assets/audio',
            modulesPath: 'assets',
            minifiedModules: false,
            rs_soundEngine: null,
            ...config
        }
        this.engine = new Phaser.Game({
            type: Phaser.AUTO,
            width: this.config.width || window.innerWidth,
            height: this.config.height || window.innerHeight,
            transparent: true, 
            backgroundColor: 'rgba(255,0,0,0)',
            inputKeyboard: false,
            inputMouse: false,
            inputTouch: false,
            inputGamepad: false,
            disablePreFX: true,
            disablePostFX: true,   
            disableContextMenu: true,
            callbacks: {
                preBoot: (game) => {
                    game.scene.add('FlipClockScene', FlipClockScene, true, { 
                        startSeconds: 0,
                        onFinish: onFinish,
                        ...this.config
                    });
                    game.events.on('blur', function() {
                        //game.counter_01.pause()
                    }),
                    game.events.on('focus', function() {
                        // game.counter_01.resume()
                    });
                },
                postBoot: (game) => {
                    console.log(this)
                    this.counter_01 = game.counter_01 = game.scene.getScene('FlipClockScene')
                }                
            },
            ...ph_config
        });

        this.rs_soundEngine = this.config.rs_soundEngine
        this.engine.canvas.style.zIndex = this.config.z_index * -1
        this.counter = 0; // Used to generate unique scene IDs.  Will reset when scene count == 0
        window.overCounter_scripts_loaded = {}; // Store list of loaded JS scripts
    }

    startCountdown(seconds=null) { this.counter_01.startCountdown(seconds) }

    decrement(seconds) { this.counter_01.decrement(seconds) }
    
    increment(seconds) { this.counter_01.increment(seconds) }
    
    clear() { this.counter_01.clearCounter(); }
    
    pause() { this.counter_01.pause() }
    
    resume() { this.counter_01.resume() }

    setCountdown(seconds) { this.counter_01.setCountdown(seconds); }

}

// Sound Effect by <a href="https://pixabay.com/users/spinopel-46570060/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=253100">Spin Opel</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=253100">Pixabay</a>
