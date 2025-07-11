function applyTheme(newTheme, previousTheme, themeContainer) {
    if (newTheme === previousTheme) {
        return;
    }

    themeContainer.innerHTML = '';

    if (newTheme === 'christmas') {
        themeContainer.innerHTML = `
        <div class="snowflakescript">
            <style>
                /* customizable snowflake styling */
                .snowflake {
                  color: #fff;
                  font-size: 1em;
                  font-family: Arial, sans-serif;
                  text-shadow: 0 0 5px #000;
                }
                
                @-webkit-keyframes snowflakes-fall{0%{top:-10%}100%{top:100%}}@-webkit-keyframes snowflakes-shake{0%,100%{-webkit-transform:translateX(0);transform:translateX(0)}50%{-webkit-transform:translateX(80px);transform:translateX(80px)}}@keyframes snowflakes-fall{0%{top:-10%}100%{top:100%}}@keyframes snowflakes-shake{0%,100%{transform:translateX(0)}50%{transform:translateX(80px)}}.snowflake{position:fixed;top:-10%;z-index:2;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;cursor:default;-webkit-animation-name:snowflakes-fall,snowflakes-shake;-webkit-animation-duration:10s,3s;-webkit-animation-timing-function:linear,ease-in-out;-webkit-animation-iteration-count:infinite,infinite;-webkit-animation-play-state:running,running;animation-name:snowflakes-fall,snowflakes-shake;animation-duration:10s,3s;animation-timing-function:linear,ease-in-out;animation-iteration-count:infinite,infinite;animation-play-state:running,running}.snowflake:nth-of-type(0){left:1%;-webkit-animation-delay:0s,0s;animation-delay:0s,0s}.snowflake:nth-of-type(1){left:10%;-webkit-animation-delay:1s,1s;animation-delay:1s,1s}.snowflake:nth-of-type(2){left:20%;-webkit-animation-delay:6s,.5s;animation-delay:6s,.5s}.snowflake:nth-of-type(3){left:30%;-webkit-animation-delay:4s,2s;animation-delay:4s,2s}.snowflake:nth-of-type(4){left:40%;-webkit-animation-delay:2s,2s;animation-delay:2s,2s}.snowflake:nth-of-type(5){left:50%;-webkit-animation-delay:8s,3s;animation-delay:8s,3s}.snowflake:nth-of-type(6){left:60%;-webkit-animation-delay:6s,2s;animation-delay:6s,2s}.snowflake:nth-of-type(7){left:70%;-webkit-animation-delay:2.5s,1s;animation-delay:2.5s,1s}.snowflake:nth-of-type(8){left:80%;-webkit-animation-delay:1s,0s;animation-delay:1s,0s}.snowflake:nth-of-type(9){left:90%;-webkit-animation-delay:3s,1.5s;animation-delay:3s,1.5s}.snowflake:nth-of-type(10){left:25%;-webkit-animation-delay:2s,0s;animation-delay:2s,0s}.snowflake:nth-of-type(11){left:65%;-webkit-animation-delay:4s,2.5s;animation-delay:4s,2.5s}
            </style>
            <div class="snowflakes" aria-hidden="true">
              <div class="snowflake">❅</div>
              <div class="snowflake">❆</div>
              <div class="snowflake">❅</div>
              <div class="snowflake">❆</div>
              <div class="snowflake">❅</div>
              <div class="snowflake">❆</div>
              <div class="snowflake">❅</div>
              <div class="snowflake">❆</div>
              <div class="snowflake">❅</div>
              <div class="snowflake">❆</div>
              <div class="snowflake">❅</div>
              <div class="snowflake">❆</div>
            </div>
        </div>
        <div id="snow-patch"></div>
        `;
    } else if (newTheme === 'summer') {
        themeContainer.innerHTML = `
        <style>
            .ocean {
                height: 100px;
                width: 100%;
                position: fixed;
                bottom: 0;
                left: 0;
                z-index: 1;
                pointer-events: none;
            }
            .wave {
                z-index: 1;
                background: url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/85486/wave.svg) repeat-x;
                position: absolute;
                width: 6400px;
                height: 198px;
                animation: wave 7s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite;
                transform: translate3d(0, 0, 0);
            }
            .wave:nth-of-type(1) {
                bottom: 0;
                opacity: 0.7;
            }
            .wave:nth-of-type(2) {
                bottom: 10px;
                animation: wave 7s cubic-bezier(0.36, 0.45, 0.63, 0.53) -.125s infinite, swell 7s ease -1.25s infinite;
                opacity: 0.3;
            }
            @keyframes wave {
                0% { margin-left: 0; }
                100% { margin-left: -1600px; }
            }
            @keyframes swell {
                0%, 100% { transform: translateY(-15px); }
                50% { transform: translateY(15px); }
            }
        </style>
        <div class="ocean">
            <div class="wave"></div>
            <div class="wave"></div>
        </div>
        `;
    } else if (newTheme === 'halloween') {
        themeContainer.innerHTML = `
        <div class="snowflakescript">
            <style>
                .snowflake {
                  color: #fff;
                  font-size: 2em;
                  font-family: Arial, sans-serif;
                  text-shadow: 0 0 5px #000;
                }
                
                @-webkit-keyframes snowflakes-fall{0%{top:-10%}100%{top:100%}}@-webkit-keyframes snowflakes-shake{0%,100%{-webkit-transform:translateX(0);transform:translateX(0)}50%{-webkit-transform:translateX(80px);transform:translateX(80px)}}@keyframes snowflakes-fall{0%{top:-10%}100%{top:100%}}@keyframes snowflakes-shake{0%,100%{transform:translateX(0)}50%{transform:translateX(80px)}}.snowflake{position:fixed;top:-10%;z-index:9999;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;cursor:default;-webkit-animation-name:snowflakes-fall,snowflakes-shake;-webkit-animation-duration:10s,3s;-webkit-animation-timing-function:linear,ease-in-out;-webkit-animation-iteration-count:infinite,infinite;-webkit-animation-play-state:running,running;animation-name:snowflakes-fall,snowflakes-shake;animation-duration:10s,3s;animation-timing-function:linear,ease-in-out;animation-iteration-count:infinite,infinite;animation-play-state:running,running}.snowflake:nth-of-type(0){left:1%;-webkit-animation-delay:0s,0s;animation-delay:0s,0s}.snowflake:nth-of-type(1){left:10%;-webkit-animation-delay:1s,1s;animation-delay:1s,1s}.snowflake:nth-of-type(2){left:20%;-webkit-animation-delay:6s,.5s;animation-delay:6s,.5s}.snowflake:nth-of-type(3){left:30%;-webkit-animation-delay:4s,2s;animation-delay:4s,2s}.snowflake:nth-of-type(4){left:40%;-webkit-animation-delay:2s,2s;animation-delay:2s,2s}.snowflake:nth-of-type(5){left:50%;-webkit-animation-delay:8s,3s;animation-delay:8s,3s}.snowflake:nth-of-type(6){left:60%;-webkit-animation-delay:6s,2s;animation-delay:6s,2s}.snowflake:nth-of-type(7){left:70%;-webkit-animation-delay:2.5s,1s;animation-delay:2.5s,1s}.snowflake:nth-of-type(8){left:80%;-webkit-animation-delay:1s,0s;animation-delay:1s,0s}.snowflake:nth-of-type(9){left:90%;-webkit-animation-delay:3s,1.5s;animation-delay:3s,1.5s}.snowflake:nth-of-type(10){left:25%;-webkit-animation-delay:2s,0s;animation-delay:2s,0s}.snowflake:nth-of-type(11){left:65%;-webkit-animation-delay:4s,2.5s;animation-delay:4s,2.5s}
            </style>
            <div class="snowflakes" aria-hidden="true">
              <div class="snowflake">🎃</div>
              <div class="snowflake">🍂</div>
              <div class="snowflake">🎃</div>
              <div class="snowflake">🍁</div>
              <div class="snowflake">🎃</div>
              <div class="snowflake">🍂</div>
              <div class="snowflake">🎃</div>
              <div class="snowflake">🍁</div>
              <div class="snowflake">🎃</div>
              <div class="snowflake">🍂</div>
              <div class="snowflake">🎃</div>
              <div class="snowflake">🍁</div>
            </div>
        </div>
        `;
    } else if (newTheme === 'valentine') {
        themeContainer.innerHTML = `
        <style>
            @keyframes float {
                0% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-20px) rotate(10deg); }
                100% { transform: translateY(0px) rotate(0deg); }
            }
            
            .heart {
                position: fixed;
                color: #ff69b4;
                font-size: 2em;
                opacity: 0.6;
                z-index: 1;
                animation: float 4s ease-in-out infinite;
            }
            
            .heart:nth-child(2n) {
                animation-delay: -2s;
                color: #ff1493;
            }
        </style>
        ${Array.from({length: 12}, (_, i) => `
            <div class="heart" style="
                left: ${Math.random() * 100}vw;
                top: ${Math.random() * 100}vh;
                animation-duration: ${3 + Math.random() * 2}s;
            ">❤️</div>
        `).join('')}
        `;
    } else if (newTheme === 'easter') {
        themeContainer.innerHTML = `
        <style>
            @keyframes bounce {
                0%, 100% { transform: translateY(0) rotate(0deg); }
                50% { transform: translateY(-20px) rotate(10deg); }
            }
            
            .easter-egg {
                position: fixed;
                font-size: 2em;
                z-index: 1;
                animation: bounce 3s ease-in-out infinite;
            }
            
            .easter-bunny {
                position: fixed;
                font-size: 3em;
                z-index: 1;
                animation: bounce 4s ease-in-out infinite;
            }
        </style>
        ${Array.from({length: 8}, (_, i) => `
            <div class="easter-egg" style="
                left: ${Math.random() * 100}vw;
                top: ${Math.random() * 100}vh;
                animation-delay: ${Math.random() * 2}s;
            ">🥚</div>
        `).join('')}
        ${Array.from({length: 3}, (_, i) => `
            <div class="easter-bunny" style="
                left: ${Math.random() * 100}vw;
                top: ${Math.random() * 100}vh;
                animation-delay: ${Math.random() * 2}s;
            ">🐰</div>
        `).join('')}
        `;
    }
}
