// GTA2 Pocket – Koop-Extras: Touch-Chat mit Schnellnachrichten, Punktetabelle, Einladung per QR/Teilen,
// Spaßmodi „Wettrennen“ und „Fangen (Cops & Gangster)“. Spielinfos laufen über den Lobby-Chat (§-Nachrichten).
(() => {
  const css = document.createElement('style');
  css.textContent = `
  #cx{position:fixed;right:calc(8px + env(safe-area-inset-right));top:calc(56px + env(safe-area-inset-top));z-index:9999;display:none;gap:6px;font:600 13px system-ui,sans-serif}
  body.cx-on #cx{display:flex}
  #cx .s{padding:8px 11px;border-radius:9px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.4);color:#fff;touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer}
  #cx .s.on{background:rgba(46,242,255,.85);color:#111}
  #cxq{position:fixed;right:calc(8px + env(safe-area-inset-right));top:calc(100px + env(safe-area-inset-top));z-index:9999;display:none;flex-direction:column;gap:6px;
     padding:10px;border-radius:12px;background:rgba(0,0,0,.85);font:600 14px system-ui,sans-serif;max-width:260px}
  #cxq.open{display:flex}
  #cxq button{all:unset;padding:9px 12px;border-radius:8px;background:#222;color:#fff;cursor:pointer}
  #cxq button.hd{background:#ff7a00;color:#111}
  #cxq .row{display:flex;gap:6px;flex-wrap:wrap}
  #cxhud{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top));transform:translateX(-50%);z-index:9998;display:none;align-items:center;gap:10px;
     padding:8px 14px;border-radius:12px;background:rgba(0,0,0,.7);color:#fff;font:700 15px system-ui,sans-serif;pointer-events:none}
  #cxhud.show{display:flex}
  #cxhud .arrow{display:inline-block;width:28px;height:28px;color:#2ef2ff;font-size:24px;line-height:28px;text-align:center}
  #cxbig{position:fixed;left:50%;top:35%;transform:translate(-50%,-50%);z-index:9998;font:900 clamp(28px,6vw,64px)/1.1 Bungee,Impact,sans-serif;
     color:#ffd23f;text-shadow:0 0 20px #000,3px 3px 0 #000;text-align:center;pointer-events:none;opacity:0;transition:opacity .3s}
  #cxbig.show{opacity:1}
  .cx-share{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:.6rem}
  .cx-share canvas,.cx-share img{background:#fff;padding:8px;border-radius:6px;width:150px;height:150px}`;
  document.head.appendChild(css);

  // ---------- Einladung: QR + Teilen ----------
  const qrLib = () => new Promise((res) => {
    if (window.QRCode) return res();
    const sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    sc.onload = res; sc.onerror = res; document.head.appendChild(sc);
  });
  const setupInvite = () => {
    const linkEl = document.getElementById('coop-link'), box = document.getElementById('coop-invite');
    if (!linkEl || !box || box.querySelector('.cx-share')) return;
    const wrap = document.createElement('div'); wrap.className = 'cx-share';
    const qr = document.createElement('div');
    const share = document.createElement('button'); share.type = 'button'; share.textContent = '📤 Link teilen';
    share.className = 'btn';
    share.onclick = async () => {
      const url = linkEl.value;
      try { if (navigator.share) await navigator.share({ title: 'GTA2 Pocket – Koop', text: 'Komm in meinen GTA2-Raum!', url }); else { await navigator.clipboard.writeText(url); share.textContent = 'Kopiert ✓'; } } catch {}
    };
    wrap.append(qr, share); box.appendChild(wrap);
    let last = '';
    const draw = async () => {
      if (!linkEl.value || linkEl.value === last) return;
      last = linkEl.value; await qrLib();
      qr.innerHTML = '';
      if (window.QRCode) new window.QRCode(qr, { text: last, width: 150, height: 150, correctLevel: window.QRCode.CorrectLevel.M });
    };
    setInterval(draw, 700);
  };
  setInterval(setupInvite, 1000);

  // ---------- Im Spiel ----------
  const bar = document.createElement('div'); bar.id = 'cx';
  bar.innerHTML = `<div class="s" id="cx-chat">💬 Chat</div><div class="s" id="cx-board">🏆 Tabelle</div><div class="s" id="cx-modes">🎮 Modi</div>`;
  const quick = document.createElement('div'); quick.id = 'cxq';
  const hud = document.createElement('div'); hud.id = 'cxhud';
  const big = document.createElement('div'); big.id = 'cxbig';
  document.body.append(bar, quick, hud, big);
  const QUICK = ['Hilfe! 🚨', 'Komm her!', 'Ich hol ein Auto 🚗', 'Bullen! 🚔', 'Los geht\'s!', 'GG 👍', 'Haha 😂', 'Warte kurz'];

  let bigT;
  const shout = (msg, ms = 2500) => { big.innerHTML = msg; big.classList.add('show'); clearTimeout(bigT); bigT = setTimeout(() => big.classList.remove('show'), ms); };
  const C = () => window.GTA2_coop;
  const players = () => { try { return C().view.players().filter((p) => p.inGame); } catch { return []; } };
  const me = () => players().find((p) => p.me);
  const nameOf = (slot) => { try { return C().view.name(slot); } catch { return 'Spieler ' + (slot + 1); } };
  const send = (obj) => C() && C().lobby.sendChat('§' + JSON.stringify(obj));

  const fireKey = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code, bubbles: true }));
  const press = (el, code) => {
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.classList.add('on'); fireKey(code, true); });
    const up = (e) => { e.preventDefault(); el.classList.remove('on'); fireKey(code, false); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };
  press(bar.querySelector('#cx-board'), 'Tab');

  const openMenu = (html) => { quick.innerHTML = html; quick.classList.add('open'); };
  const closeMenu = () => quick.classList.remove('open');
  bar.querySelector('#cx-chat').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (quick.classList.contains('open')) return closeMenu();
    openMenu(`<div class="row">${QUICK.map((q) => `<button data-q="${q}">${q}</button>`).join('')}</div><button class="hd" data-type>✏️ Eigene Nachricht</button>`);
  });
  bar.querySelector('#cx-modes').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (quick.classList.contains('open')) return closeMenu();
    const host = C() && C().host;
    openMenu(host
      ? `<button class="hd" data-mode="race">🏁 Wettrennen starten</button><button class="hd" data-mode="tag">🚔 Fangen (Cops &amp; Gangster)</button><button data-mode="stop">⏹ Modus beenden</button>`
      : `<div style="color:#ccc;padding:4px">Nur der Host kann Modi starten.</div>`);
  });
  quick.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || !C()) return;
    if (b.dataset.q) { C().chat.send(b.dataset.q); closeMenu(); }
    else if ('type' in b.dataset) { closeMenu(); fireKey('KeyT', true); fireKey('KeyT', false); }
    else if (b.dataset.mode) { closeMenu(); hostStart(b.dataset.mode); }
  });

  // ---------- Spaßmodi ----------
  let game = null; // {mode, ...}
  const hostStart = (mode) => {
    if (mode === 'stop') return send({ t: 'stop' }) || apply(-1, { t: 'stop' });
    const ps = players();
    if (mode === 'race') {
      const m = me(); if (!m) return;
      const ang = Math.random() * Math.PI * 2, dist = 35 + Math.random() * 35;
      const x = Math.min(245, Math.max(10, m.x + Math.cos(ang) * dist)), y = Math.min(245, Math.max(10, m.y + Math.sin(ang) * dist));
      const msg = { t: 'race', x, y, at: Date.now() + 3500 };
      send(msg); apply(C().mySlot, msg);
    } else if (mode === 'tag') {
      if (ps.length < 2) return shout('Fangen braucht mind. 2 Spieler');
      const cop = ps[Math.floor(Math.random() * ps.length)].slot;
      const msg = { t: 'tag', cop, at: Date.now() + 3000 };
      send(msg); apply(C().mySlot, msg);
    }
  };
  const apply = (from, m) => {
    if (m.t === 'stop') { game = null; hud.classList.remove('show'); shout('Modus beendet'); }
    else if (m.t === 'race') { game = { mode: 'race', x: m.x, y: m.y, at: m.at, done: false }; shout('🏁 WETTRENNEN!<br><small>Folge dem Pfeil</small>', 3000); }
    else if (m.t === 'win') { if (game && game.mode === 'race') game.done = true; shout(`🏆 ${nameOf(m.slot)} gewinnt!`, 4000); setTimeout(() => { if (game && game.done) { game = null; hud.classList.remove('show'); } }, 4000); }
    else if (m.t === 'tag') { game = { mode: 'tag', cop: m.cop, safe: Date.now() + 3000, score: game && game.mode === 'tag' ? game.score : {} };
      shout(m.cop === C().mySlot ? '🚔 DU BIST DIE POLIZEI!<br><small>Fang die anderen</small>' : `🚔 ${nameOf(m.cop)} ist die Polizei!<br><small>Lauf!</small>`, 3000); }
    else if (m.t === 'caught') { if (!game || game.mode !== 'tag') return;
      game.score[m.by] = (game.score[m.by] || 0) + 1; game.cop = m.slot; game.safe = Date.now() + 3000;
      shout(`🚨 ${nameOf(m.slot)} verhaftet!<br><small>${nameOf(m.slot)} ist jetzt Polizei</small>`, 2500); }
  };
  const hook = () => {
    const c = C(); if (!c || c.lobby.__cx) return;
    c.lobby.__cx = true;
    const orig = c.lobby.onChat;
    c.lobby.onChat = (slot, text) => {
      if (typeof text === 'string' && text[0] === '§') { try { apply(slot, JSON.parse(text.slice(1))); } catch {} return; }
      orig && orig(slot, text);
    };
  };

  const ARROWS = '➡↘⬇↙⬅↖⬆↗';
  setInterval(() => {
    const g = document.getElementById('game');
    const on = !!C() && !!g && !g.hidden;
    document.body.classList.toggle('cx-on', on);
    if (!on) return;
    hook();
    const m = me(); if (!game || !m) { hud.classList.remove('show'); return; }
    if (game.mode === 'race') {
      if (game.done) return;
      const dx = game.x - m.x, dy = game.y - m.y, d = Math.hypot(dx, dy);
      const idx = (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;
      const wait = game.at - Date.now();
      hud.innerHTML = wait > 0 ? `Start in ${Math.ceil(wait / 1000)}…` : `<span class="arrow">${ARROWS[idx]}</span> Ziel: ${Math.round(d)} Blöcke`;
      hud.classList.add('show');
      if (wait <= 0 && d < 3) { game.done = true; const msg = { t: 'win', slot: C().mySlot }; send(msg); apply(C().mySlot, msg); }
    } else if (game.mode === 'tag') {
      const cop = players().find((p) => p.slot === game.cop);
      const iAmCop = game.cop === C().mySlot;
      const pts = Object.entries(game.score).map(([s, n]) => `${nameOf(+s)} ${n}`).join(' · ');
      if (iAmCop) {
        const prey = players().filter((p) => !p.me).map((p) => ({ p, d: Math.hypot(p.x - m.x, p.y - m.y) })).sort((a, b) => a.d - b.d)[0];
        hud.innerHTML = `🚔 Du bist Polizei${prey ? ` · nächster: ${Math.round(prey.d)} Bl.` : ''}${pts ? ' · ' + pts : ''}`;
        if (prey && prey.d < 1.3 && Date.now() > game.safe) { const msg = { t: 'caught', slot: prey.p.slot, by: C().mySlot }; send(msg); apply(C().mySlot, msg); }
      } else {
        const d = cop ? Math.round(Math.hypot(cop.x - m.x, cop.y - m.y)) : '?';
        hud.innerHTML = `🏃 Polizei: ${nameOf(game.cop)} · ${d} Bl. entfernt${pts ? ' · ' + pts : ''}`;
      }
      hud.classList.add('show');
    }
  }, 200);
})();
