/* MIT. Original rich-text layout lives in ../src/layout.js. */
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const P = KureBookProjection;
const variants = [{ id: 'A', angle: 30, name: 'Sakin' }, { id: 'B', angle: 43.4, name: 'Dengeli' }];
const PAGE_W = 130, PAGE_H = 195, SAFE = 20.5, TEXT_W = 89, TEXT_H = 154;
const canvas = document.createElement('canvas').getContext('2d');
let inputState = structuredClone(KureDemo), model = null, activePair = 0;
let advanceCache = new Map(), boxCache = new Map();
const $ = id => document.getElementById(id);

function node(tag, attrs = {}) {
  const e = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) e.setAttribute(key, value);
  return e;
}
function measure(font, ch) {
  const key = font + '\0' + ch;
  if (!advanceCache.has(key)) { canvas.font = font; advanceCache.set(key, canvas.measureText(ch).width); }
  return advanceCache.get(key);
}
function setFont(e, g) {
  e.setAttribute('font-size', g.f.px);
  if (g.f.bold) e.setAttribute('font-weight', 'bold');
  if (g.f.italic) e.setAttribute('font-style', 'italic');
}
function localBox(g, hidden) {
  const key = [g.f.px, g.f.bold, g.f.italic, g.ch, g.bl || 0].join('\0');
  if (!boxCache.has(key)) {
    const e = node('text', { x: 0, y: -(g.bl || 0) });
    setFont(e, g); e.textContent = g.ch; hidden.append(e);
    const b = e.getBBox(); boxCache.set(key, { x: b.x, y: b.y, width: b.width, height: b.height }); e.remove();
  }
  return boxCache.get(key);
}
function union(a, b) {
  if (!a) return { ...b };
  return { minX: Math.min(a.minX, b.minX), maxX: Math.max(a.maxX, b.maxX), minY: Math.min(a.minY, b.minY), maxY: Math.max(a.maxY, b.maxY) };
}
function projectedBox(g, q) {
  const b = g.box;
  const pts = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]];
  const xs = pts.map(([x, y]) => q.x + q.a * x + q.c * y);
  const ys = pts.map(([x, y]) => q.y + q.b * x + q.d * y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}
