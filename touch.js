// GTA2 Pocket – Touch-Steuerung: Stick, kontextabhängige Knöpfe, Neigen-Lenkung, Speichern, Layout anpassen.
(() => {
  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (!isTouch && !new URLSearchParams(location.search).has('touch')) return;

  const KEYINFO = {
    KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', KeyL: 'l', KeyJ: 'j', KeyK: 'k', KeyI: 'i', KeyM: 'm', KeyT: 't',
    Space: ' ', Enter: 'Enter', Escape: 'Escape', F5: 'F5',
    ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight',
  };
  const held = new Map();
  const fire = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup',
    { code, key: KEYINFO[code] || code, bubbles: true, cancelable: true }));
  const hold = (code, src, down) => {
    const set = held.get(code) || new Set();
    const was = set.size > 0;
    down ? set.add(src) : set.delete(src);
    held.set(code, set);
    if (was !== set.size > 0) fire(code, set.size > 0);
  };
  const buzz = (ms = 12) => { try { navigator.vibrate && navigator.vibrate(ms); } catch {} };
  const store = {
    get(k, d) { try { const v = localStorage.getItem('gta2-touch-' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('gta2-touch-' + k, JSON.stringify(v)); } catch {} },
  };

  const css = document.createElement('style');
  css.textContent = `
  #tc{position:fixed;inset:0;z-index:9999;pointer-events:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;
      font:600 13px system-ui,sans-serif;display:none;--sc:1}
  body.tc-on #tc{display:block}
  body.tc-on #topnav{display:none!important}
  #tc .z{pointer-events:auto;touch-action:none}
  #tc .stick{position:absolute;width:calc(170px*var(--sc));height:calc(170px*var(--sc));border-radius:50%;
      background:rgba(255,255,255,.10);border:2px solid rgba(255,255,255,.28)}
  #tc .knob{position:absolute;left:50%;top:50%;width:41%;height:41%;transform:translate(-50%,-50%);border-radius:50%;
      background:rgba(255,122,0,.6);border:2px solid rgba(255,255,255,.6);pointer-events:none}
  #tc .btns{position:absolute;display:grid;grid-template-columns:repeat(3,calc(74px*var(--sc)));gap:calc(12px*var(--sc))}
  #tc .b{width:calc(74px*var(--sc));height:calc(74px*var(--sc));border-radius:50%;background:rgba(0,0,0,.42);
      border:2px solid rgba(255,255,255,.45);color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;
      line-height:1.05;font-size:calc(13px*var(--sc))}
  #tc .b.on{background:rgba(255,122,0,.8);color:#111}
  #tc .b.big{background:rgba(255,46,77,.55)}
  #tc.car .b.carx{border-color:#2ef2ff}
  #tc .top{position:absolute;top:calc(8px + env(safe-area-inset-top));right:calc(8px + env(safe-area-inset-right));
      display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;max-width:92vw}
  #tc .s{padding:8px 11px;border-radius:9px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.4);color:#fff}
  #tc .s.on{background:rgba(255,122,0,.85);color:#111}
  #tc.hide .stick,#tc.hide .btns{display:none}
  #tc .toast{position:absolute;left:50%;top:22%;transform:translateX(-50%);padding:10px 16px;border-radius:10px;
      background:rgba(0,0,0,.75);color:#fff;opacity:0;transition:opacity .25s;pointer-events:none}
  #tc .toast.show{opacity:1}
  #tc.edit .stick,#tc.edit .btns{outline:2px dashed #2ef2ff;outline-offset:6px}
  #tc .editbar{position:absolute;left:50%;top:40%;transform:translateX(-50%);display:none;
      gap:10px;align-items:center;padding:10px 14px;border-radius:12px;background:rgba(0,0,0,.8);color:#fff}
  #tc.edit .editbar{display:flex}
  #tc .editbar input{width:140px}`;
  document.head.appendChild(css);

  const root = document.createElement('div');
  root.id = 'tc';
  root.innerHTML = `
    <div class="top">
      <div class="s z" data-k="Escape">Menü</div><div class="s z" data-k="KeyM">Karte</div>
      <div class="s z" data-k="KeyT">Radio</div><div class="s z" data-k="F5">💾 Speichern</div>
      <div class="s z" id="tc-cam">🎥 3D-Kamera</div><div class="s z" id="tc-tilt">📱 Neigen</div><div class="s z" id="tc-edit">✥ Anpassen</div>
      <div class="s z" id="tc-toggle">⌨︎ aus</div>
    </div>
    <div class="stick z"><div class="knob"></div></div>
    <div class="btns z">
      <div class="b z" data-k="KeyJ">◀<br>Waffe</div><div class="b z" data-k="KeyI">Hupe</div><div class="b z" data-k="KeyK">Waffe<br>▶</div>
      <div class="b z carx" data-k="Space" data-foot="Sprung" data-car="Hand-<br>bremse">Sprung</div>
      <div class="b z carx" data-k="Enter" data-foot="Ein-<br>steigen" data-car="Aus-<br>steigen">Ein-<br>steigen</div>
      <div class="b z big" data-k="KeyL">Schuss</div>
    </div>
    <div class="toast"></div>
    <div class="editbar z">Größe <input type="range" min="0.7" max="1.5" step="0.05" id="tc-size"> <div class="s z" id="tc-reset">Zurücksetzen</div> <div class="s z on" id="tc-done">Fertig</div></div>`;
  document.body.appendChild(root);

  const $ = (s) => root.querySelector(s);
  const stick = $('.stick'), knob = $('.knob'), btns = $('.btns'), toastEl = $('.toast');
  let toastT;
  const toast = (msg) => { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 1800); };

  // ---- Kontext: zu Fuß / im Auto ----
  let inCar = null;
  setInterval(() => {
    const now = typeof window.GTA2_inCar === 'function' ? window.GTA2_inCar() : false;
    if (now === inCar) return;
    inCar = now; root.classList.toggle('car', now);
    root.querySelectorAll('[data-foot]').forEach((el) => { el.innerHTML = now ? el.dataset.car : el.dataset.foot; });
  }, 250);

  // ---- Layout ----
  const DEFAULT = { sc: 1, stick: null, btns: null };
  let layout = { ...DEFAULT, ...store.get('layout', {}) };
  const place = () => {
    root.style.setProperty('--sc', layout.sc);
    const pos = (el, p, side) => {
      el.style.left = el.style.right = el.style.top = el.style.bottom = '';
      if (p) { el.style.left = p[0] * 100 + 'vw'; el.style.top = p[1] * 100 + 'vh'; }
      else { el.style[side] = `calc(20px + env(safe-area-inset-${side}))`; el.style.bottom = 'calc(20px + env(safe-area-inset-bottom))'; }
    };
    pos(stick, layout.stick, 'left'); pos(btns, layout.btns, 'right');
  };
  place();
  $('#tc-size').value = layout.sc;
  $('#tc-size').addEventListener('input', (e) => { layout.sc = +e.target.value; place(); });
  let editing = false;
  const setEdit = (on) => {
    editing = on; root.classList.toggle('edit', on); $('#tc-edit').classList.toggle('on', on);
    if (!on) store.set('layout', layout); else toast('Stick und Knöpfe ziehen, Größe einstellen');
  };
  const dragMove = (el, key) => {
    let start = null;
    el.addEventListener('pointerdown', (e) => {
      if (!editing) return;
      e.preventDefault(); e.stopPropagation(); el.setPointerCapture(e.pointerId);
      const r = el.getBoundingClientRect(); start = [e.clientX - r.left, e.clientY - r.top];
    }, true);
    el.addEventListener('pointermove', (e) => {
      if (!editing || !start) return;
      const x = Math.min(Math.max(e.clientX - start[0], 0), innerWidth - el.offsetWidth);
      const y = Math.min(Math.max(e.clientY - start[1], 0), innerHeight - el.offsetHeight);
      layout[key] = [x / innerWidth, y / innerHeight]; place();
    }, true);
    el.addEventListener('pointerup', () => { start = null; }, true);
  };
  dragMove(stick, 'stick'); dragMove(btns, 'btns');
  $('#tc-edit').addEventListener('pointerdown', (e) => { e.preventDefault(); setEdit(!editing); });
  $('#tc-done').addEventListener('pointerdown', (e) => { e.preventDefault(); setEdit(false); });
  $('#tc-reset').addEventListener('pointerdown', (e) => { e.preventDefault(); layout = { ...DEFAULT }; $('#tc-size').value = 1; place(); });

  // ---- Knöpfe ----
  root.querySelectorAll('[data-k]').forEach((el) => {
    const code = el.dataset.k;
    const up = (e) => { e.preventDefault(); el.classList.remove('on'); hold(code, el, false); };
    el.addEventListener('pointerdown', (e) => {
      if (editing) return;
      e.preventDefault(); el.setPointerCapture(e.pointerId); el.classList.add('on'); buzz(); hold(code, el, true);
    });
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  });

  // ---- Stick ----
  // Zu Fuß (normale Kamera): Figur läuft in die Richtung, in die der Stick zeigt.
  // Im Auto oder mit 3D-Kamera: oben = Gas, unten = Bremse/rückwärts, links/rechts = lenken.
  const dirs = { up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'] };
  const setDir = (name, on, src = 'stick') => dirs[name].forEach((c) => hold(c, src, on));
  let sid = null, vec = null; // vec: {x,y} in -1..1, Bildschirm-y nach unten
  let cam3d = false;
  const menuOpen = () => !(window.GTA2_state && window.GTA2_state() && window.GTA2_state().hasPlayer);
  const steer = () => {
    if (!vec) { Object.keys(dirs).forEach((n) => setDir(n, false)); return; }
    const mag = Math.hypot(vec.x, vec.y), t = 0.32;
    const st = window.GTA2_state && window.GTA2_state();
    const absolute = st && st.hasPlayer && !st.inCar && !cam3d;
    if (!absolute) {
      setDir('up', vec.y < -t); setDir('down', vec.y > t); setDir('left', vec.x < -t); setDir('right', vec.x > t);
      return;
    }
    // Richtungs-Steuerung: heading h -> Blickrichtung (sin h, cos h); A dreht +h, D dreht -h
    setDir('down', false);
    if (mag < t) { setDir('up', false); setDir('left', false); setDir('right', false); return; }
    const want = Math.atan2(vec.x, vec.y);
    let diff = want - st.heading;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const tol = 0.2;
    setDir('left', diff > tol); setDir('right', diff < -tol);
    setDir('up', Math.abs(diff) < 1.3);
  };
  setInterval(steer, 30);
  const move = (e) => {
    const r = stick.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    const max = r.width / 2, d = Math.hypot(x, y);
    if (d > max) { x = x / d * max; y = y / d * max; }
    knob.style.transform = `translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;
    vec = { x: x / max, y: y / max }; steer();
  };
  const end = () => { sid = null; vec = null; knob.style.transform = ''; steer(); };
  stick.addEventListener('pointerdown', (e) => { if (editing) return; e.preventDefault(); sid = e.pointerId; stick.setPointerCapture(sid); move(e); });
  stick.addEventListener('pointermove', (e) => { if (e.pointerId === sid && !editing) move(e); });
  stick.addEventListener('pointerup', end);
  stick.addEventListener('pointercancel', end);

  // ---- 3D-Kamera: geneigt und mitdrehend (Blick immer in Laufrichtung) ----
  let camRot = 0;
  const camBtn = $('#tc-cam');
  const camLoop = () => {
    const cv = document.getElementById('screen');
    if (cv) {
      if (cam3d) {
        const st = window.GTA2_state && window.GTA2_state();
        if (st && st.hasPlayer) {
          let target = st.heading - Math.PI;
          let d = Math.atan2(Math.sin(target - camRot), Math.cos(target - camRot));
          camRot += d * 0.12;
        }
        cv.style.transformOrigin = '50% 50%';
        cv.style.transform = `perspective(1800px) rotateX(34deg) scale(1.6) rotateZ(${(-camRot * 180 / Math.PI).toFixed(2)}deg)`;
      } else if (cv.style.transform) cv.style.transform = '';
    }
    requestAnimationFrame(camLoop);
  };
  requestAnimationFrame(camLoop);
  cam3d = store.get('cam3d', false);
  camBtn.classList.toggle('on', cam3d);
  camBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault(); cam3d = !cam3d; store.set('cam3d', cam3d); camBtn.classList.toggle('on', cam3d);
    toast(cam3d ? '3D-Kamera an – Stick oben = vorwärts' : '3D-Kamera aus');
  });

  // ---- Lenken durch Neigen (nur im Auto) ----
  let tiltOn = false;
  const onTilt = (e) => {
    if (!tiltOn || e.beta == null) return;
    if (!inCar) { setDir('left', false, 'tilt'); setDir('right', false, 'tilt'); return; }
    const angle = (screen.orientation && screen.orientation.angle) ?? window.orientation ?? 0;
    const v = angle === 90 ? e.beta : (angle === -90 || angle === 270) ? -e.beta : e.gamma;
    setDir('left', v < -12, 'tilt'); setDir('right', v > 12, 'tilt');
  };
  $('#tc-tilt').addEventListener('pointerdown', async (e) => {
    e.preventDefault();
    if (!tiltOn && typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
      try { if (await DeviceOrientationEvent.requestPermission() !== 'granted') return toast('Bewegungssensor nicht erlaubt'); }
      catch { return toast('Bewegungssensor nicht verfügbar'); }
    }
    tiltOn = !tiltOn;
    $('#tc-tilt').classList.toggle('on', tiltOn);
    if (tiltOn) { window.addEventListener('deviceorientation', onTilt); toast('Im Auto: Gerät neigen zum Lenken'); }
    else { window.removeEventListener('deviceorientation', onTilt); setDir('left', false, 'tilt'); setDir('right', false, 'tilt'); }
  });

  // ---- Ausblenden ----
  const tog = $('#tc-toggle');
  tog.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    root.classList.toggle('hide');
    tog.textContent = root.classList.contains('hide') ? '🎮 an' : '⌨︎ aus';
  });

  // ---- Nur im Spiel zeigen ----
  const update = () => { const g = document.getElementById('game');
    document.body.classList.toggle('tc-on', !!g && !g.hidden && g.offsetParent !== null); };
  new MutationObserver(update).observe(document.body, { attributes: true, childList: true, subtree: true });
  update();

  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => { if (document.body.classList.contains('tc-on')) e.preventDefault(); }, { passive: false });
  window.addEventListener('blur', () => { for (const [c, s] of held) if (s.size) { s.clear(); fire(c, false); } });
})();
