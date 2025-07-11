// Theme registry with metadata and French names
const THEME_REGISTRY = {
  default: { name: 'Par défaut', category: 'basic', hasBackground: false },
  christmas: { name: 'Noël', category: 'seasonal', hasBackground: false },
  summer: { name: 'Été', category: 'seasonal', hasBackground: true },
  halloween: { name: 'Halloween', category: 'seasonal', hasBackground: false },
  valentine: { name: 'Saint-Valentin', category: 'seasonal', hasBackground: false },
  easter: { name: 'Pâques', category: 'seasonal', hasBackground: false },
  space: { name: 'Espace', category: 'environment', hasBackground: true },
  ocean: { name: 'Océan', category: 'environment', hasBackground: true },
  neon: { name: 'Néon', category: 'artistic', hasBackground: true },
  forest: { name: 'Forêt', category: 'environment', hasBackground: true },
  cyberpunk: { name: 'Cyberpunk', category: 'artistic', hasBackground: true },
  retro: { name: 'Rétro', category: 'artistic', hasBackground: true },
  galaxy: { name: 'Galaxie', category: 'environment', hasBackground: true },
  desert: { name: 'Désert', category: 'environment', hasBackground: true }
};

/**
 * Get all available theme IDs
 * @returns {Array<string>} Array of theme IDs
 */
function getAvailableThemes() {
  return Object.keys(THEME_REGISTRY);
}

/**
 * Get theme display name (French)
 * @param {string} themeId - Theme identifier
 * @returns {string} French display name
 */
function getThemeName(themeId) {
  return THEME_REGISTRY[themeId]?.name || themeId;
}

/**
 * Get all themes with their metadata
 * @returns {Object} Complete theme registry
 */
function getThemeRegistry() {
  return { ...THEME_REGISTRY };
}

/**
 * Check if a theme has a background
 * @param {string} themeId - Theme identifier
 * @returns {boolean} True if theme has background elements
 */
function themeHasBackground(themeId) {
  return THEME_REGISTRY[themeId]?.hasBackground || false;
}

/**
 * Check if a theme exists
 * @param {string} themeId - Theme identifier
 * @returns {boolean} True if theme exists
 */
