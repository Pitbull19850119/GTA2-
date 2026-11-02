// GTA2 Pocket – Extras-Menü (⭐): Cheats, Teleport, Garage, Gang-Respekt, Spielmodi, Tageschallenge,
// Kinder-Modus und Erfolge. Alles jederzeit ein-/ausschaltbar. Nur Einzelspieler (im Koop ausgeblendet).
(() => {
  const ls = {
    get(k, d) { try { const v = localStorage.getItem('gta2-x-' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('gta2-x-' + k, JSON.stringify(v)); } catch {} },
  };
  const M = () => window.gta2 && window.gta2.Module;
  const call = (fn, args = []) => { try { return M().ccall(fn, 'number', args.map(() => 'number'), args); } catch { return 0; } };
  const st = () => (window.GTA2_state ? window.GTA2_state() : null);
  const rules = () => { try { return window.gta2.states.rules(); } catch { return null; } };
  const dev = () => { try { const m = M(); const q = m.ccall('gta2_dev_state', 'number', [], []); const v = new Int32Array(m.HEAPU8.buffer, q, 10);
    return { player: !!v[0], inCar: !!v[1], x: v[2] / 16384, y: v[3] / 16384, z: v[4] / 16384, speed: v[5] / 16384, carModel: v[6], weapon: v[8], ammo: v[9] }; } catch { return null; } };
  const single = () => !!(window.gta2 && window.gta2.states) && !window.GTA2_coop;
  const inGame = () => { const g = document.getElementById('game'); return !!g && !g.hidden && g.offsetParent !== null; };
  const key = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code, bubbles: true }));
  const money = (n) => '$' + Math.round(n).toLocaleString('de-AT');

  // ---------- Oberfläche ----------
  const css = document.createElement('style');
  css.textContent = `
  #xbtn{position:fixed;left:50%;top:calc(8px + env(safe-area-inset-top));transform:translateX(-50%);z-index:10000;display:none;
     padding:6px 12px;border-radius:10px;background:rgba(0,0,0,.4);border:1px solid rgba(255,210,63,.5);color:#ffd23f;font:700 13px system-ui,sans-serif;cursor:pointer;user-select:none;-webkit-user-select:none}
  body.x-on #xbtn{display:block}
  #xpop{position:fixed;inset:0;z-index:10001;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.55);font:14px system-ui,sans-serif;color:#eee}
  #xpop.open{display:flex}
  #xpop .box{width:min(560px,94vw);max-height:86vh;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y;background:#121019;border:1px solid #ff7a00;border-radius:14px;padding:14px 16px 18px;box-shadow:0 0 40px rgba(255,122,0,.25)}
  #xpop h2{margin:0 0 8px;font:20px Bungee,Impact,sans-serif;color:#ff7a00;display:flex;justify-content:space-between;align-items:center}
  #xpop h3{margin:14px 0 6px;font:13px ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:#2ef2ff}
  #xpop .x{all:unset;cursor:pointer;font-size:22px;color:#aaa;padding:0 6px}
  #xpop .row{display:flex;flex-wrap:wrap;gap:6px}
  #xpop button.b{all:unset;cursor:pointer;padding:8px 11px;border-radius:9px;background:#221d2e;border:1px solid #3b3150;color:#eee;font-size:13px}
  #xpop button.b:active{transform:scale(.97)}
  #xpop button.b.on{background:#ff7a00;color:#111;border-color:#ff7a00}
  #xpop .tg{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #221d2e}
  #xpop .tg small{display:block;color:#8d8a99;font-size:12px}
  #xpop .sw{width:44px;height:26px;border-radius:13px;background:#333;position:relative;flex:none;cursor:pointer}
  #xpop .sw::after{content:"";position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#bbb;transition:left .15s}
  #xpop .sw.on{background:#ff7a00}#xpop .sw.on::after{left:21px;background:#fff}
  #xpop .ach{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}
  #xpop .ach div{padding:7px 9px;border-radius:9px;background:#1a1624;color:#666;font-size:12px}
  #xpop .ach div.got{background:#2a2213;color:#ffd23f}
  #xpop .note{color:#8d8a99;font-size:12px;margin-top:4px}
  #xhud{position:fixed;left:50%;top:calc(46px + env(safe-area-inset-top));transform:translateX(-50%);z-index:9998;display:none;
     padding:7px 14px;border-radius:12px;background:rgba(0,0,0,.72);color:#fff;font:700 15px system-ui,sans-serif;pointer-events:none;white-space:nowrap}
  #xhud.show{display:block}
  #xbig{position:fixed;left:50%;top:32%;transform:translate(-50%,-50%);z-index:9998;font:900 clamp(26px,5.5vw,58px)/1.1 Bungee,Impact,sans-serif;
     color:#ffd23f;text-shadow:0 0 18px #000,3px 3px 0 #000;text-align:center;pointer-events:none;opacity:0;transition:opacity .3s}
  #xbig.show{opacity:1}`;
  document.head.appendChild(css);
  const btn = document.createElement('div'); btn.id = 'xbtn'; btn.textContent = '⭐ Extras';
  const pop = document.createElement('div'); pop.id = 'xpop';
  const hud = document.createElement('div'); hud.id = 'xhud';
  const big = document.createElement('div'); big.id = 'xbig';
  document.body.append(btn, pop, hud, big);
  let bigT;
  const shout = (m, ms = 2600) => { big.innerHTML = m; big.classList.add('show'); clearTimeout(bigT); bigT = setTimeout(() => big.classList.remove('show'), ms); };

  // ---------- Daten ----------
  const CARS = [[10, '🏎 Sportwagen'], [54, '🪖 Panzer'], [12, '🚓 Polizei'], [22, '🚙 Bewaffneter Jeep'], [17, '🚒 Feuerwehr'], [27, '🍦 Eiswagen'], [33, '🚘 Sportlimo'], [11, '🚌 Bus']];
  const GANGS = 10;
  const ACH = {
    car: '🚗 Erstes Auto', km10: '🛣 10 km gefahren', km100: '🏁 100 km gefahren', cops: '🚔 Polizei abgehängt', stars4: '⭐ 4 Polizistenköpfe',
    rich: '💰 $100.000 Bargeld', million: '💎 $1.000.000', hour: '⏱ 1 Stunde gespielt', frenzy: '🔥 Amoklauf-Modus beendet',
    survive60: '🛡 60 s überlebt', taxi5: '🚕 5 Fahrgäste', stunt: '🤸 Großer Stunt', daily: '📅 Tageschallenge geschafft', teleport: '✨ Teleportiert',
  };
  let ach = ls.get('ach', {});
  const award = (id) => { if (ach[id]) return; ach[id] = Date.now(); ls.set('ach', ach); shout(`🏆 Erfolg!<br><small>${ACH[id]}</small>`, 3000); };
  let stats = ls.get('stats', { km: 0, played: 0, taxi: 0 });
  const saveStats = () => ls.set('stats', stats);
  let best = ls.get('best', { frenzy: 0, survive: 0 });

  // Schalter (dauerhaft)
  const T = ls.get('toggles', { autoTp: false, kids: false, godCash: false, noCops: false, god: false });
  const setT = (k, v) => { T[k] = v; ls.set('toggles', T); };

  // ---------- Daily ----------
  const day = new Date().toISOString().slice(0, 10);
  const DAILIES = [
    { id: 'earn', text: 'Verdiene $25.000 in 3 Minuten', goal: 25000, secs: 180 },
    { id: 'drive', text: 'Fahre 3 km mit Autos', goal: 3, secs: 0 },
    { id: 'survive', text: 'Überlebe 45 s mit Polizei auf den Fersen', goal: 45, secs: 0 },
    { id: 'taxi', text: 'Bring 3 Fahrgäste ans Ziel', goal: 3, secs: 0 },
  ];
  const daily = DAILIES[[...day].reduce((a, c) => a + c.charCodeAt(0), 0) % DAILIES.length];
  let dailyState = ls.get('daily', {});
  if (dailyState.day !== day) dailyState = { day, done: false, progress: 0, started: 0, base: 0 };
  const saveDaily = () => ls.set('daily', dailyState);

  // ---------- Spielerfigur im Speicher finden (für Fahndung löschen / Unverwundbar) ----------
  let pedBase = 0;
  const pedEntry = () => { const m = M(); const q = m.ccall('gta2_dev_ped_entry', 'number', ['number'], [0]); return Array.from(new Int32Array(m.HEAPU8.buffer, q, 9)); };
  const pedOk = (base, v) => { const H = M().HEAP32; return base > 0 && H[(base + 0x248) >> 2] === v[0] && H[(base + 0x258) >> 2] === v[2] && H[(base + 0x25C) >> 2] === v[3] && H[(base + 0x278) >> 2] === v[4] && H[(base + 0x27C) >> 2] === v[5] && M().HEAPU8[base + 0x225] === (v[6] & 255); };
  const findPed = () => {
    try {
      const v = pedEntry(); if (v[2] === -1 && v[4] === -1) return 0;
      if (pedOk(pedBase, v)) return pedBase;
      const H = M().HEAP32, n = H.length - 16;
      const hits = [];
      for (let k = 0x248 >> 2; k < n; k++) {
        if (H[k] !== v[2] || H[k + 1] !== v[3] || H[k + 8] !== v[4] || H[k + 9] !== v[5]) continue;
        const base = k * 4 - 0x258;
        if (pedOk(base, v)) { hits.push(base); if (hits.length > 3) break; }
      }
      pedBase = hits.length === 1 ? hits[0] : 0;
      return pedBase;
    } catch { return 0; }
  };
  const clearWanted = () => { const b = findPed(); if (!b) return false; new Int16Array(M().HEAPU8.buffer)[(b + 0x20A) >> 1] = 0; return true; };
  const setInvuln = () => { const b = findPed(); if (!b) return false; new Uint16Array(M().HEAPU8.buffer)[(b + 0x208) >> 1] = 60000; return true; };
  window.GTA2_clearWanted = clearWanted;
  let hpCache = null, hpAt = 0;
  window.GTA2_health = () => { const now = performance.now(); if (now - hpAt > 300) { hpAt = now; try { const b = single() ? findPed() : 0; hpCache = b ? new Int16Array(M().HEAPU8.buffer)[(b + 0x216) >> 1] : null; } catch { hpCache = null; } } return hpCache; };

  // ---------- Funk ----------
  let voice = ls.get('voice', true);
  const radio = (text) => {
    shout('📻 ' + text, 3800);
    try { const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(); const g = a.createGain(); o.type = 'square'; o.frequency.value = 1400; g.gain.value = 0.04; o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.12); setTimeout(() => a.close(), 400); } catch {}
    if (!voice || !window.speechSynthesis) return;
    try { const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ' ')); u.lang = 'de-DE'; u.rate = 1.08; u.pitch = 0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch {}
  };
  const STREETS = ['am Bahnhof', 'beim Diner', 'an der Kreuzung', 'im Hinterhof', 'beim Parkhaus', 'an der Tankstelle', 'am Hafen', 'vor der Bank', 'beim Nachtclub', 'an der Brücke'];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const JOBS = {
    amb: { car: 34, name: 'Rettungsdienst' },
    cop: { car: 12, name: 'Polizei' },
    swat: { car: 52, name: 'SWAT' },
  };
  const startJob = (job) => {
    const s = st(), d = dev(); if (!s) return;
    if (d && !d.inCar) call('gta2_dev_spawn_car', [JOBS[job].car, 2, 0, 0]);
    if (job === 'swat') [1, 6, 5].forEach((k) => call('gta2_dev_give_weapon', [k, 99]));
    mode = { kind: 'job', job, phase: 'go', t: randTarget(s, 25, 60), n: 0 };
    const where = pick(STREETS);
    radio(job === 'amb' ? `Zentrale an Rettung eins: Verletzte Person ${where}. Bitte sofort hinfahren.`
      : job === 'cop' ? `Zentrale an Streife eins: Verdächtiger ${where} gemeldet. Bitte überprüfen.`
      : `Zentrale an SWAT: Bewaffnete Gang ${where}. Gebiet sichern!`);
  };
  const nextCall = (s) => {
    const job = mode.job; mode.phase = 'go'; mode.t = randTarget(s, 25, 60); mode.hold = 0;
    const where = pick(STREETS);
    setTimeout(() => radio(job === 'amb' ? `Nächster Einsatz: Notfall ${where}.` : job === 'cop' ? `Neuer Einsatz: Einbruch ${where}.` : `Neuer Einsatz: Geiselnahme ${where}.`), 3500);
  };
  const jobTick = (s, d, r) => {
    const { d: dist, a } = arrowTo(s, mode.t);
    const right = d && d.inCar && d.carModel === JOBS[mode.job].car;
    const pay = (n) => { call('gta2_dev_add_cash', [n]); stats.jobPay = (stats.jobPay || 0) + n; stats.jobs = (stats.jobs || 0) + 1; saveStats(); mode.n++; };
    if (mode.job === 'amb') {
      if (mode.phase === 'go') {
        hud.textContent = `🚑 Patient ${a} ${Math.round(dist)} Bl.${right ? '' : ' · Krankenwagen nehmen'}`;
        if (dist < 3 && right) { mode.phase = 'hosp'; mode.t = randTarget(s, 35, 75); mode.until = Date.now() + (35 + arrowTo(s, mode.t).d) * 1000; radio('Patient an Bord. Fahren Sie ins Krankenhaus, schnell!'); }
      } else {
        const left = Math.max(0, Math.ceil((mode.until - Date.now()) / 1000));
        hud.textContent = `🏥 Krankenhaus ${a} ${Math.round(dist)} Bl. · ${left}s`;
        if (!left) { radio('Patient leider verstorben. Zurück zur Wache.'); nextCall(s); }
        else if (dist < 3) { const p = 3000 + left * 60; pay(p); shout(`🏥 Gerettet! +${money(p)}`); nextCall(s); }
      }
    } else if (mode.job === 'cop') {
      if (mode.phase === 'go') {
        hud.textContent = `🚓 Einsatz ${a} ${Math.round(dist)} Bl.${right ? '' : ' · Streifenwagen nehmen'}`;
        if (dist < 4) { mode.phase = 'chase'; mode.until = Date.now() + 60000; radio('Verdächtiger flüchtet! Verfolgen und stellen!'); }
      } else {
        // Verdächtiger flieht langsam weiter
        const ang = (mode.ang = (mode.ang ?? Math.random() * 6.28) + (Math.random() - 0.5) * 0.3);
        mode.t = { x: Math.min(245, Math.max(10, mode.t.x + Math.cos(ang) * 0.12)), y: Math.min(245, Math.max(10, mode.t.y + Math.sin(ang) * 0.12)) };
        const left = Math.max(0, Math.ceil((mode.until - Date.now()) / 1000));
        const still = !d || Math.abs(d.speed) < 0.02;
        mode.hold = dist < 3 && still ? (mode.hold || 0) + 0.25 : 0;
        hud.textContent = `🚨 Verdächtiger ${a} ${Math.round(dist)} Bl. · ${left}s${dist < 3 ? ' · anhalten zum Festnehmen' : ''}`;
        if (mode.hold >= 1.5) { const p = 4000 + left * 80; pay(p); radio('Festnahme bestätigt. Gute Arbeit!'); shout(`🚔 Festgenommen! +${money(p)}`); nextCall(s); }
        else if (!left) { radio('Verdächtiger entkommen.'); nextCall(s); }
      }
    } else if (mode.job === 'swat') {
      if (mode.phase === 'go') {
        hud.textContent = `🛡 Einsatzort ${a} ${Math.round(dist)} Bl.`;
        if (dist < 5) { mode.phase = 'hold'; mode.hold = 0; for (let g = 0; g < GANGS; g++) call('gta2_dev_set_respect', [g, -100]); radio('Kontakt! Halten Sie das Gebiet zwanzig Sekunden!'); }
      } else {
        if (dist < 8) mode.hold += 0.25;
        hud.textContent = dist < 8 ? `🛡 Gebiet halten: ${Math.max(0, 20 - Math.floor(mode.hold))}s` : `🛡 Zurück ins Gebiet! ${a} ${Math.round(dist)} Bl.`;
        if (mode.hold >= 20) { for (let g = 0; g < GANGS; g++) call('gta2_dev_set_respect', [g, 0]); const p = 12000; pay(p); radio('Gebiet gesichert. Hervorragend, Team!'); shout(`🛡 Gesichert! +${money(p)}`); nextCall(s); }
      }
    }
    hud.classList.add('show');
  };

  // ---------- Modi ----------
  let mode = null; // {kind, ...}
  const stopMode = (msg) => { try { if (mode && mode.t && window.GTA2_map) window.GTA2_map.waypoint = null; } catch {} if (mode && mode.kind === 'job' && mode.job === 'swat') for (let g = 0; g < 10; g++) call('gta2_dev_set_respect', [g, 0]); mode = null; hud.classList.remove('show'); if (msg) shout(msg); };
  const startFrenzy = () => {
    const r = rules(); if (!r) return;
    [1, 2, 6, 5, 8].forEach((k) => call('gta2_dev_give_weapon', [k, 99]));
    mode = { kind: 'frenzy', end: Date.now() + 120000, base: r.cash };
    shout('🔥 AMOKLAUF!<br><small>2 Minuten – so viele Punkte wie möglich</small>');
  };
  const startSurvive = () => { mode = { kind: 'survive', start: 0 }; shout('🛡 ÜBERLEBEN<br><small>Mach Ärger – die Uhr läuft ab dem ersten Polizistenkopf</small>', 3200); };
  const randTarget = (from, min = 25, max = 60) => {
    const a = Math.random() * Math.PI * 2, d = min + Math.random() * (max - min);
    return { x: Math.min(245, Math.max(10, from.x + Math.cos(a) * d)), y: Math.min(245, Math.max(10, from.y + Math.sin(a) * d)) };
  };
  const startTaxi = () => { const s = st(); if (!s) return; mode = { kind: 'taxi', phase: 'pick', t: randTarget(s, 15, 35), served: 0 }; shout('🚕 TAXI<br><small>Hol den Fahrgast ab – folge dem Pfeil</small>'); };
  const startStunt = () => { mode = { kind: 'stunt', score: 0, air: 0, groundZ: null }; shout('🤸 STUNT-JAGD<br><small>Spring mit Autos über Rampen</small>'); };

  // ---------- Popup ----------
  const sw = (k, label, sub) => `<div class="tg"><div>${label}<small>${sub}</small></div><div class="sw ${T[k] ? 'on' : ''}" data-t="${k}"></div></div>`;
  const render = () => {
    const sp = single();
    const r = rules();
    pop.innerHTML = `<div class="box">
      <h2>⭐ Extras <button class="x" data-a="close">✕</button></h2>
      ${sp ? '' : '<div class="note">Im Koop sind nur die Erfolge verfügbar.</div>'}
      ${sp ? `
      <h3>Cheats</h3>
      <div class="row">
        <button class="b" data-a="weapons">🔫 Waffen-Paket</button>
        <button class="b" data-a="cash">💵 +$50.000</button>
        <button class="b" data-a="unlock">🗺 Alle Bezirke freischalten</button>
      </div>
      <h3>Auto herbeirufen</h3>
      <div class="row">${CARS.map(([m, n]) => `<button class="b" data-car="${m}">${n}</button>`).join('')}</div>
      <h3>Garage</h3>
      <div class="row">
        <button class="b" data-a="gsave">💾 Aktuelles Auto merken</button>
        ${ls.get('garage', null) != null ? `<button class="b" data-a="gcall">🔑 Mein Auto rufen (Modell ${ls.get('garage')})</button>` : ''}
      </div>
      <h3>Teleport</h3>
      <div class="row"><button class="b" data-a="tp">✨ Zum Wegpunkt (auf Karte setzen)</button></div>
      ${sw('autoTp', 'Automatisch teleportieren', 'Sobald du auf der Karte einen Wegpunkt setzt (nur zu Fuß)')}
      <h3>Gang-Respekt</h3>
      <div class="row">
        <button class="b" data-a="love">😇 Alle Gangs lieben dich</button>
        <button class="b" data-a="hate">😈 Alle Gangs hassen dich</button>
        <button class="b" data-a="neutral">😐 Neutral</button>
      </div>
      <h3>Spielmodi</h3>
      <div class="row">
        <button class="b ${mode && mode.kind === 'frenzy' ? 'on' : ''}" data-m="frenzy">🔥 Amoklauf (2 Min)</button>
        <button class="b ${mode && mode.kind === 'survive' ? 'on' : ''}" data-m="survive">🛡 Überleben</button>
        <button class="b ${mode && mode.kind === 'taxi' ? 'on' : ''}" data-m="taxi">🚕 Taxi</button>
        <button class="b ${mode && mode.kind === 'stunt' ? 'on' : ''}" data-m="stunt">🤸 Stunt-Jagd</button>
        ${mode ? '<button class="b" data-m="stop">⏹ Modus beenden</button>' : ''}
      </div>
      <div class="note">Rekorde: Amoklauf ${money(best.frenzy)} · Überleben ${best.survive}s · Fahrgäste gesamt ${stats.taxi}</div>
      <h3>Jobs</h3>
      <div class="row">
        <button class="b ${mode && mode.kind === 'job' && mode.job === 'amb' ? 'on' : ''}" data-j="amb">🚑 Rettungsdienst</button>
        <button class="b ${mode && mode.kind === 'job' && mode.job === 'cop' ? 'on' : ''}" data-j="cop">🚓 Polizei</button>
        <button class="b ${mode && mode.kind === 'job' && mode.job === 'swat' ? 'on' : ''}" data-j="swat">🛡 SWAT</button>
        <button class="b ${voice ? 'on' : ''}" data-a="voice">📻 Funk-Stimme ${voice ? 'an' : 'aus'}</button>
      </div>
      <div class="note">Einsatzfahrzeug wird geliefert. 📯 = Sirene. Verdienst bisher: ${money(stats.jobPay || 0)} · Einsätze: ${stats.jobs || 0}</div>
      <h3>Tageschallenge</h3>
      <div class="tg"><div>${daily.text}<small>${dailyState.done ? '✅ Heute geschafft' : 'Fortschritt: ' + Math.floor(dailyState.progress) + ' / ' + daily.goal}</small></div>
        ${dailyState.done ? '' : `<button class="b" data-a="dstart">${daily.secs ? 'Start' : 'Läuft'}</button>`}</div>
      <h3>Einstellungen</h3>
      <div class="tg"><div>🧭 Minikarte<small>Runde Karte links mit Gesundheits-Ring</small></div><div class="sw ${window.GTA2_map && window.GTA2_map.minimapOn ? 'on' : ''}" data-a="radar"></div></div>
      ${sw('noCops', '🚫 Keine Fahndung', 'Polizei sucht dich nie (in Jobs automatisch an)')}
      ${sw('god', '🛡 Unverwundbar', 'Du nimmst keinen Schaden')}
      ${sw('kids', '👶 Kinder-Modus', 'Kein Schießen und Schlagen – nur fahren und erkunden')}
      ${sw('godCash', '💸 Speichern gratis', 'Manuelles Speichern kostet nichts (Geld wird zurückgebucht)')}
      ` : ''}
      <h3>❓ Anleitung</h3>
      <details class="note" style="color:#ccc;font-size:13px;line-height:1.5"><summary style="cursor:pointer;color:#fff">So funktioniert alles</summary>
        <p><b>Steuerung:</b> Joystick/Steuerkreuz links – die Figur bzw. das Auto fährt in die Richtung, in die du drückst. Mini-Knopf darüber wechselt Joystick ↔ Steuerkreuz. Rechts: <b>Kampf/Schuss</b>, <b>Einsteigen/Aussteigen</b>, <b>Sprung/Handbremse</b>, 🔫 Waffe wechseln, im Auto 📯 Hupe/Sirene und <b>Rückwärts</b>.</p>
        <p><b>Oben rechts:</b> 🗺 Karte (antippen = Wegpunkt) und ☰ mit Menü, Radio, Speichern, Neigen-Lenkung, Knöpfe anpassen, Steuerung ausblenden.</p>
        <p><b>Speichern:</b> automatisch alle 3 Minuten, beim Verlassen und nach Aufträgen. Manuell über ☰ → 💾 (kostet Geld, außer „Speichern gratis“ ist an).</p>
        <p><b>Polizei:</b> kommt, wenn sie Verbrechen sieht – Köpfe oben zeigen die Fahndung.</p>
        <p><b>Jobs:</b> Rettungsdienst = Patient abholen und ins Krankenhaus bringen. Polizei = zum Einsatzort, Verdächtigen stellen (neben ihm anhalten), Festnahme. SWAT = zum Einsatzort und das Gebiet 20 s halten, die Gangs greifen an. Die Zentrale meldet sich per Funk.</p>
        <p><b>Spielmodi:</b> Amoklauf (2 Min Punkte sammeln), Überleben (Uhr läuft, solange du gesucht wirst), Taxi, Stunt-Jagd. Rekorde und Erfolge werden gespeichert.</p>
        <p><b>Koop:</b> Startseite → Koop → „Raum öffnen“. Unter „Mitspieler suchen“ siehst du offene Räume anderer. Im Spiel: 💬 Chat, 🏆 Tabelle, 🎮 Modi (Wettrennen, Fangen – nur Host).</p>
      </details>
      <h3>🎨 Grafik</h3>
      <div class="row">${[['0', 'Original'], ['1', 'Modern'], ['2', 'Ultra']].map(([v, n]) => `<button class="b ${String(window.GTA2_graphics ? window.GTA2_graphics() : 1) === v ? 'on' : ''}" data-gfx="${v}">${n}</button>`).join('')}</div>
      <div class="note">Modern/Ultra: echte Schatten von Gebäuden, weiche Kontaktschatten (Ambient Occlusion), Schärfe und Leuchten heller Lichter – Farben bleiben original. Ultra = stärker, braucht mehr Leistung.${window.GTA2_gfxInfo ? ' · Status: ' + (window.GTA2_gfxInfo().shadows ? '✅ Schatten aktiv' : window.GTA2_gfxInfo().post ? '⚠️ nur Schärfe (Schatten nicht unterstützt)' : '❌ nicht unterstützt') : ''}</div>
      <div class="tg"><div>✨ HD-Glättung<small>Figuren, Autos und Texturen weich statt in Pixel-Treppen</small></div><div class="sw ${window.GTA2_smooth && window.GTA2_smooth() ? 'on' : ''}" data-a="smooth"></div></div>
      <h3>📲 Spielstände übertragen (PC ↔ Handy)</h3>
      <div class="row"><button class="b" data-a="export">⬇️ Exportieren (Datei)</button><button class="b" data-a="import">⬆️ Importieren</button></div>
      <div class="note">Am einen Gerät exportieren, die Datei per AirDrop, iCloud, Mail oder USB aufs andere Gerät bringen und dort importieren. Danach auf der Startseite „Weiterspielen“.</div>
      <h3>Erfolge (${Object.keys(ach).length}/${Object.keys(ACH).length})</h3>
      <div class="ach">${Object.entries(ACH).map(([k, v]) => `<div class="${ach[k] ? 'got' : ''}">${v}</div>`).join('')}</div>
      <div class="note">Gefahren: ${stats.km.toFixed(1)} km · Gespielt: ${Math.floor(stats.played / 60)} Min${r ? ' · Bargeld: ' + money(r.cash) : ''}</div>
    </div>`;
  };
  const open = () => { render(); pop.classList.add('open'); };
  const close = () => pop.classList.remove('open');
  btn.addEventListener('click', open);
  pop.addEventListener('click', (e) => {
    if (e.target === pop) return close();
    const el = e.target.closest('[data-a],[data-car],[data-m],[data-t],[data-j],[data-gfx]'); if (!el) return;
    const a = el.dataset.a, d = dev();
    if (a === 'close') return close();
    if (a === 'weapons') { [0, 1, 2, 3, 4, 5, 6, 8, 10].forEach((k) => call('gta2_dev_give_weapon', [k, 99])); shout('🔫 Waffen-Paket!'); close(); }
    else if (a === 'cash') { call('gta2_dev_add_cash', [50000]); shout('💵 +$50.000'); }
    else if (a === 'unlock') { shout(call('gta2_dev_unlock_areas') ? '🗺 Alle Bezirke frei!<br><small>Im Hauptmenü wählbar</small>' : 'Geht nur im Spiel'); }
    else if (el.dataset.car) { if (d && d.inCar) shout('Erst aussteigen'); else if (call('gta2_dev_spawn_car', [+el.dataset.car, 2, 0, 0])) { shout('🚗 Auto ist da!'); close(); } else shout('Geht gerade nicht'); }
    else if (a === 'gsave') { if (d && d.inCar && d.carModel >= 0) { ls.set('garage', d.carModel); shout('💾 Auto gemerkt'); render(); } else shout('Setz dich erst in ein Auto'); }
    else if (a === 'gcall') { if (d && d.inCar) shout('Erst aussteigen'); else if (call('gta2_dev_spawn_car', [ls.get('garage', 10), 2, 0, 0])) { shout('🔑 Dein Auto ist da!'); close(); } }
    else if (a === 'tp') { const ok = teleport(); if (ok) close(); }
    else if (a === 'love' || a === 'hate' || a === 'neutral') { const v = a === 'love' ? 100 : a === 'hate' ? -100 : 0; for (let g = 0; g < GANGS; g++) call('gta2_dev_set_respect', [g, v]); shout(a === 'love' ? '😇 Alle lieben dich' : a === 'hate' ? '😈 Alle hassen dich' : '😐 Neutral'); }
    else if (a === 'dstart') { if (daily.id === 'earn') { const r = rules(); dailyState.started = Date.now(); dailyState.base = r ? r.cash : 0; saveDaily(); shout('📅 Los! 3 Minuten'); close(); } }
    else if (el.dataset.j) { stopMode(); startJob(el.dataset.j); close(); }
    else if (el.dataset.gfx) { if (window.GTA2_setGraphics) window.GTA2_setGraphics(+el.dataset.gfx); render(); }
    else if (a === 'export') { const b = document.getElementById('export-saves'); if (b) { b.click(); shout('⬇️ Export gestartet'); } }
    else if (a === 'import') { const i = document.getElementById('import-saves'); if (i) i.click(); }
    else if (a === 'smooth') { if (window.GTA2_setSmooth) window.GTA2_setSmooth(!window.GTA2_smooth()); render(); }
    else if (a === 'radar') { const m = window.GTA2_map; if (m) m.setMinimap(!m.minimapOn); render(); }
    else if (a === 'voice') { voice = !voice; ls.set('voice', voice); render(); }
    else if (el.dataset.m) {
      const m = el.dataset.m;
      if (m === 'stop') stopMode('Modus beendet');
      else { stopMode(); ({ frenzy: startFrenzy, survive: startSurvive, taxi: startTaxi, stunt: startStunt })[m](); close(); }
      render();
    } else if (el.dataset.t) { setT(el.dataset.t, !T[el.dataset.t]); render(); }
  });

  // ---------- Teleport ----------
  const teleport = () => {
    const map = window.GTA2_map, wp = map && map.waypoint, d = dev();
    if (!wp) { shout('Erst auf der Karte (🗺) einen Wegpunkt setzen'); return false; }
    if (d && d.inCar) { shout('Teleport nur zu Fuß'); return false; }
    if (call('gta2_dev_teleport', [Math.floor(wp.x), Math.floor(wp.y)])) { award('teleport'); shout('✨ Teleportiert!'); return true; }
    shout('Teleport geht gerade nicht'); return false;
  };
  let lastWp = null;

  // ---------- Kinder-Modus: Schießen/Schlagen blockieren ----------
  const block = (e) => { if (T.kids && single() && inGame() && (e.code === 'KeyL' || e.code === 'KeyJ' || e.code === 'KeyK')) { e.stopImmediatePropagation(); e.preventDefault(); } };
  window.addEventListener('keydown', block, true); window.addEventListener('keyup', block, true);

  // ---------- Schleife ----------
  const ARROWS = '➡↘⬇↙⬅↖⬆↗';
  const arrowTo = (s, t) => { const dx = t.x - s.x, dy = t.y - s.y; return { d: Math.hypot(dx, dy), a: ARROWS[(Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8] }; };
  let last = null, wasWanted = false, tick = 0;
  setInterval(() => {
    const on = single() && inGame();
    document.body.classList.toggle('x-on', inGame());
    if (!inGame()) return;
    const s = st(), d = dev(), r = rules();
    tick++;
    if (tick % 4 === 0) { stats.played += 1; if (stats.played >= 3600) award('hour'); if (tick % 40 === 0) saveStats(); }
    if (!on || !s || !s.hasPlayer || !r) { last = null; return; }

    // Strecke
    if (last && s.inCar) { const step = Math.hypot(s.x - last.x, s.y - last.y); if (step < 5) { stats.km += step * 0.01; if (!dailyState.done && daily.id === 'drive') dailyState.progress += step * 0.01; } }
    last = { x: s.x, y: s.y };
    if (s.inCar) award('car');
    if (stats.km >= 10) award('km10'); if (stats.km >= 100) award('km100');
    if (r.cash >= 100000) award('rich'); if (r.cash >= 1000000) award('million');
    if (r.stars >= 4) award('stars4');
    if (wasWanted && r.stars === 0 && r.player && !T.noCops && !(mode && mode.kind === 'job')) award('cops');
    wasWanted = r.stars > 0;
    if (r.stars > 0 && (T.noCops || (mode && mode.kind === 'job'))) clearWanted();
    if (T.god && tick % 4 === 0) setInvuln();

    // Speichern gratis: save() einmalig umhüllen und die Kosten zurückbuchen
    const S = window.gta2.states;
    if (S && !S.__x) {
      S.__x = true;
      const orig = S.save.bind(S);
      S.save = async (slot, o = {}) => {
        const before = (rules() || {}).cash || 0;
        const res = await orig(slot, o);
        if (T.godCash && !o.free) { const after = (rules() || {}).cash || 0; if (after < before) call('gta2_dev_add_cash', [before - after]); }
        return res;
      };
    }

    // Auto-Teleport
    const wp = window.GTA2_map && window.GTA2_map.waypoint;
    const wpKey = wp ? wp.x + ',' + wp.y : null;
    if (T.autoTp && !mode && wpKey && wpKey !== lastWp && d && !d.inCar && !(window.GTA2_map.open)) { teleport(); }
    lastWp = wpKey;

    // Tageschallenge
    if (!dailyState.done) {
      if (daily.id === 'earn' && dailyState.started) {
        dailyState.progress = Math.max(0, r.cash - dailyState.base);
        if (Date.now() - dailyState.started > daily.secs * 1000) { dailyState.started = 0; shout('📅 Zeit um – nochmal versuchen'); }
      }
      if (daily.id === 'survive') dailyState.progress = r.stars > 0 ? dailyState.progress + 0.25 : 0;
      if (dailyState.progress >= daily.goal) { dailyState.done = true; award('daily'); call('gta2_dev_add_cash', [20000]); shout('📅 Tageschallenge geschafft!<br><small>+$20.000</small>', 3500); }
      if (tick % 8 === 0) saveDaily();
    }

    // Modi
    if (!mode) { hud.classList.remove('show'); return; }
    // Ziel des Modus auf Minikarte und Karte als Wegpunkt zeigen
    const tgt = mode.t;
    if (tgt && window.GTA2_map) {
      const wpNow = window.GTA2_map.waypoint;
      if (!wpNow || Math.abs(wpNow.x - tgt.x) > 0.5 || Math.abs(wpNow.y - tgt.y) > 0.5) { window.GTA2_map.waypoint = { x: tgt.x, y: tgt.y }; lastWp = tgt.x + ',' + tgt.y; }
    }
    if (mode.kind === 'job') { jobTick(s, d, r); return; }
    if (mode.kind === 'frenzy') {
      const left = Math.max(0, Math.ceil((mode.end - Date.now()) / 1000)), pts = r.cash - mode.base;
      hud.textContent = `🔥 ${left}s · ${money(pts)}`; hud.classList.add('show');
      if (!left) { if (pts > best.frenzy) { best.frenzy = pts; ls.set('best', best); } award('frenzy'); stopMode(`🔥 Vorbei!<br><small>${money(pts)}${pts >= best.frenzy ? ' – Rekord!' : ''}</small>`); }
    } else if (mode.kind === 'survive') {
      if (!mode.start && r.stars > 0) mode.start = Date.now();
      const secs = mode.start ? Math.floor((Date.now() - mode.start) / 1000) : 0;
      hud.textContent = mode.start ? `🛡 ${secs}s überlebt · ${'👮'.repeat(r.stars)}` : '🛡 Mach Ärger, um zu starten'; hud.classList.add('show');
      if (secs >= 60) award('survive60');
      if (mode.start && r.stars === 0) { if (secs > best.survive) { best.survive = secs; ls.set('best', best); } stopMode(`🛡 Entkommen nach ${secs}s!`); }
    } else if (mode.kind === 'taxi') {
      const { d: dist, a } = arrowTo(s, mode.t);
      hud.textContent = mode.phase === 'pick' ? `🚕 Abholen ${a} ${Math.round(dist)} Bl.` : `🚕 Ziel ${a} ${Math.round(dist)} Bl. · ${Math.max(0, Math.ceil((mode.until - Date.now()) / 1000))}s`;
      hud.classList.add('show');
      if (mode.phase === 'drop' && Date.now() > mode.until) { shout('⏱ Zu spät! Neuer Fahrgast'); mode.phase = 'pick'; mode.t = randTarget(s, 15, 35); }
      else if (dist < 2.5) {
        if (mode.phase === 'pick') {
          if (!s.inCar) shout('Du brauchst ein Auto 🚗');
          else { mode.phase = 'drop'; mode.t = randTarget(s, 30, 70); mode.until = Date.now() + (40 + arrowTo(s, mode.t).d * 0.9) * 1000; shout('👤 Eingestiegen!<br><small>Bring ihn ans Ziel</small>'); }
        } else {
          const pay = 2000 + Math.round(Math.random() * 3000); call('gta2_dev_add_cash', [pay]);
          mode.served++; stats.taxi++; saveStats(); if (stats.taxi >= 5) award('taxi5');
          if (!dailyState.done && daily.id === 'taxi') dailyState.progress++;
          shout(`💵 +${money(pay)}`); mode.phase = 'pick'; mode.t = randTarget(s, 15, 35);
        }
      }
    } else if (mode.kind === 'stunt') {
      if (!d || !d.inCar) { hud.textContent = `🤸 ${money(mode.score)} · steig in ein Auto`; hud.classList.add('show'); mode.groundZ = null; return; }
      if (mode.groundZ == null || d.z < mode.groundZ) mode.groundZ = d.z;
      mode.groundZ += (d.z - mode.groundZ) * 0.02;
      const airborne = d.z - mode.groundZ > 0.6;
      if (airborne) mode.air += 0.25;
      else if (mode.air > 0) {
        if (mode.air >= 1) { const pay = Math.round(mode.air * 2500); call('gta2_dev_add_cash', [pay]); mode.score += pay; shout(`🤸 ${mode.air.toFixed(1)}s Flug!<br><small>+${money(pay)}</small>`); if (mode.air >= 2.5) award('stunt'); }
        mode.air = 0; mode.groundZ = d.z;
      }
      hud.textContent = `🤸 Stunts: ${money(mode.score)}${airborne ? ' · ✈️' : ''}`; hud.classList.add('show');
    }
  }, 250);
})();
