new Vue({
    el: '#charmaine',
    data() {
        return {
            triangle: true,
            playCommands: {
                'stop': this.stop,
                'Maine': this.resume,
                'Charmaine': this.resume,
                'clear': this.clear
            },
            mainCommands: {
                'Weather in *place': this.weatherIn,
                'Weather outside': this.weatherOutside,
                'Get information about *word': this.meaning,
                'Where are we': this.showGlobe,
                'Learn *data': this.learn,
                'Define *definiton': this.define,
                'What is (a) *data': this.whatIs,
                'Who is *data': this.whatIs,
                'Who are the *data': this.whatIs,
                'What time is it': this.time,
                'How old are you': this.myAge,
                'Random news from *source': this.getNews,
                'Expand': this.newsLink,
                'Open camera': this.openCamera,
                'How is it today': this.howToday
            },
            speakOptions: {
                amplitude: 100,
                pitch: 62,
                speed: 162,
                wordgap: 1,
                variant: 'f2'
            },
            apiKeys: {
                openweather: '',
                wordnik: '',
                newsapi: ''
            },
            activate: new Audio(),
            earthGlobe: false,
            toBeLearned: {
                data: null,
                definition: null,
                date: new Date()
            },
            definitions: [],
            learnedWords: [],
            multipleDefinitions: false,
            currentNewslink: null,
            cameraDiv: false
        }
    },
    mounted() {
        this.init();
        navigator.getBattery().then(function (battery) {

            var level = battery.level;

            console.log(level);
            console.log(battery)
        });
    },
    methods: {
        init() {
            annyang.addCommands(this.playCommands);
            annyang.debug();
            annyang.start({
                autoRestart: true,
                continuous: false
            });
            meSpeak.loadConfig("./public/assets/mespeak/mespeak_config.json");
            meSpeak.loadVoice('./public/assets/mespeak/voices/en/en-us.json');

            this.activate.src = "./public/assets/repulsor.mp3";
            this.activate.load();

            this.loadLearnedWords();

            this.getBatteryInfo();

            var introMessage = 'Hi I am Charmaine, your personal assistant. How can I help you?';
            meSpeak.speak(introMessage, this.speakOptions, this.resume(0))
            this.type([introMessage])
            this.animateSpeak(5200);

        },
        loadLearnedWords() {
            var _this = this;
            axios.get('/learned').then(response => {
                _this.learnedWords = response.data
                console.log(response)
            }, error => {
                console.log('error')
            })
        },
        resume(sound = 1) {
            if(sound) this.activate.play();
            annyang.addCommands(this.mainCommands);
        },
        stop() {
            var mainCommands = this.mainCommands;
            annyang.removeCommands(['Weather in *place', 'Weather outside', 'Get information about * word', 'Learn *data', 'Define *definition', 'What is (a) *data', 'What is (an) *data', 'What time is it', 'How old are you', 'Who are the *data', 'Random news from *source', 'Expand', 'Open camera']);
            this.animateSpeakRemove();
            this.currentNewslink = null;
        },
        clear() {
            this.triangle = true;
            this.earthGlobe = false;
            this.definitions = [];
            this.toBeLearned = {};
            this.multipleDefinitions = false;
            this.stop()
            this.type(['Say my name and ask something.'])
        },
        animateSpeak(time) {
            document.querySelector('.triangle').classList.add('animateSpeak');
            setTimeout(function () {
                document.querySelector('.triangle').classList.remove('animateSpeak');
            }, time);
        },
        animateSpeakRemove() {
            document.querySelector('.triangle').classList.remove('animateSpeak');
        },
        type(typeArray) {
            Typed.new(".type-element", {
                strings: typeArray,
                typeSpeed: 0
            });
        },
        weatherIn(place) {
            var _this = this;
            var weatherURL = `http://api.openweathermap.org/data/2.5/weather?q=${place}&appid=${this.apiKeys.openweather}&units=metric`;
            this.wait();
            setTimeout(function () {
                axios.get(weatherURL).then(response => {
                    _this.stop();
                    _this.animateSpeak(4500);
                    var data = response.data;
                    var output = `It is ${data.main.temp} &#8451; in ${place}`;
                    meSpeak.speak(`It is ${data.main.temp} degrees celsius in ${place}`, _this.speakOptions);
                    _this.type([output]);
                }, response => {
                    console.log(response);
                });
            }, 1000);

        },
        weatherOutside() {
            var _this = this;
            navigator.geolocation.getCurrentPosition(showPosition);

            function showPosition(position) {
                var weatherURL = `http://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=${_this.apiKeys.openweather}&units=metric`;
                _this.wait("I'm fetching your weather data.");
                setTimeout(function () {
                    axios.get(weatherURL).then(response => {
                        _this.stop();
                        _this.animateSpeak(3700);
                        var data = response.data;
                        var output = `It is ${data.main.temp} &#8451 outside`;
                        meSpeak.speak(`It is ${data.main.temp} degrees celcius outside`, _this.speakOptions);
                        _this.type([output]);
                    }, error => {
                        console.log(error)
                    });
                }, 1000);
            }
        },
        time() {
            return new Promise((resolve, reject) => {
              var time = new Date().toLocaleTimeString();
              var done = 0;
              meSpeak.speak(`The time, is` + time, this.speakOptions, done=1);
              this.type([time])
              this.animateSpeak(3000);
              this.stop();
              if (done) {
                resolve("Stuff worked!");
              }
              else {
                reject(Error("It broke"));
              }
            });
        },
        wait(info = '') {
            this.animateSpeak(1000);
            meSpeak.speak('Please wait...' + info, this.speakOptions);
            this.type(['Please wait...', info])
        },
        meaning(word) {
            var _this = this;
            var wordnikURL = `http://api.wordnik.com:80/v4/word.json/${word}/definitions?limit=200&includeRelated=false&useCanonical=false&includeTags=false&api_key=${this.apiKeys.wordnik}`;
            this.wait();
            axios.get(wordnikURL).then(response => {
                var data = response.data
                var output = `I got ${data.length} results`;
                if (data.length > 1) {
                    _this.stop();
                    _this.animateSpeak(3000);
                    meSpeak.speak(output, _this.speakOptions);
                    _this.multipleDefinitions = true;
                    data.forEach((result) => {
                        _this.definitions.push(result.text)
                    })
                    _this.type([output])

                } else {
                    _this.stop();
                    _this.animateSpeak(8000);
                    meSpeak.speak(`${word} is ${data[0].text}`, _this.speakOptions);
                    _this.type([data[0].text]);
                }
            }, error => {
                console.log(error)
            });
        },
        showGlobe() {
            this.wait();
            this.triangle = false;
            this.earthGlobe = true;
            var _this = this
            navigator.geolocation.getCurrentPosition(showPosition);

            function showPosition(position) {
                var options = {
                    zoom: 2.0,
                    position: [position.coords.latitude, position.coords.longitude]
                };
                setTimeout(() => {
                    var earth = new WE.map('earth_div', options);
                    WE.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(earth);
                    WE.marker([position.coords.latitude, position.coords.longitude]).addTo(earth)
                    meSpeak.speak('Located', _this.speakOptions)
                    _this.type(['Located'])
                    _this.stop();
                }, 2000);
            }


        },
        myAge() {
            this.stop();
            this.animateSpeak(8000);
            var output = `Age is not how old you are, but how many years of fun you've had`
            meSpeak.speak(output, this.speakOptions);
            this.type([output]);
        },
        getNews(source) {
            var _this = this;
            var newsURL = `https://newsapi.org/v1/articles?source=${source.toLowerCase()}&apiKey=${this.apiKeys.newsapi}`;
            axios.get(newsURL).then(response => {
                var data = response.data
                console.log(response);
                _this.animateSpeak(8000);
                meSpeak.speak(data.articles[0].title, this.speakOptions);
                _this.type([data.articles[0].title]);
                _this.currentNewslink = data.articles[0].url
                setTimeout(() => {
                    _this.stop();
                }, 30000)
            }, error => {
                console.log(error);
                _this.stop();
            })
        },
        newsLink() {
            var win = window.open(this.currentNewslink, '_blank');
            win.focus();
            setTimeout(() => {
                this.currentNewslink = null;
            }, 10000)
        },
        openCamera() {
            this.cameraDiv = true;
            var video = document.querySelector('#video');

            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({
                    video: true
                }).then(function (stream) {
                    video.src = window.URL.createObjectURL(stream);
                    video.play();
                });
            }
        },
        howToday() {
          var _this = this;
          return new Promise((resolve, reject) => {
            var time = new Date().toLocaleTimeString();
            var done = 0;

            var time = _this.time();
            time.then(function() {
              setTimeout(function(){
                // _this.weatherOutside();
                done=1;
              }, 3000);
            });

            doneCheck = setInterval(function(){
              if (done) {
                resolve("Stuff worked!");
                _this.anythingElse();
                clearInterval(doneCheck);
              }
              else {
                reject(Error("It broke"));
              }
            }, 1000)
          });
        },
        closeCamera() {

        },
        anythingElse(){
          this.stop();
          meSpeak.speak(`Anything else?`, this.speakOptions);
          this.resume(0);
        },
        learn(data) {
            var lowerCased = data.toLowerCase()
            this.toBeLearned.data = lowerCased;
            var existing = 0
            this.learnedWords.forEach(result => {
                if (result.data === data) {
                    var output = `Sorry, but ${data} already exists`
                    this.animateSpeak(3000);
                    this.type([output])
                    meSpeak.speak(output, this.speakOptions)
                    existing = 1;
                }
            })

            if (existing === 0) {
                var output = 'Start by saying define. Speak after the repulsor'
                this.animateSpeak(3000);
                this.type([output])
                meSpeak.speak(output, this.speakOptions)
                setTimeout(() => {
                    this.activate.play();
                    console.log(data)
                }, 3500)
            }


        },
        define(definition) {
            var _this = this
            var lowerCased = definition.toLowerCase();
            this.toBeLearned.definition = lowerCased
            this.stop();
            if (this.toBeLearned.data !== null && this.toBeLearned.definition !== null) {
                axios.post('/learn', this.toBeLearned).then(response => {
                    if (response.data.success) {
                        _this.loadLearnedWords();
                        _this.animateSpeak(2000);
                        var output = `${this.toBeLearned.data} learned`;
                        _this.type([output]);
                        meSpeak.speak(output, this.speakOptions)
                        _this.toBeLearned = {};
                    }
                    console.log(response)
                }, error => {
                    console.log(error)
                })
            }
        },
        whatIs(data) {
            var _this = this
            this.learnedWords.forEach(result => {
                if (result.data === data.toLowerCase()) {
                    _this.animateSpeak(2000);
                    _this.type([result.definition]);
                    meSpeak.speak(result.definition, _this.speakOptions);
                    _this.stop();
                }
            })

        },
        getBatteryInfo() {
            var _this = this
            navigator.getBattery().then(function (battery) {
                battery.addEventListener('chargingchange', function () {
                    _this.updateChargeInfo(battery);
                });
            })
        },
        updateChargeInfo(battery) {
            if (battery.charging) {
                this.animateSpeak(2000);
                this.type(['I am charging']);
                meSpeak.speak('I am charging', this.speakOptions);
            } else {
                this.animateSpeak(2000);
                this.type(['Charger removed']);
                meSpeak.speak('Charger removed', this.speakOptions);
            }
        }
    }
})