function isValidTheme(themeId) {
  return themeId in THEME_REGISTRY;
}

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
    } else if (newTheme === 'space') {
        themeContainer.innerHTML = `
        <style>
            @keyframes twinkle {
                0%, 100% { opacity: 0.3; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.2); }
            }
            
            @keyframes float-planet {
                0% { transform: translateX(-100px) translateY(0px) rotate(0deg); }
                50% { transform: translateX(100px) translateY(-20px) rotate(180deg); }
                100% { transform: translateX(-100px) translateY(0px) rotate(360deg); }
            }
            
            @keyframes shooting-star {
                0% { transform: translateX(-100vw) translateY(100px); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateX(100vw) translateY(-100px); opacity: 0; }
            }
            
            .space-bg {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
                z-index: -1;
            }
            
            .star {
                position: fixed;
                color: #fff;
                font-size: 1em;
                z-index: 1;
                animation: twinkle 2s ease-in-out infinite;
            }
            
            .planet {
                position: fixed;
                font-size: 3em;
                z-index: 1;
                animation: float-planet 20s linear infinite;
            }
            
            .shooting-star {
                position: fixed;
                font-size: 1.5em;
                z-index: 1;
                animation: shooting-star 3s linear infinite;
            }
        </style>
        <div class="space-bg"></div>
        ${Array.from({length: 30}, (_, i) => `
            <div class="star" style="
                left: ${Math.random() * 100}vw;
                top: ${Math.random() * 100}vh;
                animation-delay: ${Math.random() * 2}s;
            ">✦</div>
        `).join('')}
        ${Array.from({length: 3}, (_, i) => `
            <div class="planet" style="
                top: ${20 + Math.random() * 60}vh;
                animation-delay: ${i * 7}s;
            ">${['🪐', '🌍', '🌙'][i]}</div>
        `).join('')}
        ${Array.from({length: 2}, (_, i) => `
            <div class="shooting-star" style="
                top: ${Math.random() * 50}vh;
                animation-delay: ${i * 8}s;
            ">💫</div>
        `).join('')}
        `;
    } else if (newTheme === 'ocean') {
        themeContainer.innerHTML = `
        <style>
            @keyframes bubble-rise {
                0% { transform: translateY(100vh) scale(0); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
            }
            
            @keyframes fish-swim {
                0% { transform: translateX(-100px); }
                100% { transform: translateX(100vw); }
            }
            
            @keyframes kelp-sway {
                0%, 100% { transform: rotate(-5deg); }
                50% { transform: rotate(5deg); }
            }
            
            .ocean-bg {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(180deg, #006994 0%, #003d5c 50%, #001a2e 100%);
                z-index: -1;
            }
            
            .bubble {
                position: fixed;
                color: rgba(173, 216, 230, 0.8);
                font-size: 1em;
                z-index: 1;
                animation: bubble-rise 6s linear infinite;
            }
            
            .fish {
                position: fixed;
                font-size: 2em;
                z-index: 1;
                animation: fish-swim 15s linear infinite;
            }
            
            .kelp {
                position: fixed;
                bottom: 0;
                font-size: 4em;
                z-index: 1;
                transform-origin: bottom;
                animation: kelp-sway 3s ease-in-out infinite;
            }
            
            .coral {
                position: fixed;
                bottom: 0;
                font-size: 2em;
                z-index: 1;
            }
        </style>
        <div class="ocean-bg"></div>
        ${Array.from({length: 20}, (_, i) => `
            <div class="bubble" style="
                left: ${Math.random() * 100}vw;
                animation-delay: ${Math.random() * 6}s;
                font-size: ${0.5 + Math.random()}em;
            ">○</div>
        `).join('')}
        ${Array.from({length: 5}, (_, i) => `
            <div class="fish" style="
                top: ${20 + Math.random() * 60}vh;
                animation-delay: ${i * 3}s;
                animation-duration: ${10 + Math.random() * 10}s;
            ">${['🐠', '🐟', '🦈', '🐡', '🦑'][i]}</div>
        `).join('')}
        ${Array.from({length: 6}, (_, i) => `
            <div class="kelp" style="
                left: ${i * 16}vw;
                animation-delay: ${Math.random() * 3}s;
            ">🌿</div>
        `).join('')}
        ${Array.from({length: 8}, (_, i) => `
            <div class="coral" style="
                left: ${Math.random() * 100}vw;
            ">🪸</div>
        `).join('')}
        `;
    } else if (newTheme === 'neon') {
        themeContainer.innerHTML = `
        <style>
            @keyframes neon-glow {
                0%, 100% { 
                    text-shadow: 0 0 5px currentColor, 0 0 10px currentColor, 0 0 20px currentColor;
                    transform: scale(1);
                }
                50% { 
                    text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px currentColor;
                    transform: scale(1.1);
                }
            }
            
            @keyframes neon-float {
                0% { transform: translateY(0px) translateX(0px); }
                25% { transform: translateY(-20px) translateX(10px); }
                50% { transform: translateY(0px) translateX(20px); }
                75% { transform: translateY(20px) translateX(10px); }
                100% { transform: translateY(0px) translateX(0px); }
            }
            
            .neon-bg {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(45deg, #0a0a0a 0%, #1a0a1a 50%, #0a1a1a 100%);
                z-index: -1;
            }
            
            .neon-element {
                position: fixed;
                font-size: 2em;
                z-index: 1;
                animation: neon-glow 2s ease-in-out infinite, neon-float 8s ease-in-out infinite;
            }
            
            .neon-pink { color: #ff00ff; }
            .neon-cyan { color: #00ffff; }
            .neon-green { color: #00ff00; }
            .neon-yellow { color: #ffff00; }
        </style>
        <div class="neon-bg"></div>
        ${Array.from({length: 12}, (_, i) => `
            <div class="neon-element neon-${['pink', 'cyan', 'green', 'yellow'][i % 4]}" style="
                left: ${Math.random() * 100}vw;
                top: ${Math.random() * 100}vh;
                animation-delay: ${Math.random() * 4}s;
            ">${['◆', '▲', '●', '■', '★', '♦'][i % 6]}</div>
        `).join('')}
        `;
    } else if (newTheme === 'forest') {
        themeContainer.innerHTML = `
        <style>
            @keyframes leaf-fall {
                0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
            }
            
            @keyframes tree-sway {
                0%, 100% { transform: rotate(-2deg); }
                50% { transform: rotate(2deg); }
            }
            
            @keyframes butterfly-flutter {
                0% { transform: translateX(0) translateY(0) rotate(0deg); }
                25% { transform: translateX(50px) translateY(-20px) rotate(10deg); }
                50% { transform: translateX(100px) translateY(0) rotate(0deg); }
                75% { transform: translateX(50px) translateY(20px) rotate(-10deg); }
                100% { transform: translateX(0) translateY(0) rotate(0deg); }
            }
            
            .forest-bg {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(180deg, #87ceeb 0%, #90ee90 30%, #228b22 100%);
                z-index: -1;
            }
            
            .falling-leaf {
                position: fixed;
                font-size: 1.5em;
                z-index: 1;
                animation: leaf-fall 8s linear infinite;
            }
            
            .tree {
                position: fixed;
                bottom: 0;
                font-size: 5em;
                z-index: 1;
                transform-origin: bottom;
                animation: tree-sway 4s ease-in-out infinite;
            }
            
            .butterfly {
                position: fixed;
                font-size: 1.5em;
                z-index: 1;
                animation: butterfly-flutter 6s ease-in-out infinite;
            }
            
            .flower {
                position: fixed;
                bottom: 0;
                font-size: 2em;
                z-index: 1;
            }
        </style>
        <div class="forest-bg"></div>
        ${Array.from({length: 15}, (_, i) => `
            <div class="falling-leaf" style="
                left: ${Math.random() * 100}vw;
                animation-delay: ${Math.random() * 8}s;
                color: ${['#ff6b35', '#f7931e', '#ffcc02', '#8fbc8f'][Math.floor(Math.random() * 4)]};
            ">${['🍃', '🍂', '🍁'][Math.floor(Math.random() * 3)]}</div>
        `).join('')}
        ${Array.from({length: 4}, (_, i) => `
            <div class="tree" style="
                left: ${i * 25}vw;
                animation-delay: ${i * 1}s;
            ">🌳</div>
        `).join('')}
        ${Array.from({length: 3}, (_, i) => `
            <div class="butterfly" style="
                left: ${20 + i * 30}vw;
                top: ${30 + Math.random() * 40}vh;
                animation-delay: ${i * 2}s;
            ">🦋</div>
        `).join('')}
        ${Array.from({length: 8}, (_, i) => `
            <div class="flower" style="
                left: ${Math.random() * 100}vw;
            ">${['🌸', '🌺', '🌻', '🌷'][Math.floor(Math.random() * 4)]}</div>
        `).join('')}
        `;
    } else if (newTheme === 'cyberpunk') {
        themeContainer.innerHTML = `
        <style>
            @keyframes matrix-rain {
                0% { transform: translateY(-100vh); opacity: 1; }
                100% { transform: translateY(100vh); opacity: 0; }
            }
            
            @keyframes hologram-flicker {
                0%, 100% { opacity: 1; transform: skew(0deg); }
                50% { opacity: 0.8; transform: skew(1deg); }
                75% { opacity: 0.9; transform: skew(-0.5deg); }
            }
            
            @keyframes neon-circuit {
                0% { box-shadow: 0 0 5px #00ff41; }
                50% { box-shadow: 0 0 20px #00ff41, 0 0 30px #ff0080; }
                100% { box-shadow: 0 0 5px #00ff41; }
            }
            
            .cyber-bg {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(45deg, #000000 0%, #1a0033 50%, #000000 100%);
                z-index: -1;
            }
            
            .matrix-char {
                position: fixed;
                color: #00ff41;
                font-family: 'Courier New', monospace;
                font-size: 1.2em;
                z-index: 1;
                animation: matrix-rain 4s linear infinite;
                text-shadow: 0 0 10px #00ff41;
            }
            
            .hologram {
                position: fixed;
                font-size: 2em;
                z-index: 1;
                animation: hologram-flicker 3s ease-in-out infinite;
                color: #ff0080;
                text-shadow: 0 0 15px currentColor;
            }
            
            .circuit-line {
                position: fixed;
                width: 2px;
                height: 50px;
                background: #00ff41;
                z-index: 1;
                animation: neon-circuit 2s ease-in-out infinite;
            }
        </style>
        <div class="cyber-bg"></div>
        ${Array.from({length: 25}, (_, i) => `
            <div class="matrix-char" style="
                left: ${Math.random() * 100}vw;
                animation-delay: ${Math.random() * 4}s;
                animation-duration: ${3 + Math.random() * 2}s;
            ">${String.fromCharCode(33 + Math.floor(Math.random() * 94))}</div>
        `).join('')}
        ${Array.from({length: 6}, (_, i) => `
            <div class="hologram" style="
                left: ${Math.random() * 100}vw;
                top: ${Math.random() * 100}vh;
                animation-delay: ${Math.random() * 3}s;
            ">${['◉', '◈', '◊', '▦', '▣', '⬢'][i]}</div>
        `).join('')}
        ${Array.from({length: 10}, (_, i) => `
            <div class="circuit-line" style="
                left: ${Math.random() * 100}vw;
                top: ${Math.random() * 100}vh;
                animation-delay: ${Math.random() * 2}s;
                transform: rotate(${Math.random() * 360}deg);
            "></div>
        `).join('')}
        `;
    } else if (newTheme === 'retro') {
        themeContainer.innerHTML = `
        <style>
            @keyframes retro-bounce {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-30px) scale(1.2); }
            }
            
            @keyframes disco-spin {
                0% { transform: rotate(0deg) scale(1); }
                50% { transform: rotate(180deg) scale(1.5); }
                100% { transform: rotate(360deg) scale(1); }
            }
            
            @keyframes wave-move {
                0% { transform: translateX(-100vw); }
                100% { transform: translateX(100vw); }
            }
            
            .retro-bg {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(45deg, #ff00ff 0%, #00ffff 25%, #ffff00 50%, #ff00ff 75%, #00ffff 100%);
                background-size: 400% 400%;
                animation: gradient-shift 8s ease infinite;
                z-index: -1;
            }
            
            @keyframes gradient-shift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            
            .retro-element {
                position: fixed;
                font-size: 2em;
                z-index: 1;
                animation: retro-bounce 3s ease-in-out infinite;
                text-shadow: 3px 3px 0px #000;
                color: #fff;
            }
            
            .disco-ball {
                position: fixed;
                font-size: 3em;
                z-index: 1;
                animation: disco-spin 4s linear infinite;
            }
            
            .retro-wave {
                position: fixed;
                bottom: 20%;
                font-size: 1.5em;
                color: #ff00ff;
                z-index: 1;
                animation: wave-move 6s linear infinite;
            }
        </style>
        <div class="retro-bg"></div>
        ${Array.from({length: 8}, (_, i) => `
            <div class="retro-element" style="
                left: ${Math.random() * 100}vw;
                top: ${Math.random() * 100}vh;
                animation-delay: ${Math.random() * 3}s;
            ">${['⚡', '⭐', '💎', '🎵', '🎸', '📻', '💫', '🌈'][i]}</div>
        `).join('')}
        <div class="disco-ball" style="
            left: 50%;
            top: 20%;
            transform: translateX(-50%);
        ">🪩</div>
        ${Array.from({length: 5}, (_, i) => `
            <div class="retro-wave" style="
                animation-delay: ${i * 1.2}s;
            ">～～～</div>
        `).join('')}
        `;
    } else if (newTheme === 'galaxy') {
        themeContainer.innerHTML = `
        <style>
            @keyframes nebula-drift {
                0% { transform: translateX(-50px) translateY(0px) rotate(0deg); opacity: 0.3; }
                50% { transform: translateX(50px) translateY(-30px) rotate(180deg); opacity: 0.8; }
                100% { transform: translateX(-50px) translateY(0px) rotate(360deg); opacity: 0.3; }
            }
            
            @keyframes pulsar-pulse {
                0%, 100% { 
                    transform: scale(1); 
                    box-shadow: 0 0 20px #ff6ec7, 0 0 40px #ff6ec7;
                }
                50% { 
                    transform: scale(1.5); 
                    box-shadow: 0 0 40px #ff6ec7, 0 0 80px #ff6ec7, 0 0 120px #ff6ec7;
                }
            }
            
            @keyframes cosmic-dust {
                0% { transform: translateY(100vh) translateX(0px) rotate(0deg); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(-100px) translateX(100px) rotate(360deg); opacity: 0; }
            }
            
            .galaxy-bg {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(ellipse at center, #1a1a2e 0%, #16213e 30%, #0f0f23 70%, #000000 100%);
                z-index: -1;
            }
            
            .nebula {
                position: fixed;
                width: 200px;
                height: 100px;
                border-radius: 50%;
                z-index: 1;
                animation: nebula-drift 20s ease-in-out infinite;
                opacity: 0.6;
            }
            
            .pulsar {
                position: fixed;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #ff6ec7;
                z-index: 1;
                animation: pulsar-pulse 3s ease-in-out infinite;
            }
            
            .cosmic-dust {
                position: fixed;
                font-size: 0.5em;
                color: #87ceeb;
                z-index: 1;
                animation: cosmic-dust 15s linear infinite;
            }
            
            .constellation {
                position: fixed;
                color: #ffffff;
                font-size: 1.2em;
                z-index: 1;
                text-shadow: 0 0 10px #87ceeb;
            }
        </style>
        <div class="galaxy-bg"></div>
        ${Array.from({length: 4}, (_, i) => `
            <div class="nebula" style="
                left: ${Math.random() * 80}vw;
                top: ${Math.random() * 80}vh;
                background: radial-gradient(ellipse, ${['#ff6ec7', '#6ec7ff', '#c7ff6e', '#ff6e6e'][i]} 0%, transparent 70%);
                animation-delay: ${i * 5}s;
            "></div>
        `).join('')}
        ${Array.from({length: 6}, (_, i) => `
            <div class="pulsar" style="
                left: ${Math.random() * 100}vw;
                top: ${Math.random() * 100}vh;
                animation-delay: ${Math.random() * 3}s;
            "></div>
        `).join('')}
        ${Array.from({length: 25}, (_, i) => `
            <div class="cosmic-dust" style="
                left: ${Math.random() * 100}vw;
                animation-delay: ${Math.random() * 15}s;
            ">·</div>
        `).join('')}
        ${Array.from({length: 8}, (_, i) => `
            <div class="constellation" style="
                left: ${Math.random() * 100}vw;
                top: ${Math.random() * 100}vh;
            ">✦</div>
        `).join('')}
        `;
    } else if (newTheme === 'desert') {
        themeContainer.innerHTML = `
        <style>
            @keyframes sand-blow {
                0% { transform: translateX(-100vw) translateY(0px); opacity: 0; }
                10% { opacity: 0.6; }
                90% { opacity: 0.6; }
                100% { transform: translateX(100vw) translateY(-20px); opacity: 0; }
            }
            
            @keyframes mirage-shimmer {
                0%, 100% { transform: scaleY(1) skewX(0deg); opacity: 0.3; }
                50% { transform: scaleY(1.1) skewX(2deg); opacity: 0.6; }
            }
            
            @keyframes cactus-sway {
                0%, 100% { transform: rotate(-1deg); }
                50% { transform: rotate(1deg); }
            }
            
            @keyframes sun-ray {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .desert-bg {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(180deg, #ff6b35 0%, #f7931e 30%, #ffcc02 70%, #d4af37 100%);
                z-index: -1;
            }
            
            .sand-particle {
                position: fixed;
                font-size: 0.8em;
                color: #d4af37;
                z-index: 1;
                animation: sand-blow 8s linear infinite;
            }
            
            .mirage {
                position: fixed;
                width: 150px;
                height: 80px;
                background: linear-gradient(90deg, transparent, rgba(135, 206, 235, 0.3), transparent);
                z-index: 1;
                animation: mirage-shimmer 4s ease-in-out infinite;
                border-radius: 50%;
            }
            
            .cactus {
                position: fixed;
                bottom: 0;
                font-size: 4em;
                z-index: 1;
                transform-origin: bottom;
                animation: cactus-sway 6s ease-in-out infinite;
            }
            
            .desert-sun {
                position: fixed;
                top: 10%;
                right: 15%;
                width: 80px;
                height: 80px;
                background: radial-gradient(circle, #ffff00 30%, #ff6b35 100%);
                border-radius: 50%;
                z-index: 1;
                animation: sun-ray 20s linear infinite;
                box-shadow: 0 0 40px #ffff00;
            }
            
            .desert-sun::before {
                content: '';
                position: absolute;
                top: -20px;
                left: -20px;
                right: -20px;
                bottom: -20px;
                background: conic-gradient(from 0deg, transparent, #ffff00, transparent, #ffff00, transparent);
                border-radius: 50%;
                z-index: -1;
                opacity: 0.3;
            }
            
            .dune {
                position: fixed;
                bottom: 0;
                width: 200px;
                height: 100px;
                background: linear-gradient(45deg, #d4af37, #daa520);
                border-radius: 100px 100px 0 0;
                z-index: 1;
            }
        </style>
        <div class="desert-bg"></div>
        <div class="desert-sun"></div>
        ${Array.from({length: 20}, (_, i) => `
            <div class="sand-particle" style="
                top: ${Math.random() * 100}vh;
                animation-delay: ${Math.random() * 8}s;
                animation-duration: ${6 + Math.random() * 4}s;
            ">•</div>
        `).join('')}
        ${Array.from({length: 3}, (_, i) => `
            <div class="mirage" style="
                left: ${Math.random() * 70}vw;
                bottom: ${20 + Math.random() * 30}vh;
                animation-delay: ${i * 1.5}s;
            "></div>
        `).join('')}
        ${Array.from({length: 5}, (_, i) => `
            <div class="cactus" style="
                left: ${i * 20}vw;
                animation-delay: ${i * 1.2}s;
            ">🌵</div>
        `).join('')}
        ${Array.from({length: 6}, (_, i) => `
            <div class="dune" style="
                left: ${Math.random() * 100}vw;
                height: ${60 + Math.random() * 40}px;
                width: ${150 + Math.random() * 100}px;
                opacity: ${0.3 + Math.random() * 0.4};
            "></div>
        `).join('')}
        `;
    }
}

// Make theme functions globally available
window.getAvailableThemes = getAvailableThemes;
window.getThemeName = getThemeName;
window.getThemeRegistry = getThemeRegistry;
window.isValidTheme = isValidTheme;
window.themeHasBackground = themeHasBackground;
window.applyTheme = applyTheme;
