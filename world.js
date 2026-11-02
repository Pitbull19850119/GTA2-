// GTA2 Pocket: liest Autos und Passanten (Sprite-Pool) aus dem Spielspeicher – für echte Verfolgungen/Patienten/Fahrgäste.
(() => {
  const SZ = 60, POOL = 5031;
  let anchor = 0; // Byte-Adresse eines bekannten Sprites (Spieler)
  const M = () => window.gta2 && window.gta2.Module;
  const dev = () => { const m = M(); const q = m.ccall('gta2_dev_state', 'number', [], []); return new Int32Array(m.HEAPU8.buffer, q, 10); };
  const findAnchor = () => {
    const v = dev(); if (!v[0]) return 0;
    const H = M().HEAP32, x = v[2], y = v[3];
    for (let k = 5; k < H.length - 8; k++) {
      if (H[k] === x && H[k + 1] === y && (H[k + 7] === 3 || H[k + 7] === 2)) return k * 4 - 0x14;
    }
    return 0;
  };
  const ok = (H, base) => { const t = H[(base + 0x30) >> 2]; return t >= 0 && t <= 8; };
  const scan = () => {
    const m = M(); if (!m) return null;
    const H = m.HEAP32, H16 = new Int16Array(m.HEAPU8.buffer);
    if (!anchor || !ok(H, anchor)) anchor = findAnchor();
    if (!anchor) return null;
    const cars = [], peds = [];
    const lo = Math.max(0, anchor - SZ * POOL), hi = Math.min(m.HEAPU8.length - SZ, anchor + SZ * POOL);
    for (let b = anchor - Math.floor((anchor - lo) / SZ) * SZ; b < hi; b += SZ) {
      const t = H[(b + 0x30) >> 2];
      if (t !== 2 && t !== 3) continue;
      if (!H[(b + 4) >> 2] || !H[(b + 8) >> 2]) continue; // Form + Objekt vorhanden
      const x = H[(b + 0x14) >> 2] / 16384, y = H[(b + 0x18) >> 2] / 16384;
      if (!(x > 0.5 && x < 255.5 && y > 0.5 && y < 255.5)) continue;
      const e = { id: H[(b + 8) >> 2], addr: b, x, y, z: H[(b + 0x1C) >> 2] / 16384, rot: H16[b >> 1] };
      (t === 2 ? cars : peds).push(e);
    }
    return { cars, peds };
  };
  const track = new Map(); // id -> letzte Position (für Geschwindigkeit)
  window.GTA2_world = () => {
    try {
      const w = scan(); if (!w) return null;
      const now = performance.now();
      for (const e of [...w.cars, ...w.peds]) {
        const p = track.get(e.id);
        e.speed = p ? Math.hypot(e.x - p.x, e.y - p.y) / Math.max(0.05, (now - p.t) / 1000) : 0;
        track.set(e.id, { x: e.x, y: e.y, t: now });
      }
      if (track.size > 3000) track.clear();
      return w;
    } catch { return null; }
  };
})();
