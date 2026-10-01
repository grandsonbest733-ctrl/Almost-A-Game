const loadScript = src => { let s = document.createElement('script'); s.src = src; document.head.appendChild(s); return s; };
let three = loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
three.onload = initGame;

function initGame() {
    let isDead = false, currentStance = 'stand', playerHp = 500, maxPlayerHp = 500, isInvincible = false, isZoomed = false;
    let blueScore = 0, redScore = 0, gameStarted = false, startCountdownTimer = null;
    let activePumpkinItem = null, gatlingGunPlaced = false, gatlingMesh = null, gatlingBullets = 0;
    let isHoldingGatling = false, gatlingPickupDistance = 5;
    let selectedOpponentSkin = 'Kingsguard';

    const style = document.createElement('style');
    style.innerHTML = `
        body { background: #141e28; font-family: sans-serif; margin: 0; overflow: hidden; user-select: none; }
        .crosshair { position: absolute; top: 50%; left: 50%; width: 10px; height: 10px; background: #fff; border: 2px solid #000; border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none; display: none; }
        .ui-ammo { position: absolute; bottom: 110px; left: 30px; color: #fff; font-size: 18px; font-weight: bold; text-shadow: 2px 2px #000; display: none; }
        .ui-player-hp { position: absolute; top: 20px; left: 20px; color: #33ccff; font-size: 20px; font-weight: bold; text-shadow: 2px 2px #000; display: none; }
        .ui-health { position: absolute; color: red; font-size: 14px; font-weight: bold; text-shadow: 1px 1px #000; transform: translate(-50%, -50%); pointer-events: none; display: none; }
        .bot-status { position: absolute; top: 60px; left: 50%; transform: translateX(-50%); color: #ffcc00; font-size: 18px; font-weight: bold; text-shadow: 2px 2px #000; display: none; }
        .scoreboard { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); display: none; gap: 20px; font-size: 22px; font-weight: bold; text-shadow: 2px 2px #000; z-index: 20; background: rgba(0,0,0,0.4); padding: 8px 16px; border-radius: 8px; }
        .score-blue { color: #33ccff; }
        .score-red { color: #ff3333; }
        .weapon-menu-btn { position: absolute; top: 15px; left: 80%; transform: translateX(-50%); padding: 8px 16px; background: rgba(0,0,0,0.8); color: #fff; font-size: 12px; font-weight: bold; border-radius: 6px; cursor: pointer; z-index: 10; display: none; }
        .weapon-bar { position: absolute; top: 55px; left: 80%; transform: translateX(-50%); display: none; flex-direction: column; gap: 4px; background: rgba(0,0,0,0.6); padding: 8px; border-radius: 6px; z-index: 10; max-height: 70vh; overflow-y: auto; }
        .weapon-bar.open { display: flex; }
        .weapon-btn { padding: 6px 12px; background: rgba(50,50,50,0.9); color: #fff; font-size: 11px; font-weight: bold; border-radius: 4px; cursor: pointer; text-align: center; width: 130px; }
        #reloadBtn { position: absolute; bottom: 95px; left: 30px; padding: 10px 20px; background: rgba(0,0,255,0.7); color: #fff; font-size: 12px; font-weight: bold; border-radius: 8px; cursor: pointer; display: none; }
        #shootBtn { position: absolute; bottom: 30px; left: 30px; padding: 20px 30px; background: rgba(255,0,0,0.8); color: #fff; font-size: 14px; font-weight: bold; border-radius: 10px; cursor: pointer; display: none; }
        #zoomBtn { position: absolute; bottom: 160px; left: 30px; padding: 10px 20px; background: rgba(100,100,100,0.8); color: #fff; font-size: 12px; font-weight: bold; border-radius: 8px; cursor: pointer; display: none; }
        #jumpBtn { position: absolute; bottom: 95px; right: 130px; padding: 15px; background: rgba(0,180,0,0.8); color: #fff; font-size: 12px; font-weight: bold; border-radius: 8px; cursor: pointer; display: none; }
        #crouchBtn { position: absolute; bottom: 95px; right: 220px; padding: 15px; background: rgba(180,100,0,0.8); color: #fff; font-size: 12px; font-weight: bold; border-radius: 8px; cursor: pointer; display: none; }
        #proneBtn { position: absolute; bottom: 30px; right: 130px; padding: 20px 15px; background: rgba(100,50,150,0.8); color: #fff; font-size: 12px; font-weight: bold; border-radius: 10px; cursor: pointer; display: none; }
        #moveBtn { position: absolute; bottom: 30px; right: 30px; padding: 20px 25px; background: rgba(255,255,255,0.8); color: #000; font-size: 14px; font-weight: bold; border-radius: 10px; cursor: pointer; display: none; }
        .home-screen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #141e28; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 30000; color: white; }
        .home-title { font-size: 48px; font-weight: bold; margin-bottom: 20px; text-shadow: 3px 3px #000; }
        .skin-select-container { display: flex; gap: 15px; margin-bottom: 25px; }
        .skin-btn { padding: 12px 20px; font-size: 16px; font-weight: bold; background: #334455; color: white; border: 2px solid #556677; border-radius: 8px; cursor: pointer; }
        .skin-btn.selected { background: #00aa00; border-color: #ffffff; }
        .home-btn { padding: 20px 40px; font-size: 22px; font-weight: bold; background: #00aa00; color: white; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
        .home-btn.cancel { background: #aa0000; }
        .pumpkin-pickup { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -120px); background: #ffffff; color: #000000; padding: 12px 24px; font-size: 16px; font-weight: bold; border-radius: 8px; cursor: pointer; z-index: 25; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: none; border: 2px solid #333; }
        #gatlingWheel { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); width: 120px; height: 120px; background: rgba(0,0,0,0.6); border: 4px solid #fff; border-radius: 50%; display: none; z-index: 25; touch-action: none; }
    `;
    document.head.appendChild(style);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
    camera.position.set(120, 2, 120);
    let rY = 0, rX = 0;
    camera.rotation.order = 'YXZ';

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dLight.position.set(50, 100, 50);
    scene.add(dLight);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ color: 0x3b5323 }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const buildingCoords = [[-30, -60], [40, -100], [-70, 50], [60, 80]];
    const colliders = [], floorFloors = [], treeMeshes = [];

    const tMat = new THREE.MeshStandardMaterial({ color: 0x2e4d1e }), trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
    for (let i = 0; i < 60; i++) {
        let x = (Math.random() - 0.5) * 400, z = (Math.random() - 0.5) * 400;
        let t = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 4, 6), trunkMat); t.position.set(x, 2, z);
        let l = new THREE.Mesh(new THREE.DodecahedronGeometry(3), tMat); l.position.set(x, 5, z);
        scene.add(t, l);
        treeMeshes.push(t, l);
    }

    const defaultWeaponsList = [
        { name: 'M1 Garand', fr: 400, max: 8, cur: 8, rt: 1500, dmg: 34, maxRange: 400, type: 'rifle', wood: 0x6e4726, metal: 0x222222 },
        { name: 'AK-47', fr: 150, max: 30, cur: 30, rt: 2000, dmg: 20, maxRange: 250, type: 'rifle', wood: 0x5c4033, metal: 0x333333 },
        { name: 'Winchester 1873', fr: 600, max: 12, cur: 12, rt: 2200, dmg: 55, maxRange: 400, type: 'rifle', wood: 0x7c5230, metal: 0x1c1c1c },
        { name: 'Colt Single Action Army', fr: 500, max: 6, cur: 6, rt: 1800, dmg: 45, maxRange: 20, type: 'pistol', wood: 0x8b5a2b, metal: 0x444444 },
        { name: 'Mosin Nagant', fr: 900, max: 5, cur: 5, rt: 2500, dmg: 85, maxRange: 400, type: 'rifle', wood: 0x5a3d28, metal: 0x2a2a2a },
        { name: 'Winchester 1892', fr: 500, max: 12, cur: 12, rt: 2200, dmg: 50, maxRange: 400, type: 'rifle', wood: 0x754822, metal: 0x111111 },
        { name: 'Winchester 1897', fr: 700, max: 5, cur: 5, rt: 2500, dmg: 75, maxRange: 20, type: 'shotgun', wood: 0x613f1d, metal: 0x383838 },
        { name: 'Mauser Model 98', fr: 850, max: 5, cur: 5, rt: 2400, dmg: 85, maxRange: 400, type: 'rifle', wood: 0x50351d, metal: 0x1f1f1f },
        { name: 'Lee-Enfield', fr: 350, max: 10, cur: 10, rt: 2000, dmg: 75, maxRange: 400, type: 'rifle', wood: 0x69482b, metal: 0x2d2d2d },
        { name: 'Remington 870', fr: 650, max: 6, cur: 6, rt: 2200, dmg: 90, maxRange: 20, type: 'shotgun', wood: 0x4a3219, metal: 0x404040 },
        { name: 'Thompson Submachine Gun', fr: 100, max: 30, cur: 30, rt: 2300, dmg: 18, maxRange: 20, type: 'smg', wood: 0x5c3a21, metal: 0x1a1a1a },
        { name: 'M1911', fr: 300, max: 7, cur: 7, rt: 1600, dmg: 35, maxRange: 50, type: 'pistol', wood: 0x442c1d, metal: 0x333333 }
    ];
    let weaponsList = JSON.parse(JSON.stringify(defaultWeaponsList));
    let curWeapon = { ...weaponsList[0] };

    const pumpkins = [];
    function spawnPumpkins() {
        pumpkins.forEach(p => scene.remove(p.mesh));
        pumpkins.length = 0;
        const types = [
            { color: 0xff8c00, item: 'Gatling Gun', name: 'Gatling Gun' },
            { color: 0xff1493, item: 'Bazooka', name: 'Bazooka' },
            { color: 0xff0000, item: 'Flare Gun', name: 'Flare Gun' }
        ];
        types.forEach(t => {
            let pGroup = new THREE.Group();
            let body = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5), new THREE.MeshStandardMaterial({ color: t.color }));
            let stem = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6), new THREE.MeshStandardMaterial({ color: 0x2e4d1e }));
            stem.position.set(0, 1.5, 0);
            pGroup.add(body, stem);
            pGroup.position.set((Math.random() - 0.5) * 300, 0, (Math.random() - 0.5) * 300);
            scene.add(pGroup);
            pumpkins.push({ mesh: pGroup, hp: 150, maxHp: 150, item: t.item, name: t.name, active: true, explosionTimer: 0, explosionMesh: null });
        });
    }
    spawnPumpkins();    const wContainer = new THREE.Group();
    wContainer.position.set(0.3, -0.3, -0.6);
    camera.add(wContainer);
    scene.add(camera);

    let stockMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 1.2), new THREE.MeshStandardMaterial({ color: curWeapon.wood }));
    let barrelMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 8), new THREE.MeshStandardMaterial({ color: curWeapon.metal }));
    barrelMesh.rotation.x = Math.PI / 2;
    barrelMesh.position.set(0, 0.02, -0.8);
    wContainer.add(stockMesh, barrelMesh);

    const flash = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ color: 0xffaa00, side: THREE.DoubleSide }));
    flash.position.set(0, 0.05, -1.3);
    flash.visible = false;
    wContainer.add(flash);

    function makeBuilding(x, z) {
        const bg = new THREE.Group(); bg.position.set(x, 0, z); scene.add(bg);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x8c7853 });
        const walls = [
            new THREE.Mesh(new THREE.BoxGeometry(8, 3, 0.5), wallMat),
            new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 8.5), wallMat),
            new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 8.5), wallMat),
            new THREE.Mesh(new THREE.BoxGeometry(2.5, 3, 0.5), wallMat),
            new THREE.Mesh(new THREE.BoxGeometry(2.5, 3, 0.5), wallMat) 
        ];
        walls[0].position.set(0, 1.5, -4);
        walls[1].position.set(-4, 1.5, 0);
        walls[2].position.set(4, 1.5, 0);
        walls[3].position.set(2.75, 1.5, 4);
        walls[4].position.set(-2.75, 1.5, 4);
        walls.forEach(w => { bg.add(w); w.updateMatrixWorld(); colliders.push(w); });

        const floor2 = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.4, 7.8), wallMat);
        floor2.position.set(0, 3, 0); bg.add(floor2); floor2.updateMatrixWorld();
        floorFloors.push(floor2);

        const coverMat = new THREE.MeshStandardMaterial({ color: 0x6e5d3e });
        const coverWalls = [
            new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.8, 0.4), coverMat),
            new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 7.6), coverMat),
            new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 7.6), coverMat)
        ];
        coverWalls[0].position.set(0, 3.6, -3.7);
        coverWalls[1].position.set(-3.7, 3.6, 0);
        coverWalls[2].position.set(3.7, 3.6, 0);
        coverWalls.forEach(cw => { bg.add(cw); cw.updateMatrixWorld(); colliders.push(cw); });

        const stairMat = new THREE.MeshStandardMaterial({ color: 0x6e5034 });
        for (let i = 0; i < 6; i++) {
            let step = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 1.2), stairMat);
            step.position.set(0, 0.25 + (i * 0.5), 4.2 + ((5 - i) * 1.1));
            bg.add(step); step.updateMatrixWorld(true);
            floorFloors.push(step);
        }
    }
    buildingCoords.forEach(c => makeBuilding(...c));

    const mkDiv = (cls, txt = '') => { let d = document.createElement('div'); d.className = cls; d.innerText = txt; document.body.appendChild(d); return d; };
    const crosshairUI = mkDiv('crosshair');
    const ammoUI = mkDiv('ui-ammo'), hpUI = mkDiv('ui-health'), playerHpUI = mkDiv('ui-player-hp', 'HP: 500');
    const botStatusUI = mkDiv('bot-status');
    hpUI.style.display = 'none';

    const scoreboardUI = mkDiv('scoreboard');
    const blueScoreUI = mkDiv('score-blue');
    const redScoreUI = mkDiv('score-red');
    scoreboardUI.appendChild(blueScoreUI);
    scoreboardUI.appendChild(document.createTextNode(' - '));
    scoreboardUI.appendChild(redScoreUI);

    function updateScoreboard() {
        blueScoreUI.innerText = `BLUE: ${blueScore}`;
        redScoreUI.innerText = `RED: ${redScore}`;
    }
    updateScoreboard();

    const homeScreen = document.createElement('div');
    homeScreen.className = 'home-screen';
    homeScreen.innerHTML = `
        <div class="home-title">TACTICAL ARENA</div>
        <div class="skin-select-container">
            <button class="skin-btn selected" id="skinKingsguard">Kingsguard</button>
            <button class="skin-btn" id="skinNazi">Nazi Soldier</button>
            <button class="skin-btn" id="skinSamurai">Samurai</button>
        </div>
        <button class="home-btn" id="homeStartBtn">START GAME</button>
    `;
    document.body.appendChild(homeScreen);

    document.getElementById('skinKingsguard').onclick = () => {
        selectedOpponentSkin = 'Kingsguard';
        document.getElementById('skinKingsguard').classList.add('selected');
        document.getElementById('skinNazi').classList.remove('selected');
        document.getElementById('skinSamurai').classList.remove('selected');
    };
    document.getElementById('skinNazi').onclick = () => {
        selectedOpponentSkin = 'Nazi';
        document.getElementById('skinNazi').classList.add('selected');
        document.getElementById('skinKingsguard').classList.remove('selected');
        document.getElementById('skinSamurai').classList.remove('selected');
    };
    document.getElementById('skinSamurai').onclick = () => {
        selectedOpponentSkin = 'Samurai';
        document.getElementById('skinSamurai').classList.add('selected');
        document.getElementById('skinKingsguard').classList.remove('selected');
        document.getElementById('skinNazi').classList.remove('selected');
    };

    const homeStartBtn = document.getElementById('homeStartBtn');
    let isCountingDown = false;

    homeStartBtn.onclick = () => {
        if (!isCountingDown) {
            isCountingDown = true;
            let timeLeft = 5;
            homeStartBtn.innerText = `CANCEL (${timeLeft})`;
            homeStartBtn.classList.add('cancel');

            startCountdownTimer = setInterval(() => {
                timeLeft--;
                if (timeLeft > 0) {
                    homeStartBtn.innerText = `CANCEL (${timeLeft})`;
                } else {
                    clearInterval(startCountdownTimer);
                    startCountdownTimer = null;
                    isCountingDown = false;
                    homeScreen.style.display = 'none';
                    document.body.style.background = '#87ceeb';
                    startGameplay();
                }
            }, 1000);
        } else {
            if (startCountdownTimer) clearInterval(startCountdownTimer);
            startCountdownTimer = null;
            isCountingDown = false;
            homeStartBtn.innerText = 'START GAME';
            homeStartBtn.classList.remove('cancel');
        }
    };

    const gameOverScreen = mkDiv('', '');
    gameOverScreen.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;color:white;display:none;flex-direction:column;justify-content:center;align-items:center;font-size:36px;font-weight:bold;z-index:30000;';

    const pumpkinPickupUI = mkDiv('pumpkin-pickup', '');
    const gatlingWheelUI = mkDiv('', '');
    gatlingWheelUI.id = 'gatlingWheel';

    function resetGameMatch() {
        blueScore = 0;
        redScore = 0;
        updateScoreboard();
        playerHp = maxPlayerHp;
        playerHpUI.innerText = `HP: ${playerHp}`;
        camera.position.set((Math.random() - 0.5) * 200, 2, (Math.random() - 0.5) * 200);
        rY = 0; rX = 0; camera.rotation.set(rX, rY, 0);
       
        weaponsList = JSON.parse(JSON.stringify(defaultWeaponsList));
        curWeapon = { ...weaponsList[0] };
        stockMesh.material.color.setHex(curWeapon.wood);
        barrelMesh.material.color.setHex(curWeapon.metal);
        rebuildWeaponBar();
        updateUI();

        activePumpkinItem = null;
        gatlingGunPlaced = false;
        isHoldingGatling = false;
        if (gatlingMesh) { scene.remove(gatlingMesh); gatlingMesh = null; }
        pumpkinPickupUI.style.display = 'none';
        gatlingWheelUI.style.display = 'none';
        spawnPumpkins();
        if (bot) {
            scene.remove(bot.mesh);
            spawnBot();
        }
    }

    function startGameplay() {
        gameStarted = true;
        crosshairUI.style.display = 'block';
        ammoUI.style.display = 'block';
        hpUI.style.display = 'none';
        playerHpUI.style.display = 'block';
        scoreboardUI.style.display = 'flex';
        menuBtn.style.display = 'block';
        reloadBtnUI.style.display = 'block';
        shootBtnUI.style.display = 'block';
        zoomBtnUI.style.display = 'block';
        jumpBtnUI.style.display = 'block';
        crouchBtnUI.style.display = 'block';
        proneBtnUI.style.display = 'block';
        moveBtnUI.style.display = 'block';
        resetGameMatch();
    }

    function returnToHomeScreen() {
        gameStarted = false;
        crosshairUI.style.display = 'none';
        ammoUI.style.display = 'none';
        hpUI.style.display = 'none';
        playerHpUI.style.display = 'none';
        scoreboardUI.style.display = 'none';
        botStatusUI.style.display = 'none';
        menuBtn.style.display = 'none';
        wBar.classList.remove('open');
        reloadBtnUI.style.display = 'none';
        shootBtnUI.style.display = 'none';
        zoomBtnUI.style.display = 'none';
        jumpBtnUI.style.display = 'none';
        crouchBtnUI.style.display = 'none';
        proneBtnUI.style.display = 'none';
        moveBtnUI.style.display = 'none';
        pumpkinPickupUI.style.display = 'none';
        gatlingWheelUI.style.display = 'none';

        homeStartBtn.innerText = 'START GAME';
        homeStartBtn.classList.remove('cancel');
        document.body.style.background = '#141e28';
        homeScreen.style.display = 'flex';
    }

    function triggerGameOver(isVictory) {
        if (isDead) return;
        isDead = true;
        gameOverScreen.style.display = 'flex';
        gameOverScreen.style.background = isVictory ? 'rgba(0,0,150,0.85)' : 'rgba(150,0,0,0.85)';
        gameOverScreen.innerText = isVictory ? 'VICTORY!' : 'DEFEAT!';

        setTimeout(() => {
            isDead = false;
            gameOverScreen.style.display = 'none';
            returnToHomeScreen();
        }, 3000);
    }

    function triggerDeath() {
        isDead = true;
        activePumpkinItem = null;
        pumpkinPickupUI.style.display = 'none';
        gatlingWheelUI.style.display = 'none';
        let respawnCountdown = 5;
        botStatusUI.style.display = 'block';
        botStatusUI.innerText = `YOU DIED - RESPAWNS IN ${respawnCountdown}s`;

        let respawnInterval = setInterval(() => {
            if (!gameStarted) {
                clearInterval(respawnInterval);
                return;
            }
            respawnCountdown--;
            if (respawnCountdown > 0) {
                botStatusUI.innerText = `YOU DIED - RESPAWNS IN ${respawnCountdown}s`;
            } else {
                clearInterval(respawnInterval);
                botStatusUI.style.display = 'none';
                playerHp = maxPlayerHp;
                playerHpUI.innerText = `HP: ${playerHp}`;
                camera.position.set((Math.random() - 0.5) * 200, 2, (Math.random() - 0.5) * 200);
                rY = 0; rX = 0; camera.rotation.set(rX, rY, 0);
                isDead = false;
            }
        }, 1000);
    }

    function updateUI() { ammoUI.innerText = curWeapon.isReloading ? 'RELOADING...' : `AMMO: ${curWeapon.cur} / ${curWeapon.max}`; }
    updateUI();

    const menuBtn = mkDiv('weapon-menu-btn', 'WEAPONS ▼'), wBar = mkDiv('weapon-bar');
    menuBtn.onclick = e => { e.stopPropagation(); wBar.classList.toggle('open'); };
    window.onclick = () => wBar.classList.remove('open');

    function rebuildWeaponBar() {
        wBar.innerHTML = '';
        weaponsList.forEach(w => {
            let b = mkDiv('weapon-btn', w.name);
            b.onclick = e => {
                e.stopPropagation(); curWeapon = { ...w };
                stockMesh.material.color.setHex(w.wood); barrelMesh.material.color.setHex(w.metal);
                updateUI(); wBar.classList.remove('open');
            };
            wBar.appendChild(b);
        });
    }
    rebuildWeaponBar();

    const ac = new (window.AudioContext || window.webkitAudioContext)();
    function playSound(type) {
        if (ac.state === 'suspended') ac.resume();
        let now = ac.currentTime;
        let o = ac.createOscillator(), g = ac.createGain();
        o.connect(g); g.connect(ac.destination);

        if (type === 'shot') {
            o.type = 'triangle';
            o.frequency.setValueAtTime(180, now);
            o.frequency.exponentialRampToValueAtTime(30, now + 0.12);
            g.gain.setValueAtTime(0.3, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            o.start(now); o.stop(now + 0.12);
        } else if (type === 'bot_shot') {
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(140, now);
            o.frequency.exponentialRampToValueAtTime(25, now + 0.15);
            g.gain.setValueAtTime(0.35, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            o.start(now); o.stop(now + 0.15);
        } else if (type === 'empty') {
            o.type = 'square';
            o.frequency.setValueAtTime(800, now);
            o.frequency.setValueAtTime(600, now + 0.03);
            g.gain.setValueAtTime(0.15, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            o.start(now); o.stop(now + 0.05);
        } else if (type === 'shotgun') {
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(120, now);
            o.frequency.exponentialRampToValueAtTime(20, now + 0.25);
            g.gain.setValueAtTime(0.4, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            o.start(now); o.stop(now + 0.25);
        } else if (type === 'garand_ping') {
            o.type = 'sine';
            o.frequency.setValueAtTime(2400, now);
            o.frequency.exponentialRampToValueAtTime(2200, now + 0.3);
            g.gain.setValueAtTime(0.25, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            o.start(now); o.stop(now + 0.4);
        } else if (type === 'explosion') {
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(80, now);
            o.frequency.exponentialRampToValueAtTime(10, now + 0.8);
            g.gain.setValueAtTime(0.8, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            o.start(now); o.stop(now + 0.8);
        }
    }

    let bot = null;
    function spawnBot() {
        let botGroup = new THREE.Group();

        if (selectedOpponentSkin === 'Kingsguard') {
            let coat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.4), new THREE.MeshStandardMaterial({ color: 0x990000 })); coat.position.set(0, 1, 0);
            let hat = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.8, 12), new THREE.MeshStandardMaterial({ color: 0x111111 })); hat.position.set(0, 1.85, 0);
            let head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: 0xffdbac })); head.position.set(0, 1.35, 0);
            botGroup.add(coat, hat, head);
        } else if (selectedOpponentSkin === 'Nazi') {
            let uniform = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.4), new THREE.MeshStandardMaterial({ color: 0x2f353b })); uniform.position.set(0, 1, 0);
            let helmet = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x4a5352 })); helmet.position.set(0, 1.6, 0);
            let head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: 0xffdbac })); head.position.set(0, 1.35, 0);
            let badge1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), new THREE.MeshStandardMaterial({ color: 0xd4af37 })); badge1.position.set(-0.2, 1.2, 0.22);
            let badge2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), new THREE.MeshStandardMaterial({ color: 0xd4af37 })); badge2.position.set(0.2, 1.2, 0.22);
            botGroup.add(uniform, helmet, head, badge1, badge2);
        } else {
            let armor = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.0, 0.45), new THREE.MeshStandardMaterial({ color: 0x8b0000 })); armor.position.set(0, 1, 0);
            let helmet = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0x1c1c1c })); helmet.position.set(0, 1.7, 0);
            let head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: 0xffdbac })); head.position.set(0, 1.35, 0);
            let katana = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), new THREE.MeshStandardMaterial({ color: 0xcccccc })); katana.rotation.z = Math.PI / 6; katana.position.set(0.5, 1.0, -0.2);
            botGroup.add(armor, helmet, head, katana);
        }

        botGroup.position.set((Math.random() - 0.5) * 300, 0, (Math.random() - 0.5) * 300);
        scene.add(botGroup);

        let botWeapons = [
            { name: 'M1 Garand', fr: 400, max: 8, cur: 8, rt: 1500, dmg: 34, maxRange: 400 },
            { name: 'AK-47', fr: 150, max: 30, cur: 30, rt: 2000, dmg: 20, maxRange: 250 },
            { name: 'Winchester 1873', fr: 600, max: 12, cur: 12, rt: 2200, dmg: 55, maxRange: 400 },
            { name: 'Colt Single Action Army', fr: 500, max: 6, cur: 6, rt: 1800, dmg: 45, maxRange: 20 },
            { name: 'Mosin Nagant', fr: 900, max: 5, cur: 5, rt: 2500, dmg: 85, maxRange: 400 },
            { name: 'Thompson Submachine Gun', fr: 100, max: 30, cur: 30, rt: 2300, dmg: 18, maxRange: 20 }
        ];
        let randomBotWeapon = { ...botWeapons[Math.floor(Math.random() * botWeapons.length)] };

        bot = {
            mesh: botGroup,
            hp: 250,
            maxHp: 250,
            weapon: randomBotWeapon,
            lastShot: 0,
            isReloading: false,
            isRespawning: false,
            targetPos: new THREE.Vector3((Math.random() - 0.5) * 300, 0, (Math.random() - 0.5) * 300),
            showHpUntil: 0,
            alertTimer: 0
        };
    }
    spawnBot();    const raycaster = new THREE.Raycaster();
    const lineRaycaster = new THREE.Raycaster();

    function hasLineOfSight(fromPos, toPos) {
        let dir = new THREE.Vector3().subVectors(toPos, fromPos);
        let dist = dir.length();
        dir.normalize();
        lineRaycaster.set(fromPos, dir);
        lineRaycaster.far = dist;
        let obstacles = [...colliders, ...treeMeshes];
        let hits = lineRaycaster.intersectObjects(obstacles, true);
        return hits.length === 0;
    }

    function triggerPumpkinExplosion(p) {
        if (!p.active) return;
        p.active = false;
        playSound('explosion');

        let expGeo = new THREE.RingGeometry(0.1, 30, 32);
        let expMat = new THREE.MeshBasicMaterial({ color: 0xff4500, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
        let expRing = new THREE.Mesh(expGeo, expMat);
        expRing.rotation.x = -Math.PI / 2;
        expRing.position.copy(p.mesh.position);
        expRing.position.y = 0.1;
        scene.add(expRing);
        p.explosionMesh = expRing;
        p.explosionTimer = performance.now() + 3000;

        let pDist = camera.position.distanceTo(p.mesh.position);
        if (pDist <= 30 && !isInvincible && !isDead) {
            playerHp = 0;
            playerHpUI.innerText = `HP: 0`;
            redScore++;
            updateScoreboard();
            if (redScore >= 10) {
                triggerGameOver(false);
            } else {
                triggerDeath();
            }
        }

        if (bot && bot.hp > 0 && !bot.isRespawning) {
            let bDist = bot.mesh.position.distanceTo(p.mesh.position);
            if (bDist <= 30) {
                bot.hp = 0;
                bot.isRespawning = true;
                scene.remove(bot.mesh);
                blueScore++;
                updateScoreboard();
                if (blueScore >= 10) {
                    triggerGameOver(true);
                } else {
                    let respawnCountdown = 5;
                    botStatusUI.style.display = 'block';
                    botStatusUI.innerText = `BOT DEFEATED - RESPAWNS IN ${respawnCountdown}s`;
                    let respawnInterval = setInterval(() => {
                        if (!gameStarted || isDead) { clearInterval(respawnInterval); return; }
                        respawnCountdown--;
                        if (respawnCountdown > 0) {
                            botStatusUI.innerText = `BOT DEFEATED - RESPAWNS IN ${respawnCountdown}s`;
                        } else {
                            clearInterval(respawnInterval);
                            botStatusUI.style.display = 'none';
                            spawnBot();
                        }
                    }, 1000);
                }
            }
        }

        scene.remove(p.mesh);
    }

    function shoot() {
        if (!gameStarted || isDead || curWeapon.isReloading || !bot || bot.isRespawning) return;
        let now = performance.now();

        if (curWeapon.cur <= 0) {
            if (now - (curWeapon.last || 0) >= 400) {
                curWeapon.last = now;
                playSound('empty');
            }
            return;
        }

        if (now - (curWeapon.last || 0) >= curWeapon.fr) {
            curWeapon.last = now;
            curWeapon.cur--;
            updateUI();

            if (curWeapon.name === 'Bazooka') {
                playSound('explosion');
                bot.hp = 0;
                bot.isRespawning = true;
                scene.remove(bot.mesh);
                blueScore++;
                updateScoreboard();
                if (blueScore >= 10) { triggerGameOver(true); return; }
                let respawnCountdown = 5;
                botStatusUI.style.display = 'block';
                botStatusUI.innerText = `BOT DEFEATED - RESPAWNS IN ${respawnCountdown}s`;
                let respawnInterval = setInterval(() => {
                    if (!gameStarted || isDead) { clearInterval(respawnInterval); return; }
                    respawnCountdown--;
                    if (respawnCountdown > 0) {
                        botStatusUI.innerText = `BOT DEFEATED - RESPAWNS IN ${respawnCountdown}s`;
                    } else {
                        clearInterval(respawnInterval);
                        botStatusUI.style.display = 'none';
                        spawnBot();
                    }
                }, 1000);
                activePumpkinItem = null;
                weaponsList = JSON.parse(JSON.stringify(defaultWeaponsList));
                rebuildWeaponBar();
                curWeapon = { ...weaponsList[0] };
                updateUI();
                return;
            } else if (curWeapon.name === 'Flare Gun') {
                playSound('shot');
                bot.hp = 0;
                bot.isRespawning = true;
                scene.remove(bot.mesh);
                blueScore++;
                updateScoreboard();
                if (blueScore >= 10) { triggerGameOver(true); return; }
                let respawnCountdown = 5;
                botStatusUI.style.display = 'block';
                botStatusUI.innerText = `BOT DEFEATED - RESPAWNS IN ${respawnCountdown}s`;
                let respawnInterval = setInterval(() => {
                    if (!gameStarted || isDead) { clearInterval(respawnInterval); return; }
                    respawnCountdown--;
                    if (respawnCountdown > 0) {
                        botStatusUI.innerText = `BOT DEFEATED - RESPAWNS IN ${respawnCountdown}s`;
                    } else {
                        clearInterval(respawnInterval);
                        botStatusUI.style.display = 'none';
                        spawnBot();
                    }
                }, 1000);
                activePumpkinItem = null;
                weaponsList = JSON.parse(JSON.stringify(defaultWeaponsList));
                rebuildWeaponBar();
                curWeapon = { ...weaponsList[0] };
                updateUI();
                return;
            } else if (curWeapon.type === 'shotgun') {
                playSound('shotgun');
            } else {
                playSound('shot');
            }

            if (curWeapon.name === 'M1 Garand' && curWeapon.cur === 0) {
                playSound('garand_ping');
            }

            flash.visible = true;
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
           
            let targets = [bot.mesh];
            pumpkins.forEach(p => { if (p.active) targets.push(p.mesh); });

            let hits = raycaster.intersectObjects(targets, true);
            if (hits.length > 0) {
                let hitObj = hits[0].object;
                let distance = camera.position.distanceTo(hits[0].point);
                if (distance <= curWeapon.maxRange) {

                    let hitPumpkin = pumpkins.find(p => p.active && (p.mesh === hitObj || p.mesh.children.includes(hitObj)));
                    if (hitPumpkin) {
                        let finalDmg = Math.max(1, Math.round(curWeapon.dmg * (1 - (distance / curWeapon.maxRange))));
                        hitPumpkin.hp -= finalDmg;
                        if (hitPumpkin.hp <= 0) {
                            triggerPumpkinExplosion(hitPumpkin);
                        }
                        return;
                    }

                    if (bot && bot.hp > 0 && !bot.isRespawning) {
                        bot.alertTimer = performance.now() + 5000;
                        let finalDamage = Math.max(1, Math.round(curWeapon.dmg * (1 - (distance / curWeapon.maxRange))));
                        bot.hp -= finalDamage;
                        bot.showHpUntil = performance.now() + 3000;
                        if (bot.hp <= 0 && !bot.isRespawning) {
                            bot.isRespawning = true;
                            scene.remove(bot.mesh);
                            bot.hp = 0;
                            hpUI.style.display = 'none';

                            blueScore++;
                            updateScoreboard();

                            if (blueScore >= 10) {
                                triggerGameOver(true);
                                return;
                            }

                            let respawnCountdown = 5;
                            botStatusUI.style.display = 'block';
                            botStatusUI.innerText = `BOT DEFEATED - RESPAWNS IN ${respawnCountdown}s`;

                            let respawnInterval = setInterval(() => {
                                if (!gameStarted || isDead) {
                                    clearInterval(respawnInterval);
                                    return;
                                }
                                respawnCountdown--;
                                if (respawnCountdown > 0) {
                                    botStatusUI.innerText = `BOT DEFEATED - RESPAWNS IN ${respawnCountdown}s`;
                                } else {
                                    clearInterval(respawnInterval);
                                    botStatusUI.style.display = 'none';
                                    spawnBot();
                                }
                            }, 1000);
                        }
                    }
                }
            }
        }
    }    let moving = false, shooting = false, verticalVelocity = 0, isJumping = false;
    const mkBtn = (id, txt, cb) => {
        let b = mkDiv('', txt); b.id = id;
        b.ontouchstart = b.onmousedown = e => { e.preventDefault(); if (gameStarted && !isDead) cb(true); };
        b.ontouchend = b.onmouseup = e => { e.preventDefault(); cb(false); };
        return b;
    };
    const shootBtnUI = mkBtn('shootBtn', 'SHOOT', v => shooting = v);
    const moveBtnUI = mkBtn('moveBtn', 'MOVE', v => moving = v);

    let zoomBtnUI = mkDiv('', 'ZOOM'); zoomBtnUI.id = 'zoomBtn';
    zoomBtnUI.ontouchstart = zoomBtnUI.onmousedown = e => {
        e.preventDefault();
        if (!gameStarted || isDead) return;
        isZoomed = !isZoomed;
        camera.fov = isZoomed ? 35 : 75;
        camera.updateProjectionMatrix();
        zoomBtnUI.style.background = isZoomed ? 'rgba(0,150,255,0.8)' : 'rgba(100,100,100,0.8)';
    };

    let jumpBtnUI = mkDiv('', 'JUMP'); jumpBtnUI.id = 'jumpBtn';
    jumpBtnUI.ontouchstart = jumpBtnUI.onmousedown = e => {
        e.preventDefault();
        if (gameStarted && !isDead && !isJumping && currentStance === 'stand') { verticalVelocity = 0.15; isJumping = true; }
    };

    let crouchBtnUI = mkDiv('', 'CROUCH'); crouchBtnUI.id = 'crouchBtn';
    crouchBtnUI.ontouchstart = crouchBtnUI.onmousedown = e => {
        e.preventDefault();
        if (gameStarted && !isDead) currentStance = currentStance === 'crouch' ? 'stand' : 'crouch';
    };

    let proneBtnUI = mkDiv('', 'PRONE'); proneBtnUI.id = 'proneBtn';
    proneBtnUI.ontouchstart = proneBtnUI.onmousedown = e => {
        e.preventDefault();
        if (gameStarted && !isDead) currentStance = currentStance === 'prone' ? 'stand' : 'prone';
    };

    const reloadBtnUI = mkBtn('reloadBtn', 'RELOAD', () => {
        if (gameStarted && !isDead && !curWeapon.isReloading) {
            curWeapon.isReloading = true; updateUI();
            setTimeout(() => { curWeapon.cur = curWeapon.max; curWeapon.isReloading = false; updateUI(); }, curWeapon.rt);
        }
    });

    pumpkinPickupUI.onclick = () => {
        if (!activePumpkinItem) return;
        if (activePumpkinItem === 'Gatling Gun') {
            if (!gatlingGunPlaced && !isHoldingGatling) {
                isHoldingGatling = true;
                pumpkinPickupUI.innerText = 'PLACE GATLING GUN';
            } else if (isHoldingGatling) {
                isHoldingGatling = false;
                gatlingGunPlaced = true;
                gatlingBullets = 100;
                gatlingMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), new THREE.MeshStandardMaterial({ color: 0x444444 }));
                gatlingMesh.position.copy(camera.position);
                gatlingMesh.position.y = 0.5;
                scene.add(gatlingMesh);
                pumpkinPickupUI.innerText = 'MOVE GATLING GUN';
                gatlingWheelUI.style.display = 'block';
            } else if (gatlingGunPlaced && camera.position.distanceTo(gatlingMesh.position) <= gatlingPickupDistance) {
                gatlingGunPlaced = false;
                isHoldingGatling = true;
                scene.remove(gatlingMesh);
                gatlingMesh = null;
                gatlingWheelUI.style.display = 'none';
                pumpkinPickupUI.innerText = 'PLACE GATLING GUN';
            }
        } else {
            let specialWeapon = activePumpkinItem === 'Bazooka' ?
                { name: 'Bazooka', fr: 1000, max: 1, cur: 1, rt: 3000, dmg: 500, maxRange: 500, type: 'rifle', wood: 0x222222, metal: 0x111111 } :
                { name: 'Flare Gun', fr: 1000, max: 1, cur: 1, rt: 3000, dmg: 500, maxRange: 500, type: 'pistol', wood: 0x8b0000, metal: 0x330000 };
           
            weaponsList.push(specialWeapon);
            curWeapon = { ...specialWeapon };
            rebuildWeaponBar();
            updateUI();
            activePumpkinItem = null;
            pumpkinPickupUI.style.display = 'none';
        }
    };

    let wheelStartX = 0, wheelStartY = 0, lastAngle = 0, totalWheelRotations = 0;
    gatlingWheelUI.ontouchstart = e => {
        let t = e.touches[0];
        let rect = gatlingWheelUI.getBoundingClientRect();
        wheelStartX = rect.left + rect.width / 2;
        wheelStartY = rect.top + rect.height / 2;
        lastAngle = Math.atan2(t.clientY - wheelStartY, t.clientX - wheelStartX);
        totalWheelRotations = 0;
    };
    gatlingWheelUI.ontouchmove = e => {
        e.preventDefault();
        if (!gatlingGunPlaced || gatlingBullets <= 0 || !bot || bot.isRespawning) return;
        let t = e.touches[0];
        let currentAngle = Math.atan2(t.clientY - wheelStartY, t.clientX - wheelStartX);
        let diff = currentAngle - lastAngle;
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;
        totalWheelRotations += Math.abs(diff);
        lastAngle = currentAngle;

        if (totalWheelRotations >= Math.PI * 2) {
            totalWheelRotations = 0;
            gatlingBullets--;
            playSound('shot');
            let distToBot = gatlingMesh.position.distanceTo(bot.mesh.position);
            if (distToBot <= 500) {
                bot.hp -= 50;
                bot.showHpUntil = performance.now() + 3000;
                bot.alertTimer = performance.now() + 5000;
                if (bot.hp <= 0 && !bot.isRespawning) {
                    bot.isRespawning = true;
                    scene.remove(bot.mesh);
                    blueScore++;
                    updateScoreboard();
                    if (blueScore >= 10) { triggerGameOver(true); return; }
                    let respawnCountdown = 5;
                    botStatusUI.style.display = 'block';
                    botStatusUI.innerText = `BOT DEFEATED - RESPAWNS IN ${respawnCountdown}s`;
                    let respawnInterval = setInterval(() => {
                        if (!gameStarted || !gatlingGunPlaced) { clearInterval(respawnInterval); return; }
                        respawnCountdown--;
                        if (respawnCountdown > 0) {
                            botStatusUI.innerText = `BOT DEFEATED - RESPAWNS IN ${respawnCountdown}s`;
                        } else {
                            clearInterval(respawnInterval);
                            botStatusUI.style.display = 'none';
                            spawnBot();
                        }
                    }, 1000);
                }
            }
            if (gatlingBullets <= 0) {
                gatlingGunPlaced = false;
                scene.remove(gatlingMesh);
                gatlingMesh = null;
                gatlingWheelUI.style.display = 'none';
                pumpkinPickupUI.style.display = 'none';
            }
        }
    };

    let tX = 0, tY = 0;
    window.ontouchmove = e => {
        if (!gameStarted || isDead) return;
        let t = e.touches[0];
        rY -= (t.clientX - tX) * 0.005; camera.rotation.y = rY;
        rX = Math.max(-1.5, Math.min(1.5, rX - (t.clientY - tY) * 0.005)); camera.rotation.x = rX;
        tX = t.clientX; tY = t.clientY;
    };
    window.ontouchstart = e => { if (gameStarted && !isDead && e.touches.length) { tX = e.touches[0].clientX; tY = e.touches[0].clientY; } };

    let hpVec = new THREE.Vector3();

    function animate() {
        requestAnimationFrame(animate);
        flash.visible = false;
        if (!gameStarted || isDead) {
            renderer.render(scene, camera);
            return;
        }

        if (shooting) shoot();

        let moveSpeed = currentStance === 'prone' ? 0.03 : (currentStance === 'crouch' ? 0.06 : 0.1);

        if (moving) {
            let nx = camera.position.x - Math.sin(camera.rotation.y) * moveSpeed;
            let nz = camera.position.z - Math.cos(camera.rotation.y) * moveSpeed;
            let hitBoxHeight = currentStance === 'prone' ? 0.6 : (currentStance === 'crouch' ? 1.0 : 1.5);
            let ok = true, nextBox = new THREE.Box3(new THREE.Vector3(nx - 0.3, camera.position.y - hitBoxHeight, nz - 0.3), new THREE.Vector3(nx + 0.3, camera.position.y + hitBoxHeight, nz + 0.3));
            for (let c of colliders) {
                if (nextBox.intersectsBox(new THREE.Box3().setFromObject(c))) { ok = false; break; }
            }
            if (ok) { camera.position.x = nx; camera.position.z = nz; }
        }

        if (isHoldingGatling && gatlingMesh) {
            gatlingMesh.position.copy(camera.position);
            gatlingMesh.position.y = 0.5;
        }

        if (isJumping) {
            camera.position.y += verticalVelocity;
            verticalVelocity -= 0.01;
        }

        let now = performance.now();
        pumpkins.forEach(p => {
            if (p.explosionTimer && now >= p.explosionTimer) {
                if (p.explosionMesh) { scene.remove(p.explosionMesh); p.explosionMesh = null; }
                p.explosionTimer = 0;
            }
            if (p.active && bot && bot.hp > 0 && !bot.isRespawning) {
                let pDist = bot.mesh.position.distanceTo(p.mesh.position);
                if (pDist <= 50) {
                    let hasSight = hasLineOfSight(bot.mesh.position, p.mesh.position);
                    if (hasSight && now - bot.lastShot >= bot.weapon.fr) {
                        bot.lastShot = now;
                        playSound('bot_shot');
                        p.hp -= 20;
                        if (p.hp <= 0) triggerPumpkinExplosion(p);
                    }
                }
            }
        });

        let nearbyPumpkin = pumpkins.find(p => p.active && camera.position.distanceTo(p.mesh.position) <= 5);
        if (nearbyPumpkin && !activePumpkinItem && !isHoldingGatling && !gatlingGunPlaced) {
            activePumpkinItem = nearbyPumpkin.item;
            pumpkinPickupUI.innerText = nearbyPumpkin.name;
            pumpkinPickupUI.style.display = 'block';
        } else if (gatlingGunPlaced && camera.position.distanceTo(gatlingMesh.position) <= gatlingPickupDistance) {
            pumpkinPickupUI.innerText = 'MOVE GATLING GUN';
            pumpkinPickupUI.style.display = 'block';
        } else if (isHoldingGatling) {
            pumpkinPickupUI.innerText = 'PLACE GATLING GUN';
            pumpkinPickupUI.style.display = 'block';
        } else if (!nearbyPumpkin && !isHoldingGatling && !gatlingGunPlaced) {
            pumpkinPickupUI.style.display = 'none';
        }

        if (bot && bot.hp > 0 && !bot.isRespawning) {
            let distToPlayer = bot.mesh.position.distanceTo(camera.position);

            let effectiveVisionRange = 120;
            if (currentStance === 'crouch') effectiveVisionRange = 50;
            if (currentStance === 'prone') effectiveVisionRange = 20;

            let botDir = new THREE.Vector3(0, 0, -1).applyQuaternion(bot.mesh.quaternion);
            let toPlayerDir = new THREE.Vector3().subVectors(camera.position, bot.mesh.position).normalize();
            let lookDot = botDir.dot(toPlayerDir);

            let hasSight = hasLineOfSight(bot.mesh.position, camera.position);
            let isAlerted = bot.alertTimer && now < bot.alertTimer;

            if ((distToPlayer < effectiveVisionRange && lookDot > 0.3 && hasSight) || isAlerted) {
                let targetLookPos = isAlerted ? camera.position : camera.position;
                bot.mesh.lookAt(targetLookPos.x, bot.mesh.position.y, targetLookPos.z);
               
                if (distToPlayer > 5 && (hasSight || isAlerted)) {
                    let dir = new THREE.Vector3().subVectors(camera.position, bot.mesh.position).normalize();
                    bot.mesh.position.addScaledVector(dir, 0.04);
                }

                if (distToPlayer <= bot.weapon.maxRange && now - bot.lastShot >= bot.weapon.fr && !bot.isReloading) {
                    if (bot.weapon.cur > 0) {
                        bot.weapon.cur--;
                        bot.lastShot = now;
                        playSound('bot_shot');
                        if (!isInvincible && !isDead) {
                            let damage = Math.max(1, Math.round((bot.weapon.dmg * 0.4) * (1 - (distToPlayer / bot.weapon.maxRange))));
                            playerHp -= damage;
                            playerHpUI.innerText = `HP: ${Math.max(0, playerHp)}`;
                            if (playerHp <= 0 && !isDead) {
                                redScore++;
                                updateScoreboard();
                                if (redScore >= 10) {
                                    triggerGameOver(false);
                                    return;
                                }
                                triggerDeath();
                            }
                        }
                    } else if (!bot.isReloading) {
                        bot.isReloading = true;
                        setTimeout(() => { bot.weapon.cur = bot.weapon.max; bot.isReloading = false; }, bot.weapon.rt);
                    }
                }
            } else {
                if (bot.mesh.position.distanceTo(bot.targetPos) < 5) {
                    bot.targetPos.set((Math.random() - 0.5) * 300, 0, (Math.random() - 0.5) * 300);
                }
                bot.mesh.lookAt(bot.targetPos);
                let dir = new THREE.Vector3().subVectors(bot.targetPos, bot.mesh.position).normalize();
                bot.mesh.position.addScaledVector(dir, 0.02);
            }
        }

        let targetCamY = currentStance === 'prone' ? 0.6 : (currentStance === 'crouch' ? 1.2 : 2.0);

        for (let floorObj of floorFloors) {
            let b = new THREE.Box3().setFromObject(floorObj);
            if (camera.position.x >= b.min.x - 0.2 && camera.position.x <= b.max.x + 0.2 &&
                camera.position.z >= b.min.z - 0.2 && camera.position.z <= b.max.z + 0.2) {
                let surfaceTop = b.max.y + targetCamY;
                if (camera.position.y >= b.max.y - 0.4 && camera.position.y < surfaceTop + 1.2) {
                    if (surfaceTop > targetCamY) targetCamY = surfaceTop;
                }
            }
        }

        if (!isJumping) {
            camera.position.y += (targetCamY - camera.position.y) * 0.3;
        } else if (camera.position.y <= targetCamY) {
            camera.position.y = targetCamY;
            isJumping = false;
            verticalVelocity = 0;
        }

        if (bot && bot.hp > 0 && !bot.isRespawning && bot.showHpUntil && performance.now() < bot.showHpUntil) {
            hpUI.style.display = 'block';
            hpVec.set(bot.mesh.position.x, bot.mesh.position.y + 2.3, bot.mesh.position.z).project(camera);
            hpUI.style.left = `${(hpVec.x * .5 + .5) * innerWidth}px`;
            hpUI.style.top = `${(hpVec.y * -.5 + .5) * innerHeight}px`;
            hpUI.innerText = `BOT HP: ${bot.hp}`;
        } else {
            hpUI.style.display = 'none';
        }

        renderer.render(scene, camera);
    }
    animate();
                }
