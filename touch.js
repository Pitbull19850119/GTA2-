// GTA2 Pocket – Touch-Steuerung: Richtungs-Stick (zu Fuß + Auto), dezente Kontext-Knöpfe, Menü-Modus,
// aufklappbare Waffen und Extras, Neigen-Lenkung, Layout anpassen.
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
  const buzz = (ms = 10) => { try { navigator.vibrate && navigator.vibrate(ms); } catch {} };
  const store = {
    get(k, d) { try { const v = localStorage.getItem('gta2-touch-' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('gta2-touch-' + k, JSON.stringify(v)); } catch {} },
  };
  const state = () => (typeof window.GTA2_state === 'function' ? window.GTA2_state() : null);

  const css = document.createElement('style');
  css.textContent = `
  body.tc-on #topnav,body.tc-on #tools{display:none!important}
  #tc{position:fixed;inset:0;z-index:9999;pointer-events:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;
      font:600 12px system-ui,sans-serif;display:none;--sc:1;color:#fff}
  body.tc-on #tc{display:block}
  #tc .z{pointer-events:auto;touch-action:none}
  #tc .mv{position:absolute;width:calc(150px*var(--sc));height:calc(150px*var(--sc))}
  #tc .mvt{position:absolute;left:50%;top:calc(-40px*var(--sc));transform:translateX(-50%);width:34px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.2);font-size:15px;color:rgba(255,255,255,.85)}
  #tc .dpad{position:absolute;inset:0;display:none}
  #tc.dpadmode .dpad{display:block}
  #tc.dpadmode .stick{display:none}
  #tc .dpad i{position:absolute;width:34%;height:34%;border-radius:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);
      display:flex;align-items:center;justify-content:center;font-style:normal;font-size:calc(18px*var(--sc));color:rgba(255,255,255,.8)}
  #tc .dpad i.on{background:rgba(255,122,0,.6)}
  #tc .dpad .u{left:33%;top:0}#tc .dpad .d{left:33%;bottom:0}#tc .dpad .l{left:0;top:33%}#tc .dpad .r{right:0;top:33%}
  #tc .stick{position:absolute;inset:0;border-radius:50%;
      background:radial-gradient(circle,rgba(255,255,255,.07),rgba(255,255,255,.02) 70%);border:1px solid rgba(255,255,255,.14)}
  #tc .knob{position:absolute;left:50%;top:50%;width:38%;height:38%;transform:translate(-50%,-50%);border-radius:50%;
      background:rgba(255,255,255,.22);box-shadow:0 0 0 1px rgba(255,255,255,.25);pointer-events:none;transition:background .15s}
  #tc .stick.act .knob{background:rgba(255,122,0,.55)}
  #tc .pad{position:absolute;width:calc(190px*var(--sc));height:calc(170px*var(--sc))}
  #tc .b{position:absolute;border-radius:50%;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.05;
      background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.85);
      font-size:calc(11px*var(--sc));backdrop-filter:blur(2px);transition:background .1s,transform .1s}
  #tc .b.on{background:rgba(255,122,0,.6);color:#fff;transform:scale(.94)}
  #tc .b.main{width:calc(78px*var(--sc));height:calc(78px*var(--sc));right:0;bottom:0;background:rgba(255,46,77,.22);border-color:rgba(255,46,77,.45);font-size:calc(13px*var(--sc))}
  #tc .b.mid{width:calc(58px*var(--sc));height:calc(58px*var(--sc))}
  #tc .b.sm{width:calc(42px*var(--sc));height:calc(42px*var(--sc));font-size:calc(15px*var(--sc))}
  #tc .b.k-enter{right:calc(88px*var(--sc));bottom:calc(6px*var(--sc))}
  #tc .b.k-jump{right:calc(10px*var(--sc));bottom:calc(88px*var(--sc))}
  #tc .b.k-horn{right:calc(80px*var(--sc));bottom:calc(80px*var(--sc))}
  #tc .b.k-wpn{right:calc(150px*var(--sc));bottom:calc(76px*var(--sc))}
  #tc .wpn{position:absolute;right:calc(146px*var(--sc));bottom:calc(124px*var(--sc));display:none;gap:6px}
  #tc .wpn.open{display:flex}
  #tc .wpn .b{position:static}
  #tc .b.k-rev{right:calc(160px*var(--sc));bottom:calc(4px*var(--sc))}
  #tc:not(.car) .k-horn,#tc:not(.car) .k-rev{display:none}
  /* Menü-Modus (Titelmenü, Pausen-Menüs): nur OK / Zurück */
  #tc .menu{position:absolute;right:calc(20px + env(safe-area-inset-right));bottom:calc(24px + env(safe-area-inset-bottom));display:none;gap:12px;align-items:flex-end}
  #tc.inmenu .menu{display:flex}
  #tc.inmenu .pad{display:none}
  #tc .menu .b{position:static}
  #tc .menu .ok{width:92px;height:92px;font-size:20px;background:rgba(255,122,0,.35);border-color:rgba(255,122,0,.7)}
  #tc .menu .esc{width:58px;height:58px;font-size:12px}
  /* Extras: aufklappbar oben rechts */
  #tc .top{position:absolute;top:calc(8px + env(safe-area-inset-top));right:calc(8px + env(safe-area-inset-right));display:flex;gap:6px;align-items:flex-start}
  #tc .s{padding:7px 10px;border-radius:9px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.9)}
  #tc .s.on{background:rgba(255,122,0,.75);color:#111}
  #tc .more{display:none;flex-direction:column;gap:6px;position:absolute;top:38px;right:0;padding:8px;border-radius:12px;background:rgba(0,0,0,.7)}
  #tc .more.open{display:flex}
  #tc.hide .mv,#tc.hide .pad,#tc.hide .menu{display:none}
  #tc .toast{position:absolute;left:50%;top:22%;transform:translateX(-50%);padding:10px 16px;border-radius:10px;
      background:rgba(0,0,0,.75);opacity:0;transition:opacity .25s;pointer-events:none}
  #tc .toast.show{opacity:1}
  #tc.edit .mv,#tc.edit .pad{outline:2px dashed #2ef2ff;outline-offset:6px}
  #tc .editbar{position:absolute;left:50%;top:40%;transform:translateX(-50%);display:none;gap:10px;align-items:center;padding:10px 14px;border-radius:12px;background:rgba(0,0,0,.8)}
  #tc.edit .editbar{display:flex}
  #tc .editbar input{width:140px}`;
  document.head.appendChild(css);

  const root = document.createElement('div');
  root.id = 'tc';
  root.innerHTML = `
    <div class="top">
      <div class="s z" data-k="KeyM">🗺</div>
      <div class="s z" id="tc-more">☰</div>
      <div class="more z">
        <div class="s z" data-k="Escape">Menü</div>
        <div class="s z" data-k="KeyT">📻 Radio</div>
        <div class="s z" data-k="F5">💾 Speichern</div>
        <div class="s z" id="tc-tilt">📱 Neigen</div>
        <div class="s z" id="tc-edit">✥ Anpassen</div>
        <div class="s z" id="tc-toggle">⌨︎ ausblenden</div>
      </div>
    </div>
    <div class="mv z"><div class="mvt z" id="tc-mvt">✚</div><div class="stick z"><div class="knob"></div></div>
      <div class="dpad z"><i class="u">▲</i><i class="d">▼</i><i class="l">◀</i><i class="r">▶</i></div></div>
    <div class="pad z">
      <div class="b z main" data-k="KeyL" id="tc-fire">Kampf</div>
      <div class="b z mid k-enter" data-k="Enter" data-foot="Ein-<br>steigen" data-car="Aus-<br>steigen">Ein-<br>steigen</div>
      <div class="b z mid k-jump" data-k="Space" data-foot="Sprung" data-car="Hand-<br>bremse">Sprung</div>
      <div class="b z sm k-horn" data-k="KeyI">📯</div>
      <div class="b z mid k-rev" id="tc-rev">Rück-<br>wärts</div>
      <div class="b z sm k-wpn" id="tc-wpn">🔫</div>
      <div class="wpn"><div class="b z sm" data-k="KeyJ">◀</div><div class="b z sm" data-k="KeyK">▶</div></div>
    </div>
    <div class="menu z">
      <div class="b z esc" data-k="Escape">Zurück</div>
      <div class="b z ok" data-k="Enter">OK</div>
    </div>
    <div class="toast"></div>
    <div class="editbar z">Größe <input type="range" min="0.7" max="1.5" step="0.05" id="tc-size"> <div class="s z" id="tc-reset">Zurücksetzen</div> <div class="s z on" id="tc-done">Fertig</div></div>`;
  document.body.appendChild(root);

  const $ = (s) => root.querySelector(s);
  const mv = $('.mv'), dpad = $('.dpad'), stick = $('.stick'), knob = $('.knob'), pad = $('.pad'), toastEl = $('.toast');
  let toastT;
  const toast = (msg) => { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 1800); };

  // ---- Kontext: Menü / zu Fuß / Auto ----
  let ctx = '';
  setInterval(() => {
    const st = state();
    const now = !st || !st.hasPlayer ? 'menu' : st.inCar ? 'car' : 'foot';
    if (now === ctx) return;
    ctx = now;
    root.classList.toggle('inmenu', now === 'menu');
    root.classList.toggle('car', now === 'car');
    root.querySelectorAll('[data-foot]').forEach((el) => { el.innerHTML = now === 'car' ? el.dataset.car : el.dataset.foot; });
  }, 200);

  // ---- Waffe: ohne Waffe heißt der Knopf „Kampf“ ----
  const fireBtn = $('#tc-fire');
  setInterval(() => {
    let armed = false;
    try {
      const M = window.gta2 && window.gta2.Module;
      if (M && ctx !== 'menu') { const q = M.ccall('gta2_dev_state', 'number', [], []); armed = new Int32Array(M.HEAPU8.buffer, q, 10)[8] >= 0; }
    } catch {}
    const label = armed || ctx === 'car' ? 'Schuss' : 'Kampf';
    if (fireBtn.textContent !== label) fireBtn.textContent = label;
  }, 300);

  // ---- Aufklappen ----
  const more = $('.more'), wpn = $('.wpn');
  $('#tc-more').addEventListener('pointerdown', (e) => { e.preventDefault(); more.classList.toggle('open'); $('#tc-more').classList.toggle('on', more.classList.contains('open')); });
  let wpnT;
  $('#tc-wpn').addEventListener('pointerdown', (e) => {
    e.preventDefault(); buzz(); wpn.classList.toggle('open');
    clearTimeout(wpnT); if (wpn.classList.contains('open')) wpnT = setTimeout(() => wpn.classList.remove('open'), 4000);
  });

  // ---- Layout ----
  const DEFAULT = { sc: 1, stick: null, pad: null };
  let layout = { ...DEFAULT, ...store.get('layout2', {}) };
  const place = () => {
    root.style.setProperty('--sc', layout.sc);
    const pos = (el, p, side) => {
      el.style.left = el.style.right = el.style.top = el.style.bottom = '';
      if (p) { el.style.left = p[0] * 100 + 'vw'; el.style.top = p[1] * 100 + 'vh'; }
      else { el.style[side] = `calc(22px + env(safe-area-inset-${side}))`; el.style.bottom = 'calc(22px + env(safe-area-inset-bottom))'; }
    };
    pos(mv, layout.stick, 'left'); pos(pad, layout.pad, 'right');
  };
  place();
  $('#tc-size').value = layout.sc;
  $('#tc-size').addEventListener('input', (e) => { layout.sc = +e.target.value; place(); });
  let editing = false;
  const setEdit = (on) => {
    editing = on; root.classList.toggle('edit', on); $('#tc-edit').classList.toggle('on', on);
    if (on) { more.classList.remove('open'); toast('Stick und Knöpfe ziehen, Größe einstellen'); } else store.set('layout2', layout);
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
  dragMove(mv, 'stick'); dragMove(pad, 'pad');
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
      if (el.closest('.wpn')) { clearTimeout(wpnT); wpnT = setTimeout(() => wpn.classList.remove('open'), 4000); }
      if (el.closest('.more')) setTimeout(() => more.classList.remove('open'), 150);
    });
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  });

  // ---- Stick: Richtungs-Steuerung zu Fuß UND im Auto ----
  // heading h -> Blickrichtung (sin h, cos h), Bildschirm-y nach unten; A dreht +h, D dreht -h.
  const dirs = { up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'] };
  const setDir = (name, on, src = 'stick') => dirs[name].forEach((c) => hold(c, src, on));
  let sid = null, vec = null, reverse = false;
  const steer = () => {
    if (!vec && !reverse) { Object.keys(dirs).forEach((n) => setDir(n, false)); return; }
    const mag = vec ? Math.hypot(vec.x, vec.y) : 0, t = 0.3;
    const st = state();
    if (!st || !st.hasPlayer || (!st.inCar && !vec)) { if (!vec) { Object.keys(dirs).forEach((n) => setDir(n, false)); return; } // Menüs: Pfeiltasten
      setDir('up', vec.y < -t); setDir('down', vec.y > t); setDir('left', vec.x < -t); setDir('right', vec.x > t);
      return;
    }
    if (st.inCar && reverse) {
      setDir('up', false); setDir('down', true);
      setDir('left', !!vec && vec.x < -t); setDir('right', !!vec && vec.x > t);
      return;
    }
    if (mag < t) { Object.keys(dirs).forEach((n) => setDir(n, false)); return; }
    let diff = Math.atan2(vec.x, vec.y) - st.heading;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const tol = st.inCar ? 0.12 : 0.2;
    setDir('left', diff > tol); setDir('right', diff < -tol);
    if (st.inCar) {
      // Auto: Gas geben und dabei Richtung Stick lenken; bei fast entgegengesetzter Richtung trotzdem Gas (wendet im Bogen)
      setDir('up', true); setDir('down', false);
    } else {
      setDir('down', false); setDir('up', Math.abs(diff) < 1.3);
    }
  };
  setInterval(steer, 30);

  // ---- Rückwärts (nur im Auto, gedrückt halten; Stick links/rechts lenkt dabei) ----
  const rev = $('#tc-rev');
  rev.addEventListener('pointerdown', (e) => { if (editing) return; e.preventDefault(); rev.setPointerCapture(e.pointerId); rev.classList.add('on'); buzz(); reverse = true; steer(); });
  const revUp = (e) => { e.preventDefault(); rev.classList.remove('on'); reverse = false; steer(); };
  rev.addEventListener('pointerup', revUp); rev.addEventListener('pointercancel', revUp);
  const move = (e) => {
    const r = stick.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    const max = r.width / 2, d = Math.hypot(x, y);
    if (d > max) { x = x / d * max; y = y / d * max; }
    knob.style.transform = `translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;
    vec = { x: x / max, y: y / max }; steer();
  };
  const end = () => { sid = null; vec = null; knob.style.transform = ''; stick.classList.remove('act'); steer(); };
  stick.addEventListener('pointerdown', (e) => { if (editing) return; e.preventDefault(); sid = e.pointerId; stick.setPointerCapture(sid); stick.classList.add('act'); move(e); });
  stick.addEventListener('pointermove', (e) => { if (e.pointerId === sid && !editing) move(e); });
  stick.addEventListener('pointerup', end);
  stick.addEventListener('pointercancel', end);

  // ---- Steuerkreuz (klassisch: oben vor, unten zurück, links/rechts drehen) ----
  let dmode = store.get('dpad', false);
  const mvt = $('#tc-mvt');
  const applyMode = () => { root.classList.toggle('dpadmode', dmode); mvt.textContent = dmode ? '🕹' : '✚'; };
  applyMode();
  mvt.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation(); if (editing) return;
    dmode = !dmode; store.set('dpad', dmode); applyMode(); end(); dpEnd();
    toast(dmode ? 'Steuerkreuz' : 'Joystick');
  });
  let did = null;
  const dpKeys = { u: 'up', d: 'down', l: 'left', r: 'right' };
  const dpMove = (e) => {
    const r = dpad.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const on = { u: y < -0.33, d: y > 0.33, l: x < -0.33, r: x > 0.33 };
    for (const k in dpKeys) dpad.querySelector('.' + k).classList.toggle('on', on[k]);
    const vx = (on.r ? 1 : 0) - (on.l ? 1 : 0), vy = (on.d ? 1 : 0) - (on.u ? 1 : 0);
    vec = vx || vy ? { x: vx / Math.hypot(vx, vy), y: vy / Math.hypot(vx, vy) } : null;
    steer();
  };
  const dpEnd = () => { did = null; vec = null; for (const k in dpKeys) dpad.querySelector('.' + k).classList.remove('on'); steer(); };
  dpad.addEventListener('pointerdown', (e) => { if (editing) return; e.preventDefault(); did = e.pointerId; dpad.setPointerCapture(did); buzz(); dpMove(e); });
  dpad.addEventListener('pointermove', (e) => { if (e.pointerId === did && !editing) dpMove(e); });
  dpad.addEventListener('pointerup', dpEnd);
  dpad.addEventListener('pointercancel', dpEnd);

  // ---- Lenken durch Neigen (nur im Auto, wenn Stick nicht benutzt wird) ----
  let tiltOn = false;
  const onTilt = (e) => {
    if (!tiltOn || e.beta == null) return;
    if (ctx !== 'car' || vec) { setDir('left', false, 'tilt'); setDir('right', false, 'tilt'); setDir('up', false, 'tilt'); return; }
    const angle = (screen.orientation && screen.orientation.angle) ?? window.orientation ?? 0;
    const v = angle === 90 ? e.beta : (angle === -90 || angle === 270) ? -e.beta : e.gamma;
    setDir('left', v < -12, 'tilt'); setDir('right', v > 12, 'tilt'); setDir('up', true, 'tilt');
  };
  $('#tc-tilt').addEventListener('pointerdown', async (e) => {
    e.preventDefault();
    if (!tiltOn && typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
      try { if (await DeviceOrientationEvent.requestPermission() !== 'granted') return toast('Bewegungssensor nicht erlaubt'); }
      catch { return toast('Bewegungssensor nicht verfügbar'); }
    }
    tiltOn = !tiltOn;
    $('#tc-tilt').classList.toggle('on', tiltOn);
    if (tiltOn) { window.addEventListener('deviceorientation', onTilt); toast('Im Auto: neigen = lenken, fährt automatisch'); }
    else { window.removeEventListener('deviceorientation', onTilt); ['left', 'right', 'up'].forEach((n) => setDir(n, false, 'tilt')); }
  });

  // ---- Ausblenden ----
  const tog = $('#tc-toggle');
  tog.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    root.classList.toggle('hide');
    tog.textContent = root.classList.contains('hide') ? '🎮 einblenden' : '⌨︎ ausblenden';
  });

  // ---- Nur im Spiel zeigen ----
  const update = () => { const g = document.getElementById('game');
    document.body.classList.toggle('tc-on', !!g && !g.hidden && g.offsetParent !== null); };
  new MutationObserver(update).observe(document.body, { attributes: true, childList: true, subtree: true });
  update();

  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => { if (document.body.classList.contains('tc-on') && !(e.target.closest && e.target.closest('#xpop, #cxq, #saves, .saves, #controls-dialog, dialog, [data-scroll]'))) e.preventDefault(); }, { passive: false });
  window.addEventListener('blur', () => { for (const [c, s] of held) if (s.size) { s.clear(); fire(c, false); } });
})();
