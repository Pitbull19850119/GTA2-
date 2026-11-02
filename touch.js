// iPad/iPhone touch controls: virtual stick + buttons, sent as keyboard events.
(() => {
  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (!isTouch && !new URLSearchParams(location.search).has('touch')) return;

  const KEYINFO = {
    KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', KeyL: 'l', KeyJ: 'j', KeyK: 'k', KeyI: 'i',
    KeyM: 'm', Space: ' ', Enter: 'Enter', Escape: 'Escape', KeyP: 'p', KeyT: 't',
    ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight',
  };
  const held = new Set();
  const send = (code, down) => {
    if (down === held.has(code)) return;
    down ? held.add(code) : held.delete(code);
    window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup',
      { code, key: KEYINFO[code] || code, bubbles: true, cancelable: true }));
  };

  const css = document.createElement('style');
  css.textContent = `
  #tc{position:fixed;inset:0;z-index:9999;pointer-events:none;user-select:none;-webkit-user-select:none;
      -webkit-touch-callout:none;font:600 13px system-ui,sans-serif;display:none}
  body.tc-on #tc{display:block}
  #tc *{pointer-events:auto;touch-action:none}
  #tc .stick{position:absolute;left:calc(24px + env(safe-area-inset-left));bottom:calc(24px + env(safe-area-inset-bottom));
      width:170px;height:170px;border-radius:50%;background:rgba(255,255,255,.10);border:2px solid rgba(255,255,255,.28)}
  #tc .knob{position:absolute;left:50%;top:50%;width:70px;height:70px;margin:-35px 0 0 -35px;border-radius:50%;
      background:rgba(245,197,24,.55);border:2px solid rgba(255,255,255,.6);pointer-events:none}
  #tc .btns{position:absolute;right:calc(20px + env(safe-area-inset-right));bottom:calc(20px + env(safe-area-inset-bottom));
      display:grid;grid-template-columns:repeat(3,74px);gap:12px}
  #tc .b{width:74px;height:74px;border-radius:50%;background:rgba(0,0,0,.42);border:2px solid rgba(255,255,255,.45);
      color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.05}
  #tc .b.on{background:rgba(245,197,24,.7);color:#111}
  #tc .b.big{background:rgba(200,40,40,.55)}
  #tc .top{position:absolute;top:calc(10px + env(safe-area-inset-top));right:calc(10px + env(safe-area-inset-right));display:flex;gap:8px}
  #tc .s{padding:9px 13px;border-radius:10px;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.4);color:#fff}
  #tc .s.on{background:rgba(245,197,24,.7);color:#111}
  #tc.hide .stick,#tc.hide .btns{display:none}`;
  document.head.appendChild(css);

  const root = document.createElement('div');
  root.id = 'tc';
  root.innerHTML = `
    <div class="top">
      <div class="s" data-k="Escape">Menü</div><div class="s" data-k="KeyM">Karte</div>
      <div class="s" data-k="KeyT">Radio</div><div class="s" id="tc-toggle">⌨︎ aus</div>
    </div>
    <div class="stick"><div class="knob"></div></div>
    <div class="btns">
      <div class="b" data-k="KeyJ">◀<br>Waffe</div><div class="b" data-k="KeyI">Hupe</div><div class="b" data-k="KeyK">Waffe<br>▶</div>
      <div class="b" data-k="Space">Sprung<br>Bremse</div><div class="b" data-k="Enter">Auto</div><div class="b big" data-k="KeyL">Schuss</div>
    </div>`;
  document.body.appendChild(root);

  // Buttons (multi-touch safe via pointer capture)
  root.querySelectorAll('[data-k]').forEach((el) => {
    const code = el.dataset.k;
    const up = (e) => { e.preventDefault(); el.classList.remove('on'); send(code, false); };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault(); el.setPointerCapture(e.pointerId); el.classList.add('on'); send(code, true);
    });
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  });

  // Stick -> W/A/S/D (game) + arrows (menus)
  const stick = root.querySelector('.stick'), knob = root.querySelector('.knob');
  let sid = null;
  const dirs = { up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'] };
  const setDir = (name, on) => dirs[name].forEach((c) => send(c, on));
  const move = (e) => {
    const r = stick.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    const max = r.width / 2, d = Math.hypot(x, y);
    if (d > max) { x = x / d * max; y = y / d * max; }
    knob.style.transform = `translate(${x}px,${y}px)`;
    const t = max * 0.32;
    setDir('up', y < -t); setDir('down', y > t); setDir('left', x < -t); setDir('right', x > t);
  };
  const end = () => {
    sid = null; knob.style.transform = '';
    Object.keys(dirs).forEach((n) => setDir(n, false));
  };
  stick.addEventListener('pointerdown', (e) => { e.preventDefault(); sid = e.pointerId; stick.setPointerCapture(sid); move(e); });
  stick.addEventListener('pointermove', (e) => { if (e.pointerId === sid) move(e); });
  stick.addEventListener('pointerup', end);
  stick.addEventListener('pointercancel', end);

  // Hide pad (e.g. with a Bluetooth keyboard/controller)
  const tog = root.querySelector('#tc-toggle');
  tog.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    root.classList.toggle('hide');
    tog.textContent = root.classList.contains('hide') ? '🎮 an' : '⌨︎ aus';
  });

  // Show only while the game screen is up (not on the landing page)
  const update = () => { const g = document.getElementById('game');
    document.body.classList.toggle('tc-on', !!g && !g.hidden && g.offsetParent !== null); };
  new MutationObserver(update).observe(document.body, { attributes: true, childList: true, subtree: true });
  update();

  // No pinch-zoom / double-tap zoom / scrolling while playing
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => { if (document.body.classList.contains('tc-on')) e.preventDefault(); }, { passive: false });
  window.addEventListener('blur', () => [...held].forEach((c) => send(c, false)));
})();