function collectBounds(state, pages, squeeze) {
  const side = [null, null]; let all = null;
  for (const v of variants) for (let k = 0; k < 16; k++) for (const g of pages[k]) {
    const b = projectedBox(g, P.project(g, state, k, v.angle, squeeze));
    side[k % 2] = union(side[k % 2], b); all = union(all, b);
  }
  return { side, all };
}
function buildModel(fontPt, leadingPt) {
  const state = P.prepareState(inputState, fontPt, leadingPt, true);
  if (state.font !== 'Crimson Pro') throw new Error('Bu baskı aracı Crimson Pro kullanır. Diğer fontlar için editörde fontu değiştirin.');
  const hiddenSvg = node('svg', { class: 'measure' }), hidden = node('g', { class: 'art' });
  hiddenSvg.append(hidden); document.body.append(hiddenSvg);
  let pages;
  try {
    pages = Array.from({ length: 16 }, (_, k) => KureLayout.layoutPage(state, k, measure)
      .filter(g => !/^\s*$/.test(g.ch)).map(g => ({ ...g, box: localBox(g, hidden) })));
  } finally { hiddenSvg.remove(); }
  const glyphs = pages.flat();
  if (!glyphs.length || pages.every(p => !p.length)) throw new Error('Çalışmada görünür metin yok.');
  const scale = P.scaleForPointSize(fontPt, P.baseSize(state));
  const maxSigma = Math.max(...glyphs.map(g => Math.abs(g.sigma)));
  // Monotone horizontal projection; never collapse or reverse the outer glyphs.
  const maxSqueeze = maxSigma > 1e-6 ? Math.acos(.25) / maxSigma : 0;
  const fitsX = bounds => bounds.side.every(b => b && (b.maxX - b.minX) * scale <= TEXT_W);
  let squeeze = 0, bounds = collectBounds(state, pages, 0);
  if (!fitsX(bounds)) {
    if (!fitsX(collectBounds(state, pages, maxSqueeze))) {
      throw new Error(`${fontPt} pt, 20 mm sınırlarında sığmıyor. Dış gliflerde %25 yatay ölçek sınırına ulaşıldı. Puntoyu azaltın veya satırları editörde yeniden düzenleyin; otomatik küçültme yapılmadı.`);
    }
    let lo = 0, hi = maxSqueeze;
    for (let n = 0; n < 36; n++) { const mid = (lo + hi) / 2; if (fitsX(collectBounds(state, pages, mid))) hi = mid; else lo = mid; }
    squeeze = hi; bounds = collectBounds(state, pages, squeeze);
  }
  const height = (bounds.all.maxY - bounds.all.minY) * scale;
  if (height > TEXT_H + 1e-7) throw new Error(`${leadingPt.toFixed(2)} pt satır arasıyla metin ${height.toFixed(1)} mm yüksekliğinde; kullanılabilir alan 154 mm. Satır arasını veya boş satırları azaltın.`);
  const tx = bounds.side.map((b, i) => b ? 65 + 130 * i - scale * (b.minX + b.maxX) / 2 : 65 + 130 * i);
  const ty = 97.5 - scale * (bounds.all.minY + bounds.all.maxY) / 2;
  const near = glyphs.filter(g => Math.abs(g.sigma) <= 5 * Math.PI / 180);
  const outer = Math.min(...glyphs.map(g => Math.cos(squeeze * g.sigma)));
  const nearScale = near.length ? Math.min(...near.map(g => Math.cos(squeeze * g.sigma))) : null;
  return { state, pages, scale, tx, ty, bounds, squeeze, height, fontPt, leadingPt, glyphs: glyphs.length, outer, nearScale };
}
function proof(m) {
  let clearance = Math.min(m.ty + m.scale * m.bounds.all.minY, PAGE_H - m.ty - m.scale * m.bounds.all.maxY);
  for (let i = 0; i < 2; i++) if (m.bounds.side[i]) {
    clearance = Math.min(clearance, m.tx[i] + m.scale * m.bounds.side[i].minX - i * 130,
      (i + 1) * 130 - m.tx[i] - m.scale * m.bounds.side[i].maxX);
  }
  return { glyphs: m.glyphs, fontPt: m.fontPt, leadingPt: m.leadingPt, minMarginMm: clearance,
    nearSpineHorizontalPercent: m.nearScale === null ? null : m.nearScale * 100,
    outerHorizontalPercent: m.outer * 100, textHeightMm: m.height, squeeze: m.squeeze };
}
function textNode(g, vi, k) {
  const q = P.project(g, model.state, k, variants[vi].angle, model.squeeze);
  const e = node('text', { x: 0, y: -(g.bl || 0), transform: `matrix(${q.a} ${q.b} ${q.c} ${q.d} ${q.x} ${q.y})` });
  setFont(e, g); e.textContent = g.ch; return e;
}
function physicalPoint(sigma, tau, side, angle) {
  const q = P.project({ sigma, tau: tau + Math.PI / 8, hs: 1 }, model.state, 0, angle, model.squeeze);
  return [model.tx[side] + model.scale * q.x, model.ty + model.scale * q.y];
}
function createSpread(vi, row) {
  if (!model) throw new Error('Geçerli ölçülü yerleşim yok.');
  const svg = node('svg', { viewBox: '0 0 260 195', class: 'spread', 'data-variant': vi, 'data-pair': row });
  svg.append(node('rect', { width: 260, height: 195, fill: 'white' }));
  const defs = node('defs'), clip = node('clipPath', { id: `clip-${vi}-${row}` });
  clip.append(node('rect', { width: 260, height: 195 })); defs.append(clip); svg.append(defs);
  const art = node('g', { 'clip-path': `url(#clip-${vi}-${row})` }); svg.append(art);
  const dense = $('grid').checked, taus = dense ? [-.5, -.375, -.25, -.125, 0, .125, .25, .375, .5] : [-.5, 0, .5];
  const extent = Math.max(...model.pages.flat().map(g => Math.abs(g.sigma))) + .3;
  const limit = model.squeeze > 0 ? Math.min(extent, Math.PI / 2 / model.squeeze) : extent;
  const halfHeight = Math.max(Math.PI / 8, Math.max(Math.abs(model.bounds.all.minY), Math.abs(model.bounds.all.maxY)) / model.state.R);
  for (const fraction of taus) {
    const tau = fraction * 2 * halfHeight;
    for (let side = 0; side < 2; side++) {
      let d = '';
      for (let n = 0; n <= 160; n++) {
        const sigma = side ? limit * n / 160 : -limit + limit * n / 160;
        const [x, y] = physicalPoint(sigma, tau, side, variants[vi].angle);
        d += `${n ? 'L' : 'M'}${x} ${y}`;
      }
      art.append(node('path', { d, class: Math.abs(fraction) === .5 ? 'silhouette' : 'gridline' }));
    }
    const [x0, y] = physicalPoint(0, tau, 0, variants[vi].angle), [x1] = physicalPoint(0, tau, 1, variants[vi].angle);
    art.append(node('path', { d: `M${x0} ${y}L${x1} ${y}`, class: Math.abs(fraction) === .5 ? 'silhouette' : 'gridline' }));
  }
  for (let side = 0; side < 2; side++) {
    for (const f of (dense ? [.2, .4, .6, .8] : [.5])) {
      const sigma = (side ? 1 : -1) * limit * f;
      const a = physicalPoint(sigma, -halfHeight, side, variants[vi].angle), b = physicalPoint(sigma, halfHeight, side, variants[vi].angle);
      art.append(node('path', { d: `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`, class: 'gridline' }));
    }
    const k = row * 2 + side;
    const group = node('g', { class: 'art', transform: `translate(${model.tx[side]} ${model.ty}) scale(${model.scale})` });
    for (const g of model.pages[k]) group.append(textNode(g, vi, k));
    art.append(group);
  }
  svg.append(node('line', { x1: 130, x2: 130, y1: 0, y2: 195, class: 'spine' }));
  const guides = node('g', { class: 'guides' });
  for (let i = 0; i < 2; i++) guides.append(node('rect', { x: 20 + i * 130, y: 20, width: 90, height: 155, class: 'safe' }));
  svg.append(guides); return svg;
}
function applyView() {
  const v = $('view').value; document.body.classList.toggle('focus', v !== 'all');
  document.querySelectorAll('.card').forEach(e => e.classList.toggle('selected', e.dataset.variant === v));
}
function render() {
  $('cards').replaceChildren();
  variants.forEach((v, vi) => {
    const card = document.createElement('section'); card.className = 'card'; card.dataset.variant = vi;
    const h = document.createElement('h2'); h.textContent = `${v.id} · ${v.name} · ${model.fontPt} / ${model.leadingPt.toFixed(2)} pt`;
    card.append(h, createSpread(vi, activePair)); $('cards').append(card);
  }); applyView();
}
function update() {
  try {
    model = buildModel(+$('font').value, +$('leading').value); window.previewProof = proof(model);
    const p = window.previewProof;
    $('status').textContent = `${p.glyphs} glif · şirazede ${p.fontPt} pt / ${p.leadingPt.toFixed(2)} pt · en dar boşluk ${p.minMarginMm.toFixed(2)} mm · toplam metin yüksekliği ${p.textHeightMm.toFixed(1)} mm · iç 5° yatay ölçek ${p.nearSpineHorizontalPercent === null ? '—' : p.nearSpineHorizontalPercent.toFixed(1) + '%'} · en dış yatay ölçek ${p.outerHorizontalPercent.toFixed(1)}%.`;
    $('error').textContent = ''; render(); setExportEnabled(true);
    return window.previewProof;
  } catch (e) {
    model = null; window.previewProof = null; $('cards').replaceChildren(); $('status').textContent = 'Bu ayarla dışa aktarma kapalı.';
    $('error').textContent = e.message; setExportEnabled(false); return null;
  }
}
function setExportEnabled(enabled) { for (const id of ['print', 'print-all', 'svg']) $(id).disabled = !enabled; }
function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type })), a = document.createElement('a');
  a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 3000);
}
function fillHeight() {
  const originalLeading = +$('leading').value;
  let low = 8, high = 40;
  try { buildModel(+$('font').value, low); } catch (e) { $('error').textContent = e.message; return; }
  for (let i = 0; i < 26; i++) {
    const mid = (low + high) / 2;
    try { buildModel(+$('font').value, mid); low = mid; } catch (_) { high = mid; }
  }
  $('leading').value = (Math.floor(low * 10) / 10).toFixed(1);
  if (!update()) { $('leading').value = originalLeading; update(); }
}
$('pair').innerHTML = Array.from({ length: 8 }, (_, i) => `<option value="${i}">${i + 1}. açılım · yaprak ${2 * i + 1} | ${2 * i + 2}</option>`).join('');
$('pair').onchange = e => { activePair = +e.target.value; if (model) render(); };
$('view').onchange = applyView;
$('guides').onchange = e => document.body.classList.toggle('guides-on', e.target.checked);
$('grid').onchange = () => { if (model) render(); };
$('font').onchange = update; $('leading').onchange = update;
$('reference').onclick = () => { $('font').value = 10.5; $('leading').value = 13; update(); };
$('fill').onclick = fillHeight;
$('demo').onclick = () => { inputState = structuredClone(KureDemo); update(); };
$('import').onchange = async e => {
  if (!e.target.files[0]) return;
  try {
    const data = JSON.parse(await e.target.files[0].text());
    P.prepareState(data, +$('font').value, +$('leading').value, true);
    inputState = data; advanceCache.clear(); boxCache.clear(); update();
  } catch (err) { $('error').textContent = err.message; }
};
$('print').onclick = () => { window.print(); };
window.renderAllForPrint = function (selection = $('view').value) {
  if (!model) throw new Error('Geçerli yerleşim yok.');
  $('cards').replaceChildren(); document.body.classList.remove('focus');
  for (let row = 0; row < 8; row++) for (let vi = 0; vi < 2; vi++) {
    if (selection !== 'all' && +selection !== vi) continue;
    const card = document.createElement('section'); card.className = 'card'; card.dataset.variant = vi;
    card.append(createSpread(vi, row)); $('cards').append(card);
  }
};
$('print-all').onclick = () => { window.renderAllForPrint(); window.print(); render(); };
$('svg').onclick = () => {
  const vi = $('view').value === 'all' ? 0 : +$('view').value;
  const svg = createSpread(vi, activePair); svg.setAttribute('xmlns', NS); svg.setAttribute('width', '260mm'); svg.setAttribute('height', '195mm');
  // A portable SVG needs its own fonts; embed the already-local font assets.
  Promise.all(['../fonts/CrimsonPro-Variable.ttf', '../fonts/CrimsonPro-Italic-Variable.ttf'].map(async url => {
    const response = await fetch(url); if (!response.ok) throw new Error('SVG fontu okunamadı.');
    const blob = await response.blob(); return await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(blob); });
  })).then(urls => {
    const style = node('style'); style.textContent = `@font-face{font-family:'Crimson Pro';font-weight:200 900;src:url(${urls[0]})}@font-face{font-family:'Crimson Pro';font-style:italic;font-weight:200 900;src:url(${urls[1]})}.art text{font-family:'Crimson Pro';fill:#111;text-anchor:middle;dominant-baseline:central}.silhouette,.gridline{fill:none;stroke:#a99f8b;stroke-width:.18}.spine{stroke:#ddd;stroke-width:.15}.guides{display:none}`;
    svg.prepend(style); download(`kure-${variants[vi].id}-${activePair + 1}.svg`, new XMLSerializer().serializeToString(svg), 'image/svg+xml');
  }).catch(err => { $('error').textContent = `${err.message} SVG indirmek için araç kökünde yerel HTTP sunucusunu kullanın (README). PDF ve JSON dosyası yükleme doğrudan dosya açılışında da çalışır.`; });
};
window.loadWork = function (data) { inputState = structuredClone(data); advanceCache.clear(); boxCache.clear(); return update(); };
window.ready = Promise.all([document.fonts.load('16px "Crimson Pro"'), document.fonts.load('bold 16px "Crimson Pro"'), document.fonts.load('italic 16px "Crimson Pro"')]).then(update);
