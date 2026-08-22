const loadScript = src => { let s = document.createElement('script'); s.src = src; document.head.appendChild(s); return s; };
let three = loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
three.onload = initGame;

function initGame() {
    let isDead = false, currentStance = 'stand', playerHp = 100;

    const style = document.createElement('style');
    style.innerHTML = `
        body { background: #87ceeb; font-family: sans-serif; margin: 0; overflow: hidden; user-select: none; }
        .crosshair { position: absolute; top: 50%; left: 50%; width: 10px; height: 10px; background: #fff; border: 2px solid #000; border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none; }
        .ui-ammo { position: absolute; bottom: 110px; left: 30px; color: #fff; font-size: 18px; font-weight: bold; text-shadow: 2px 2px #000; }
        .ui-player-hp { position: absolute; top: 20px; left: 20px; color: #ff3333; font-size: 20px; font-weight: bold; text-shadow: 2px 2px #000; }
        .ui-health { position: absolute; color: red; font-size: 14px; font-weight: bold; text-shadow: 1px 1px #000; transform: translate(-50%, -50%); pointer-events: none; }
        .weapon-menu-btn { position: absolute; top: 15px; left: 50%; transform: translateX(-50%); padding: 8px 16px; background: rgba(0,0,0,0.8); color: #fff; font-size: 12px; font-weight: bold; border-radius: 6px; cursor: pointer; z-index: 10; }
        .weapon-bar { position: absolute; top: 55px; left: 50%; transform: translateX(-50%); display: none; flex-direction: column; gap: 4px; background: rgba(0,0,0,0.6); padding: 8px; border-radius: 6px; z-index: 10; max-height: 70vh; overflow-y: auto; }
        .weapon-bar.open { display: flex; }
        .weapon-btn { padding: 6px 12px; background: rgba(50,50,50,0.9); color: #fff; font-size: 11px; font-weight: bold; border-radius: 4px; cursor: pointer; text-align: center; width: 90px; }
        #reloadBtn { position: absolute; bottom: 95px; left: 30px; padding: 10px 20px; background: rgba(0,0,255,0.7); color: #fff; font-size: 12px; font-weight: bold; border-radius: 8px; cursor: pointer; }
        #shootBtn { position: absolute; bottom: 30px; left: 30px; padding: 20px 30px; background: rgba(255,0,0,0.8); color: #fff; font-size: 14px; font-weight: bold; border-radius: 10px; cursor: pointer; }
        #jumpBtn { position: absolute; bottom: 95px; right: 130px; padding: 15px; background: rgba(0,180,0,0.8); color: #fff; font-size: 12px; font-weight: bold; border-radius: 8px; cursor: pointer; }
        #crouchBtn { position: absolute; bottom: 95px; right: 220px; padding: 15px; background: rgba(180,100,0,0.8); color: #fff; font-size: 12px; font-weight: bold; border-radius: 8px; cursor: pointer; }
        #proneBtn { position: absolute; bottom: 30px; right: 130px; padding: 20px 15px; background: rgba(100,50,150,0.8); color: #fff; font-size: 12px; font-weight: bold; border-radius: 10px; cursor: pointer; }
        #moveBtn { position: absolute; bottom: 30px; right: 30px; padding: 20px 25px; background: rgba(255,255,255,0.8); color: #000; font-size: 14px; font-weight: bold; border-radius: 10px; cursor: pointer; }
    `;
    document.head.appendChild(style);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
    // Safe open field spawn away from structures
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
    const tMat = new THREE.MeshStandardMaterial({ color: 0x2e4d1e }), trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
    for (let i = 0; i < 60; i++) {
        let x = (Math.random() - 0.5) * 400, z = (Math.random() - 0.5) * 400;
        let t = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 4, 6), trunkMat); t.position.set(x, 2, z);
        let l = new THREE.Mesh(new THREE.DodecahedronGeometry(3), tMat); l.position.set(x, 5, z);
        scene.add(t, l);
    }

    const weaponsList = [
        { name: 'M1', fr: 400, max: 8, cur: 8, rt: 1500, dmg: 34, maxRange: 400, wood: 0x6e4726, metal: 0x222222 },
        { name: 'AK', fr: 150, max: 30, cur: 30, rt: 2000, dmg: 20, maxRange: 250, wood: 0x5c4033, metal: 0x333333 },
        { name: 'Win 73', fr: 600, max: 12, cur: 12, rt: 2200, dmg: 55, maxRange: 400, wood: 0x7c5230, metal: 0x1c1c1c },
        { name: 'Colt', fr: 500, max: 6, cur: 6, rt: 1800, dmg: 45, maxRange: 20, wood: 0x8b5a2b, metal: 0x444444 },
        { name: 'Mosin', fr: 900, max: 5, cur: 5, rt: 2500, dmg: 85, maxRange: 400, wood: 0x5a3d28, metal: 0x2a2a2a },
        { name: 'Win 92', fr: 500, max: 12, cur: 12, rt: 2200, dmg: 50, maxRange: 400, wood: 0x754822, metal: 0x111111 },
        { name: 'Win 97', fr: 700, max: 5, cur: 5, rt: 2500, dmg: 75, maxRange: 20, wood: 0x613f1d, metal: 0x383838 },
        { name: 'Mauser', fr: 850, max: 5, cur: 5, rt: 2400, dmg: 80, maxRange: 400, wood: 0x50351d, metal: 0x1f1f1f },
        { name: 'Lee', fr: 350, max: 10, cur: 10, rt: 2000, dmg: 75, maxRange: 400, wood: 0x69482b, metal: 0x2d2d2d },
        { name: 'Rem 870', fr: 650, max: 6, cur: 6, rt: 2200, dmg: 90, maxRange: 20, wood: 0x4a3219, metal: 0x404040 }
    ];
    let curWeapon = { ...weaponsList[0] };

    const wContainer = new THREE.Group();
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

    const colliders = [], floorFloors = [];

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
    mkDiv('crosshair');
    const ammoUI = mkDiv('ui-ammo'), hpUI = mkDiv('ui-health'), playerHpUI = mkDiv('ui-player-hp', 'HP: 100');
    hpUI.style.display = 'none';

    const deathScreen = mkDiv('', 'YOU DIED');
    deathScreen.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(150,0,0,0.8);color:white;display:none;flex-direction:column;justify-content:center;align-items:center;font-size:32px;font-weight:bold;z-index:9999;';

    function triggerDeath() {
        if (isDead) return;
        isDead = true; deathScreen.style.display = 'flex';
        setTimeout(() => {
            isDead = false; deathScreen.style.display = 'none';
            playerHp = 100; playerHpUI.innerText = 'HP: 100';
            // Randomize respawn location safely across the map
            camera.position.set((Math.random() - 0.5) * 200, 2, (Math.random() - 0.5) * 200);
            rY = 0; rX = 0; camera.rotation.set(rX, rY, 0);
            curWeapon.cur = curWeapon.max; updateUI();
        }, 3000);
    }

    function updateUI() { ammoUI.innerText = curWeapon.isReloading ? 'RELOADING...' : `AMMO: ${curWeapon.cur} / ${curWeapon.max}`; }
    updateUI();

    const menuBtn = mkDiv('weapon-menu-btn', 'WEAPONS ▼'), wBar = mkDiv('weapon-bar');
    menuBtn.onclick = e => { e.stopPropagation(); wBar.classList.toggle('open'); };
    window.onclick = () => wBar.classList.remove('open');

    weaponsList.forEach(w => {
        let b = mkDiv('weapon-btn', w.name);
        b.onclick = e => {
            e.stopPropagation(); curWeapon = { ...w };
            stockMesh.material.color.setHex(w.wood); barrelMesh.material.color.setHex(w.metal);
            updateUI(); wBar.classList.remove('open');
        };
        wBar.appendChild(b);
    });

    const ac = new (window.AudioContext || window.webkitAudioContext)();
    function sound(f, t) {
        if (ac.state === 'suspended') ac.resume();
        let o = ac.createOscillator(), g = ac.createGain();
        o.frequency.setValueAtTime(f, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + t);
        o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + t);
    }

    const bots = [];
    for (let i = 0; i < 10; i++) {
        let g = new THREE.Group();
        let torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.4), new THREE.MeshStandardMaterial({ color: 0xcc3333 })); torso.position.set(0, 1, 0);
        let head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: 0xffdbac })); head.position.set(0, 1.7, 0);
        g.add(torso, head);
       
        let bx = (Math.random() - 0.5) * 300, bz = (Math.random() - 0.5) * 300;
        g.position.set(bx, 0, bz);
        scene.add(g);

        bots.push({
            mesh: g,
            hp: 100,
            maxHp: 100,
            weapon: { ...weaponsList[i] },
            lastShot: 0,
            isReloading: false,
            targetPos: new THREE.Vector3((Math.random() - 0.5) * 300, 0, (Math.random() - 0.5) * 300)
        });
    }

    const raycaster = new THREE.Raycaster();
    function shoot() {
        if (isDead || curWeapon.isReloading || curWeapon.cur <= 0) return;
        let now = performance.now();
        if (now - (curWeapon.last || 0) >= curWeapon.fr) {
            curWeapon.last = now; curWeapon.cur--; updateUI();
            sound(200, 0.1); flash.visible = true;
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
            let hits = raycaster.intersectObjects(bots.map(b => b.mesh), true);
            if (hits.length > 0) {
                let distance = camera.position.distanceTo(hits[0].point);
                if (distance <= curWeapon.maxRange) {
                    let finalDamage = Math.max(1, Math.round(curWeapon.dmg * (1 - (distance / curWeapon.maxRange))));
                    let hitBot = bots.find(b => b.mesh === hits[0].object.parent || b.mesh === hits[0].object);
                    if (hitBot) {
                        hitBot.hp -= finalDamage;
                        hitBot.showHpUntil = performance.now() + 3000;
                        if (hitBot.hp <= 0) {
                            scene.remove(hitBot.mesh);
                            bots.splice(bots.indexOf(hitBot), 1);
                        }
                    }
                }
            }
        }
    }

    let moving = false, shooting = false, verticalVelocity = 0, isJumping = false;
    const mkBtn = (id, txt, cb) => {
        let b = mkDiv('', txt); b.id = id;
        b.ontouchstart = b.onmousedown = e => { e.preventDefault(); if (!isDead) cb(true); };
        b.ontouchend = b.onmouseup = e => { e.preventDefault(); cb(false); };
    };
    mkBtn('shootBtn', 'SHOOT', v => shooting = v);
    mkBtn('moveBtn', 'MOVE', v => moving = v);

    let jumpBtn = mkDiv('', 'JUMP'); jumpBtn.id = 'jumpBtn';
    jumpBtn.ontouchstart = jumpBtn.onmousedown = e => {
        e.preventDefault();
        if (!isDead && !isJumping && currentStance === 'stand') { verticalVelocity = 0.15; isJumping = true; }
    };

    let crouchBtn = mkDiv('', 'CROUCH'); crouchBtn.id = 'crouchBtn';
    crouchBtn.ontouchstart = crouchBtn.onmousedown = e => {
        e.preventDefault();
        if (!isDead) currentStance = currentStance === 'crouch' ? 'stand' : 'crouch';
    };

    let proneBtn = mkDiv('', 'PRONE'); proneBtn.id = 'proneBtn';
    proneBtn.ontouchstart = proneBtn.onmousedown = e => {
        e.preventDefault();
        if (!isDead) currentStance = currentStance === 'prone' ? 'stand' : 'prone';
    };

    mkBtn('reloadBtn', 'RELOAD', () => {
        if (!isDead && !curWeapon.isReloading) {
            curWeapon.isReloading = true; updateUI();
            setTimeout(() => { curWeapon.cur = curWeapon.max; curWeapon.isReloading = false; updateUI(); }, curWeapon.rt);
        }
    });

    let tX = 0, tY = 0;
    window.ontouchmove = e => {
        if (isDead) return;
        let t = e.touches[0];
        rY -= (t.clientX - tX) * 0.005; camera.rotation.y = rY;
        rX = Math.max(-1.5, Math.min(1.5, rX - (t.clientY - tY) * 0.005)); camera.rotation.x = rX;
        tX = t.clientX; tY = t.clientY;
    };
    window.ontouchstart = e => { if (!isDead && e.touches.length) { tX = e.touches[0].clientX; tY = e.touches[0].clientY; } };

    let hpVec = new THREE.Vector3();

    function animate() {
        requestAnimationFrame(animate);
        flash.visible = false;
        if (isDead) return;

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

        if (isJumping) {
            camera.position.y += verticalVelocity;
            verticalVelocity -= 0.01;
        }

        let now = performance.now();
        bots.forEach(bot => {
            let distToPlayer = bot.mesh.position.distanceTo(camera.position);

            if (distToPlayer < 120) {
                bot.mesh.lookAt(camera.position.x, bot.mesh.position.y, camera.position.z);
                let dir = new THREE.Vector3().subVectors(camera.position, bot.mesh.position).normalize();
                bot.mesh.position.addScaledVector(dir, 0.04);

                if (distToPlayer <= bot.weapon.maxRange && now - bot.lastShot >= bot.weapon.fr && !bot.isReloading) {
                    if (bot.weapon.cur > 0) {
                        bot.weapon.cur--;
                        bot.lastShot = now;
                        let damage = Math.max(1, Math.round(bot.weapon.dmg * (1 - (distToPlayer / bot.weapon.maxRange))));
                        playerHp -= damage;
                        playerHpUI.innerText = `HP: ${Math.max(0, playerHp)}`;
                        if (playerHp <= 0) triggerDeath();
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
        });

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

        let activeTarget = bots.find(b => b.showHpUntil && performance.now() < b.showHpUntil);
        if (activeTarget) {
            hpUI.style.display = 'block';
            hpVec.set(activeTarget.mesh.position.x, activeTarget.mesh.position.y + 2.3, activeTarget.mesh.position.z).project(camera);
            hpUI.style.left = `${(hpVec.x * .5 + .5) * innerWidth}px`;
            hpUI.style.top = `${(hpVec.y * -.5 + .5) * innerHeight}px`;
            hpUI.innerText = `BOT HP: ${activeTarget.hp}`;
        } else {
            hpUI.style.display = 'none';
        }

        renderer.render(scene, camera);
    }
    animate();
        }
