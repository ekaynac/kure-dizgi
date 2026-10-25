(function () {
  'use strict';

  var NP = 16;
  var SEG = Math.PI / 4;
  var HW = Math.PI / 2;
  var DEG = Math.PI / 180;
  var LSKEY = 'kureDizgiPublic1';

  var cv = document.getElementById('cv');
  var ctx = cv.getContext('2d');
  var W = 880, H = 880;

  // ---- Quill ----
  var SIZES = ['10px','12px','14px','16px','18px','21px','24px','28px','34px','40px','48px'];
  var SizeAttr = Quill.import('attributors/style/size');
  SizeAttr.whitelist = SIZES;
  Quill.register(SizeAttr, true);
  var Parchment = Quill.import('parchment');
  var ADVDEFS = [
    ['tracking',     'letter-spacing', 'INLINE'],
    ['wordsp',       'word-spacing',   'INLINE'],
    ['baseline',     'vertical-align', 'INLINE'],
    ['lineheight',   'line-height',    'BLOCK'],
    ['linetracking', 'letter-spacing', 'BLOCK']
  ];
  ADVDEFS.forEach(function (d) {
    Quill.register(new Parchment.StyleAttributor(d[0], d[1], { scope: Parchment.Scope[d[2]] }), true);
  });
  Quill.register(new Parchment.Attributor('hscale', 'data-hscale', { scope: Parchment.Scope.INLINE }), true);
  var quill = new Quill('#editor', {
    theme: 'snow',
    placeholder: 'Bu sayfanın dizelerini yaz…',
    modules: { toolbar: [
      ['bold', 'italic'],
      [{ size: [false].concat(SIZES) }],
      [{ align: [] }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['clean']
    ] }
  });
  document.getElementById('editorwrap').insertBefore(
    document.getElementById('advbar'), document.getElementById('editor'));

  // ---- durum ve geçiş (mevcut içerik korunur) ----
  function defaultPage(i) {
    return { delta: { ops: [] }, delta2: { ops: [] }, size: 16, leading: 1.35, tracking: 0,
             top: 2, margintip: 25, marginspine: 3,
             cols: (i === 10 || i === 11) ? 2 : 1, ratio: 33, colgap: 1.5,
             jwmin: 95, jwmax: 220, jgmin: 97, jgmax: 103, shift: 0 };
  }
  var state = null;
  try { state = JSON.parse(localStorage.getItem(LSKEY)); } catch (e) { state = null; }
  if (!state || !state.pages || state.pages.length !== NP) {
    state = { cur: 0, mode: '3d', R: 520, font: 'Crimson Pro', yaw: 0, pitch: 0, pages: [] };
    for (var i0 = 0; i0 < NP; i0++) state.pages.push(defaultPage(i0));
  }
  state.pages.forEach(function (p, i) {          // eski kayıtlara yeni alanları ekle
    if (p.cols === undefined) p.cols = (i === 10 || i === 11) ? 2 : 1;
    if (p.ratio === undefined) p.ratio = 33;
    if (p.colgap === undefined) p.colgap = 1.5;
    if (p.jwmin === undefined) { p.jwmin = 95; p.jwmax = 220; p.jgmin = 97; p.jgmax = 103; }
    if (p.shift === undefined) p.shift = 0;
    if (!p.delta2) p.delta2 = { ops: [] };
  });
  if (state.mode !== '3d' && state.mode !== 'ring' && state.mode !== 'pair' && state.mode !== 'quad') state.mode = '3d';
  var curCol = 0;                                 // 0 = dış, 1 = iç (kalıcı değil)
  if (!state.zoom) state.zoom = 1;                // 3B yakınlaştırma
  if (!state.fz) state.fz = 1;                    // düz görünüm yakınlaştırma
  if (state.fpx === undefined) { state.fpx = 0; state.fpy = 0; }
  if (state.ringA === undefined) state.ringA = Math.PI / 2;

  var PAGEFIELDS = ['size','leading','tracking','top','margintip','marginspine','ratio','colgap','jwmin','jwmax','jgmin','jgmax','shift'];
  var ui = {};
  PAGEFIELDS.concat(['radius','font','showgrid','bulk','cols']).forEach(function (id) { ui[id] = document.getElementById(id); });

  // ---- sekmeler ----
  var tabBtns = [];
  function makeTabs(boxId, ks) {
    var box = document.getElementById(boxId);
    ks.forEach(function (k) {
      var b = document.createElement('button');
      b.textContent = 's' + (k + 1);
      b.addEventListener('click', function () {
        state.cur = k; curCol = 0;
        focusPage(); loadPage(); persist(); schedule();
      });
      box.appendChild(b);
      tabBtns[k] = b;
    });
  }
  makeTabs('tabs-odd',  [0, 2, 4, 6, 8, 10, 12, 14]);
  makeTabs('tabs-even', [1, 3, 5, 7, 9, 11, 13, 15]);

  function rowOf(k) { return Math.floor(k / 2); }
  function isLeft(k) { return k % 2 === 0; }
  function tau0(k) { return rowOf(k) * SEG; }
  function tau1(k) { return tau0(k) + SEG; }

  function focusPage() {
    var tc = tau0(state.cur) + SEG / 2;
    state.pitch = (Math.PI / 2 - tc);
    state.yaw = (isLeft(state.cur) ? 1 : -1) * 0.5;
    state.ringA = Math.PI / 2 - tc;
  }

  function curDelta() {
    var p = state.pages[state.cur];
    return curCol === 1 ? p.delta2 : p.delta;
  }
  function updateColUI() {
    var p = state.pages[state.cur];
    var chips = document.getElementById('colchips');
    chips.classList.toggle('show', p.cols === 2);
    document.getElementById('col-out').classList.toggle('active', curCol === 0);
    document.getElementById('col-in').classList.toggle('active', curCol === 1);
    ui.cols.checked = p.cols === 2;
  }
  function loadPage() {
    var p = state.pages[state.cur];
    if (p.cols !== 2) curCol = 0;
    quill.setContents(curDelta(), 'api');
    PAGEFIELDS.forEach(function (f) { ui[f].value = p[f]; });
    ui.radius.value = state.R; ui.font.value = state.font;
    updateColUI(); syncOutputs();
    var n = state.cur + 1;
    document.getElementById('pageinfo').textContent =
      'Sayfa ' + n + ' — ' + (rowOf(state.cur) + 1) + '. sıra, ' +
      (isLeft(state.cur) ? 'sol (tek)' : 'sağ (çift)') + ' halka · eşi: s' + (isLeft(state.cur) ? n + 1 : n - 1) +
      (p.cols === 2 ? ' · iki sütun' : '');
  }
  function syncOutputs() {
    var p = state.pages[state.cur];
    document.getElementById('v-size').textContent = p.size;
    document.getElementById('v-leading').textContent = (+p.leading).toFixed(2);
    document.getElementById('v-tracking').textContent = p.tracking;
    document.getElementById('v-top').textContent = p.top + '°';
    document.getElementById('v-shift').textContent = p.shift + '°';
    document.getElementById('v-margintip').textContent = p.margintip + '°';
    document.getElementById('v-marginspine').textContent = p.marginspine + '°';
    document.getElementById('v-ratio').textContent = p.ratio + '%';
    document.getElementById('v-colgap').textContent = p.colgap + '°';
    document.getElementById('v-radius').textContent = state.R;
  }

  // ---- kalıcılık ----
  var saveTimer = null;
  function persist() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      saveTimer = null;
      try { localStorage.setItem(LSKEY, JSON.stringify(state)); } catch (e) {}
    }, 600);
  }
  window.addEventListener('beforeunload', function () {
    try { localStorage.setItem(LSKEY, JSON.stringify(state)); } catch (e) {}
  });

  // ---- ölçüm önbelleği ----
  var measureCache = new Map();
  function measure(fstr, ch) {
    var m = measureCache.get(fstr);
    if (!m) { m = new Map(); measureCache.set(fstr, m); }
    var w = m.get(ch);
    if (w === undefined) {
      if (ctx.font !== fstr) ctx.font = fstr;
      w = ctx.measureText(ch).width;
      m.set(ch, w);
    }
    return w;
  }

  var glyphCache = new Array(NP).fill(null);
  function invalidate(k) { glyphCache[k] = null; }
  function invalidateAll() { for (var i = 0; i < NP; i++) glyphCache[i] = null; }

  function layoutPage(k) {
    if (!glyphCache[k]) glyphCache[k] = window.KureLayout.layoutPage(state, k, measure);
    return glyphCache[k];
  }

  // ---- çizim ----
  function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  var dpr = window.devicePixelRatio || 1;

  // ================= WebGL glif motoru =================
  var glcv = document.getElementById('glcv');
  var GL = (function () {
    var gl = glcv.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true });
    if (!gl) return null;
    var VS = 'attribute vec2 aXY; attribute vec2 aUV; attribute vec2 aAW;' +
      'uniform vec2 uRes; varying vec2 vUV; varying vec2 vAW;' +
      'void main(){ vUV=aUV; vAW=aAW;' +
      ' gl_Position=vec4((aXY/uRes*2.0-1.0)*vec2(1.0,-1.0),0.0,1.0); }';
    var FS = 'precision mediump float; uniform sampler2D uTex; uniform vec3 uInk; uniform vec3 uWarn;' +
      'varying vec2 vUV; varying vec2 vAW;' +
      'void main(){ float cov=texture2D(uTex,vUV).a*vAW.x;' +
      ' vec3 col=mix(uInk,uWarn,vAW.y);' +
      ' gl_FragColor=vec4(col*cov,cov); }';
    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { return null; }
      return s;
    }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    var aXY = gl.getAttribLocation(prog, 'aXY');
    var aUV = gl.getAttribLocation(prog, 'aUV');
    var aAW = gl.getAttribLocation(prog, 'aAW');
    [aXY, aUV, aAW].forEach(function (a) { gl.enableVertexAttribArray(a); });
    var STRIDE = 24;
    gl.vertexAttribPointer(aXY, 2, gl.FLOAT, false, STRIDE, 0);
    gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, STRIDE, 8);
    gl.vertexAttribPointer(aAW, 2, gl.FLOAT, false, STRIDE, 16);
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    return { gl: gl,
             uRes: gl.getUniformLocation(prog, 'uRes'),
             uInk: gl.getUniformLocation(prog, 'uInk'),
             uWarn: gl.getUniformLocation(prog, 'uWarn') };
  })();

  var ATLAS = 2048, SS = 3;
  var acv = document.createElement('canvas');
  acv.width = ATLAS; acv.height = ATLAS;
  var actx = acv.getContext('2d');
  var atlasMap = new Map();
  var shelfX = 0, shelfY = 0, shelfH = 0;
  var atlasDirty = false;
  function atlasReset() {
    atlasMap.clear(); shelfX = shelfY = shelfH = 0;
    actx.clearRect(0, 0, ATLAS, ATLAS);
    atlasDirty = true;
    for (var i = 0; i < NP; i++) if (glyphCache[i]) glyphCache[i].forEach(function (g) { g.at = null; });
  }
  function atlasEntry(f, ch) {
    var key = f.str + '' + ch;
    var e = atlasMap.get(key);
    if (e) return e;
    var px = f.px;
    var astr = (f.italic ? 'italic ' : '') + (f.bold ? 'bold ' : '') +
               (px * SS) + 'px "' + state.font + '", Georgia, serif';
    actx.font = astr;
    var w = actx.measureText(ch).width;
    var cw = Math.ceil(w + px * SS * 0.3) + 2;
    var chh = Math.ceil(px * SS * 1.8) + 2;
    if (shelfX + cw > ATLAS) { shelfY += shelfH + 2; shelfX = 0; shelfH = 0; }
    if (shelfY + chh > ATLAS) { atlasReset(); actx.font = astr; }
    if (chh > shelfH) shelfH = chh;
    var x = shelfX, y = shelfY;
    shelfX += cw + 2;
    actx.fillStyle = '#FFFFFF';
    actx.textAlign = 'center'; actx.textBaseline = 'middle';
    actx.fillText(ch, x + cw / 2, y + chh / 2);
    e = { u0: x / ATLAS, v0: y / ATLAS, u1: (x + cw) / ATLAS, v1: (y + chh) / ATLAS,
          hw: cw / (2 * SS), hh: chh / (2 * SS) };
    atlasMap.set(key, e);
    atlasDirty = true;
    return e;
  }
  function hexRGB(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255];
  }
  var vertsCap = 4096 * 36;
  var verts = new Float32Array(vertsCap);
  function glClear() {
    if (!GL) return;
    var gl = GL.gl;
    if (glcv.width !== W * dpr) { glcv.width = W * dpr; glcv.height = H * dpr; }
    gl.viewport(0, 0, glcv.width, glcv.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  function render3D() {
    var R = Math.min(W, H) * 0.42 * state.zoom;
    var scale = R / state.R;
    var cx = W / 2, cy = H / 2;
    var vyaw = state.mode === 'ring' ? 0 : state.yaw;
    var vpitch = state.mode === 'ring' ? state.ringA : state.pitch;
    var cyw = Math.cos(vyaw), syw = Math.sin(vyaw);
    var cp = Math.cos(vpitch), sp = Math.sin(vpitch);
    var m00 = cyw, m02 = syw;
    var m10 = sp * syw, m11 = cp, m12 = -sp * cyw;
    var m20 = -cp * syw, m21 = sp, m22 = cp * cyw;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = css('--paper'); ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = css('--rim'); ctx.lineWidth = 1.25;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();

    function rotP(x, y, z) {
      return [m00 * x + m02 * z, m10 * x + m11 * y + m12 * z, m20 * x + m21 * y + m22 * z];
    }
    if (ui.showgrid.checked) {
      ctx.lineWidth = 1; ctx.strokeStyle = css('--grid');
      drawCurve(function (u) { return [0, -Math.cos(u), Math.sin(u)]; }, 0, 2 * Math.PI, rotP, R, cx, cy);
      ctx.setLineDash([4, 4]);
      for (var r = 0; r < 8; r++) {
        (function (tt) {
          var ctu = Math.cos(tt), stu = Math.sin(tt);
          drawCurve(function (u) { var c = Math.cos(u); return [Math.sin(u), -c * ctu, c * stu]; }, -HW, HW, rotP, R, cx, cy);
        })(r * SEG);
      }
      ctx.setLineDash([]);
      [[1, 0, 0], [-1, 0, 0]].forEach(function (tip) {
        var P = rotP(tip[0], tip[1], tip[2]);
        if (P[2] > 0) {
          ctx.fillStyle = css('--rim');
          ctx.beginPath(); ctx.arc(cx + P[0] * R, cy + P[1] * R, 3.5, 0, 2 * Math.PI); ctx.fill();
        }
      });
    }

    var inkCol = css('--text-ink'), warnCol = css('--warn');

    if (GL) {
      var n = 0, k, i, glyphs, g, over;
      for (k = 0; k < NP; k++) {
        glyphs = layoutPage(k);
        over = false;
        for (i = 0; i < glyphs.length; i++) {
          g = glyphs[i];
          if (g.over) over = true;
          var px = g.ss, py = -g.cs * g.ct, pz = g.cs * g.st;
          var Pz = m20 * px + m21 * py + m22 * pz;
          if (Pz < 0.02) continue;
          var Px = m00 * px + m02 * pz;
          var Py = m10 * px + m11 * py + m12 * pz;
          var ax = g.cs, ay = g.ss * g.ct, az = -g.ss * g.st;
          var Sx = (m00 * ax + m02 * az) * scale, Sy = (m10 * ax + m11 * ay + m12 * az) * scale;
          var Tx = (m02 * g.ct) * scale, Ty = (m11 * g.st + m12 * g.ct) * scale;
          if (g.hs && g.hs !== 1) { Sx *= g.hs; Sy *= g.hs; }
          var at = g.at || (g.at = atlasEntry(g.f, g.ch));
          var alpha = Pz > 0.25 ? 1 : Pz * 4;
          var warn = g.over ? 1 : 0;
          var X = cx + Px * R, Y = cy + Py * R;
          if (g.bl) { X -= Tx * g.bl; Y -= Ty * g.bl; }
          var hx = at.hw, hy = at.hh;
          var x0 = X - hx * Sx - hy * Tx, y0 = Y - hx * Sy - hy * Ty;
          var x1 = X + hx * Sx - hy * Tx, y1 = Y + hx * Sy - hy * Ty;
          var x2 = X + hx * Sx + hy * Tx, y2 = Y + hx * Sy + hy * Ty;
          var x3 = X - hx * Sx + hy * Tx, y3 = Y - hx * Sy + hy * Ty;
          if ((n + 36) > vertsCap) {
            vertsCap *= 2;
            var nv = new Float32Array(vertsCap); nv.set(verts.subarray(0, n)); verts = nv;
          }
          var v = verts;
          v[n++] = x0; v[n++] = y0; v[n++] = at.u0; v[n++] = at.v0; v[n++] = alpha; v[n++] = warn;
          v[n++] = x1; v[n++] = y1; v[n++] = at.u1; v[n++] = at.v0; v[n++] = alpha; v[n++] = warn;
          v[n++] = x2; v[n++] = y2; v[n++] = at.u1; v[n++] = at.v1; v[n++] = alpha; v[n++] = warn;
          v[n++] = x0; v[n++] = y0; v[n++] = at.u0; v[n++] = at.v0; v[n++] = alpha; v[n++] = warn;
          v[n++] = x2; v[n++] = y2; v[n++] = at.u1; v[n++] = at.v1; v[n++] = alpha; v[n++] = warn;
          v[n++] = x3; v[n++] = y3; v[n++] = at.u0; v[n++] = at.v1; v[n++] = alpha; v[n++] = warn;
        }
        tabBtns[k].classList.toggle('over', over);
        tabBtns[k].classList.toggle('active', k === state.cur);
      }
      var gl = GL.gl;
      if (glcv.width !== W * dpr) { glcv.width = W * dpr; glcv.height = H * dpr; }
      gl.viewport(0, 0, glcv.width, glcv.height);
      if (atlasDirty) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, acv);
        atlasDirty = false;
      }
      gl.uniform2f(GL.uRes, W, H);
      var ic = hexRGB(inkCol), wc = hexRGB(warnCol);
      gl.uniform3f(GL.uInk, ic[0], ic[1], ic[2]);
      gl.uniform3f(GL.uWarn, wc[0], wc[1], wc[2]);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (n > 0) {
        gl.bufferData(gl.ARRAY_BUFFER, verts.subarray(0, n), gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, n / 6);
      }
    } else {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var lastFont = '', lastFill = '', lastAlpha = -1;
      for (var k2 = 0; k2 < NP; k2++) {
        var glyphs2 = layoutPage(k2);
        var over2 = false;
        for (var i2 = 0; i2 < glyphs2.length; i2++) {
          var g2 = glyphs2[i2];
          if (g2.over) over2 = true;
          var px2 = g2.ss, py2 = -g2.cs * g2.ct, pz2 = g2.cs * g2.st;
          var Pz2 = m20 * px2 + m21 * py2 + m22 * pz2;
          if (Pz2 < 0.02) continue;
          var Px2 = m00 * px2 + m02 * pz2;
          var Py2 = m10 * px2 + m11 * py2 + m12 * pz2;
          var ax2 = g2.cs, ay2 = g2.ss * g2.ct, az2 = -g2.ss * g2.st;
          var eSx2 = m00 * ax2 + m02 * az2, eSy2 = m10 * ax2 + m11 * ay2 + m12 * az2;
          var eTx2 = m02 * g2.ct, eTy2 = m11 * g2.st + m12 * g2.ct;
          if (g2.f.str !== lastFont) { ctx.font = g2.f.str; lastFont = g2.f.str; }
          var fill2 = g2.over ? warnCol : inkCol;
          if (fill2 !== lastFill) { ctx.fillStyle = fill2; lastFill = fill2; }
          var alpha2 = Pz2 > 0.25 ? 1 : Pz2 * 4;
          if (Math.abs(alpha2 - lastAlpha) > 0.04) { ctx.globalAlpha = alpha2; lastAlpha = alpha2; }
          var hs2 = g2.hs || 1, bl2 = g2.bl || 0;
          ctx.setTransform(dpr * eSx2 * scale * hs2, dpr * eSy2 * scale * hs2, dpr * eTx2 * scale, dpr * eTy2 * scale,
                           dpr * (cx + Px2 * R - eTx2 * scale * bl2), dpr * (cy + Py2 * R - eTy2 * scale * bl2));
          ctx.fillText(g2.ch, 0, 0);
        }
        tabBtns[k2].classList.toggle('over', over2);
        tabBtns[k2].classList.toggle('active', k2 === state.cur);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
    }
  }
  function drawCurve(fn, u0, u1, rotP, R, cx, cy) {
    ctx.beginPath(); var started = false;
    for (var u = u0; u <= u1 + 1e-6; u += 0.03) {
      var q = fn(u);
      var P = rotP(q[0], q[1], q[2]);
      if (P[2] < 0.02) { started = false; continue; }
      if (!started) { ctx.moveTo(cx + P[0] * R, cy + P[1] * R); started = true; }
      else ctx.lineTo(cx + P[0] * R, cy + P[1] * R);
    }
    ctx.stroke();
  }

  // ---- düz açılım ----
  function devPoint(sigma, tau, k) {
    var R = state.R;
    var left = isLeft(k);
    var tc = tau0(k) + SEG / 2;
    var p = left ? (sigma + HW) : (HW - sigma);
    var x = R * (sigma + HW);
    var y = R * (tau - tc) * Math.sin(p);
    var slope = (tau - tc) * Math.cos(p) * (left ? 1 : -1);
    return { x: x, y: y, rot: Math.atan(slope) };
  }
  function drawPairFlat(row, ox, oy, sc) {
    var kL = 2 * row, kR = kL + 1;
    ctx.strokeStyle = css('--rim'); ctx.lineWidth = 1.25; ctx.setLineDash([]);
    [kL, kR].forEach(function (k) { leafOutline(k, ox, oy, sc); });
    ctx.strokeStyle = css('--grid'); ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(ox + sc * state.R * HW, oy - sc * state.R * SEG / 2);
    ctx.lineTo(ox + sc * state.R * HW, oy + sc * state.R * SEG / 2);
    ctx.stroke(); ctx.setLineDash([]);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var inkCol = css('--text-ink'), warnCol = css('--warn');
    var lastFont = '';
    [kL, kR].forEach(function (k) {
      var glyphs = layoutPage(k);
      for (var i = 0; i < glyphs.length; i++) {
        var g = glyphs[i];
        var d = devPoint(g.sigma, g.tau, k);
        if (g.f.str !== lastFont) { ctx.font = g.f.str; lastFont = g.f.str; }
        ctx.fillStyle = g.over ? warnCol : inkCol;
        var cr = Math.cos(d.rot), sr = Math.sin(d.rot);
        var hsf = g.hs || 1;
        ctx.setTransform(dpr * sc * cr * hsf, dpr * sc * sr * hsf, dpr * sc * -sr, dpr * sc * cr,
                         dpr * (ox + sc * d.x), dpr * (oy + sc * d.y));
        ctx.fillText(g.ch, 0, -(g.bl || 0));
      }
    });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function leafOutline(k, ox, oy, sc) {
    var t0 = tau0(k), t1 = tau1(k);
    var left = isLeft(k);
    ctx.beginPath(); var first = true;
    function pt(sigma, tau) {
      var d = devPoint(sigma, tau, k);
      var x = ox + sc * d.x, y = oy + sc * d.y;
      if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
    }
    var s;
    if (left) {
      for (s = -HW; s <= 1e-6; s += 0.02) pt(s, t0);
      for (s = 0; s >= -HW - 1e-6; s -= 0.02) pt(s, t1);
    } else {
      for (s = 0; s <= HW + 1e-6; s += 0.02) pt(s, t0);
      for (s = HW; s >= -1e-6; s -= 0.02) pt(s, t1);
    }
    ctx.closePath(); ctx.stroke();
  }
  function renderPair() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = css('--paper'); ctx.fillRect(0, 0, W, H);
    var R = state.R;
    var sc = Math.min((W - 50) / (R * Math.PI), (H - 50) / (R * SEG * 1.6), 1) * state.fz;
    drawPairFlat(rowOf(state.cur), W / 2 - sc * R * HW + state.fpx, H / 2 + state.fpy, sc);
    updateTabs();
  }
  function renderQuad() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = css('--paper'); ctx.fillRect(0, 0, W, H);
    var R = state.R;
    var row = rowOf(state.cur), row2 = (row + 1) % 8;
    var gap = 26;
    var sc = Math.min((W - 50) / (R * Math.PI), (H - 60 - gap) / (R * SEG * 2.6), 1) * state.fz;
    var ox = W / 2 - sc * R * HW + state.fpx;
    var rh = sc * R * SEG * 1.15;
    drawPairFlat(row, ox, H / 2 - rh / 2 - gap / 2 + state.fpy, sc);
    drawPairFlat(row2, ox, H / 2 + rh / 2 + gap / 2 + state.fpy, sc);
    updateTabs();
  }
  function updateTabs() {
    for (var t = 0; t < NP; t++) tabBtns[t].classList.toggle('active', t === state.cur);
  }

  // ---- render zamanlama ----
  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () {
      pending = false;
      render();
    });
  }
  function render() {
    if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    if (state.mode === '3d' || state.mode === 'ring') render3D();
    else { glClear(); if (state.mode === 'pair') renderPair(); else renderQuad(); }
    document.getElementById('mode-3d').classList.toggle('active', state.mode === '3d');
    document.getElementById('mode-ring').classList.toggle('active', state.mode === 'ring');
    document.getElementById('mode-pair').classList.toggle('active', state.mode === 'pair');
    document.getElementById('mode-quad').classList.toggle('active', state.mode === 'quad');
    var r = rowOf(state.cur) + 1;
    var hint = state.mode === '3d'
      ? 'Sürükle: döndür · Tekerlek: yakınlaştır · Çift tık: sıfırla. Kırmızı harf sınırdan taşıyor demektir.'
      : state.mode === 'ring'
      ? 'Uçlar sabit: dikey sürükleme halkayı uçtan-uca eksende yuvarlar. Tekerlek: yakınlaştır.'
      : state.mode === 'pair'
        ? r + '. sıra: s' + (2 * r - 1) + ' + s' + (2 * r) + ' düz açılım. Ortadaki kesik çizgi ortak omurgadır.'
        : r + '. sıra ve ' + (r % 8 + 1) + '. sıra alt alta — yatay ve dikey bitişiklikleri birlikte kontrol et.';
    document.getElementById('stagehint').textContent = hint;
  }

  // ---- boyutlandırma: kaydırmasız tek ekran ----
  var wrap = document.getElementById('canvaswrap');
  function fitCanvas() {
    var rect = wrap.getBoundingClientRect();
    var size = Math.max(320, Math.min(rect.width - 4, rect.height - 4, 1400));
    size = Math.floor(size);
    if (size !== W) { W = size; H = size; schedule(); }
  }
  if (window.ResizeObserver) new ResizeObserver(fitCanvas).observe(wrap);
  window.addEventListener('resize', fitCanvas);

  // ---- SVG ----
  function esc(x) { return x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function svgPair(row, ox, oy) {
    var kL = 2 * row, kR = kL + 1;
    var parts = [];
    [kL, kR].forEach(function (k) {
      var left = isLeft(k);
      var t0 = tau0(k), t1 = tau1(k);
      var pts = [], s, d;
      function push(sg, tt) { d = devPoint(sg, tt, k); pts.push((ox + d.x).toFixed(2) + ',' + (oy + d.y).toFixed(2)); }
      if (left) {
        for (s = -HW; s <= 1e-6; s += 0.02) push(s, t0);
        for (s = 0; s >= -HW - 1e-6; s -= 0.02) push(s, t1);
      } else {
        for (s = 0; s <= HW + 1e-6; s += 0.02) push(s, t0);
        for (s = HW; s >= -1e-6; s -= 0.02) push(s, t1);
      }
      parts.push('<path d="M' + pts.join(' L') + ' Z" fill="none" stroke="#999999" stroke-width="0.5"/>');
    });
    var m1 = devPoint(0, tau0(kL), kL), m2 = devPoint(0, tau1(kL), kL);
    parts.push('<line x1="' + (ox + m1.x).toFixed(2) + '" y1="' + (oy + m1.y).toFixed(2) +
               '" x2="' + (ox + m2.x).toFixed(2) + '" y2="' + (oy + m2.y).toFixed(2) +
               '" stroke="#BBBBBB" stroke-width="0.4" stroke-dasharray="4 4"/>');
    [kL, kR].forEach(function (k) {
      layoutPage(k).forEach(function (g) {
        var d = devPoint(g.sigma, g.tau, k);
        var a = ' font-size="' + g.f.px + '"';
        if (g.f.bold) a += ' font-weight="bold"';
        if (g.f.italic) a += ' font-style="italic"';
        var tf = 'translate(' + (ox + d.x).toFixed(2) + ' ' + (oy + d.y).toFixed(2) + ')';
        if (Math.abs(d.rot) > 1e-4) tf += ' rotate(' + (d.rot * 180 / Math.PI).toFixed(2) + ')';
        if (g.hs && g.hs !== 1) tf += ' scale(' + g.hs.toFixed(3) + ' 1)';
        parts.push('<text x="0" y="' + (-(g.bl || 0)).toFixed(2) + '" transform="' + tf + '"' + a + '>' + esc(g.ch) + '</text>');
      });
    });
    return parts.join('\n');
  }
  function wrapSVG(inner, w, h) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + Math.ceil(w) + '" height="' + Math.ceil(h) + '" viewBox="0 0 ' + Math.ceil(w) + ' ' + Math.ceil(h) + '">\n' +
      '<g fill="#000000" font-family="' + esc(state.font) + ', Georgia, serif" text-anchor="middle" dominant-baseline="central">\n' +
      inner + '\n</g>\n</svg>';
  }
  function download(name, blob) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  }

  document.getElementById('dl-svg-pair').addEventListener('click', function () {
    var R = state.R, row = rowOf(state.cur), pad = 20;
    var w = R * Math.PI + 2 * pad, h = R * SEG + 2 * pad;
    download('sira-' + (row + 1) + '-yaprak-cifti.svg',
      new Blob([wrapSVG(svgPair(row, pad, h / 2), w, h)], { type: 'image/svg+xml' }));
  });
  document.getElementById('dl-svg-all').addEventListener('click', function () {
    var R = state.R, pad = 20, gap = 12;
    var rowH = R * SEG + gap;
    var inner = [];
    for (var row = 0; row < 8; row++) inner.push(svgPair(row, pad, pad + row * rowH + R * SEG / 2));
    download('kure-sablon.svg',
      new Blob([wrapSVG(inner.join('\n'), R * Math.PI + 2 * pad, 8 * rowH - gap + 2 * pad)], { type: 'image/svg+xml' }));
  });
  document.getElementById('dl-png').addEventListener('click', function () {
    var off = document.createElement('canvas');
    off.width = W * 3; off.height = H * 3;
    var octx = off.getContext('2d');
    octx.drawImage(cv, 0, 0, off.width, off.height);
    if (GL && (state.mode === '3d' || state.mode === 'ring')) octx.drawImage(glcv, 0, 0, off.width, off.height);
    off.toBlob(function (b) { download('kure-gorunum.png', b); }, 'image/png');
  });
  document.getElementById('dl-json').addEventListener('click', function () {
    download('kure-dizgi-yedek.json', new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  });
  document.getElementById('ul-json').addEventListener('click', function () { document.getElementById('jsonfile').click(); });
  function applyImported(text) {
    var d = JSON.parse(text);
    if (!(d && d.pages && d.pages.length === NP)) { alert('Dosya bu aracın yedeği değil (16 sayfa bekleniyor).'); return false; }
    state = d;
    state.pages.forEach(function (p) {
      if (p.cols === undefined) p.cols = 1;
      if (p.ratio === undefined) p.ratio = 33;
      if (p.colgap === undefined) p.colgap = 1.5;
      if (p.jwmin === undefined) { p.jwmin = 95; p.jwmax = 220; p.jgmin = 97; p.jgmax = 103; }
      if (p.shift === undefined) p.shift = 0;
      if (!p.delta2) p.delta2 = { ops: [] };
    });
    if (state.zoom === undefined) state.zoom = 1;
    if (state.fz === undefined) state.fz = 1;
    if (state.fpx === undefined) { state.fpx = 0; state.fpy = 0; }
    if (state.ringA === undefined) state.ringA = Math.PI / 2;
    curCol = 0; measureCache.clear(); atlasReset(); invalidateAll(); loadPage(); persist(); schedule();
    return true;
  }
  document.getElementById('jsonfile').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try { applyImported(r.result); } catch (e) { alert('JSON okunamadı: ' + e.message); }
    };
    r.readAsText(f);
  });

  // The neutral example never loads automatically or overwrites a working file.
  function loadDemo(text) {
    var demo = JSON.parse(text);
    if (!demo || !Array.isArray(demo.pages) || demo.pages.length !== NP) {
      throw new Error('Örnek dosyasında 16 sayfa bekleniyor.');
    }
    if (!window.confirm('Örnek mevcut çalışmanın yerini alacak. Önce mevcut çalışma tarayıcıda ayrı bir kurtarma kopyasına kaydedilecek ve JSON yedeği indirilecek. Devam edilsin mi?')) return;
    var backup = JSON.stringify(state, null, 2);
    try { localStorage.setItem(LSKEY + '.beforeDemo', backup); }
    catch (e) { alert('Kurtarma kopyası saklanamadı. Önce Yedek indir ile çalışmanı kaydet; örnek yüklenmedi.'); return; }
    download('kure-dizgi-ornek-oncesi-yedek.json', new Blob([backup], { type: 'application/json' }));
    if (applyImported(text)) {
      fsHandle = null;
      fsStatus.textContent = 'Örnek yüklendi. Önceki dosyanın üzerine yazılmaz; kaydederken yeni dosya seç.';
    }
  }
  document.getElementById('load-demo').addEventListener('click', function () {
    try { loadDemo(JSON.stringify(window.KureDemo)); }
    catch (e) { alert('Örnek yüklenemedi: ' + e.message); }
  });

  // ---- çalışma dosyası: doğrudan diske kaydet/aç (Chrome/Edge) ----
  var fsHandle = null;
  var fsStatus = document.getElementById('fs-status');
  var FSTYPES = [{ description: 'Küre Dizgi çalışması', accept: { 'application/json': ['.json'] } }];
  document.getElementById('fs-save').addEventListener('click', function () {
    if (!window.showSaveFilePicker) { fsStatus.textContent = 'Bu tarayıcı desteklemiyor — "Yedek indir" kullan.'; return; }
    (async function () {
      try {
        if (!fsHandle) fsHandle = await window.showSaveFilePicker({ suggestedName: 'kure-calisma.json', types: FSTYPES });
        var w = await fsHandle.createWritable();
        await w.write(JSON.stringify(state, null, 2));
        await w.close();
        fsStatus.textContent = 'Kaydedildi: ' + fsHandle.name + ' · ' + new Date().toLocaleTimeString('tr-TR');
      } catch (e) { if (e && e.name !== 'AbortError') fsStatus.textContent = 'Kaydedilemedi: ' + e.message; }
    })();
  });
  document.getElementById('fs-open').addEventListener('click', function () {
    if (!window.showOpenFilePicker) { fsStatus.textContent = 'Bu tarayıcı desteklemiyor — "Yedek yükle" kullan.'; return; }
    (async function () {
      try {
        var hs = await window.showOpenFilePicker({ types: FSTYPES });
        var file = await hs[0].getFile();
        var text = await file.text();
        if (applyImported(text)) { fsHandle = hs[0]; fsStatus.textContent = 'Açıldı: ' + file.name; }
      } catch (e) { if (e && e.name !== 'AbortError') fsStatus.textContent = 'Açılamadı: ' + e.message; }
    })();
  });

  // ---- popover'lar ----
  var pops = [['pb-page', 'pop-page'], ['pb-globe', 'pop-globe'], ['pb-io', 'pop-io']];
  pops.forEach(function (pair) {
    var btn = document.getElementById(pair[0]);
    var pop = document.getElementById(pair[1]);
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var wasOpen = pop.classList.contains('show');
      pops.forEach(function (q) {
        document.getElementById(q[1]).classList.remove('show');
        document.getElementById(q[0]).classList.remove('open');
      });
      if (!wasOpen) { pop.classList.add('show'); btn.classList.add('open'); }
    });
    pop.addEventListener('click', function (e) { e.stopPropagation(); });
  });
  document.addEventListener('click', function () {
    pops.forEach(function (q) {
      document.getElementById(q[1]).classList.remove('show');
      document.getElementById(q[0]).classList.remove('open');
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') pops.forEach(function (q) {
      document.getElementById(q[1]).classList.remove('show');
      document.getElementById(q[0]).classList.remove('open');
    });
  });

  // ---- görünümler ----
  document.getElementById('mode-3d').addEventListener('click', function () { state.mode = '3d'; persist(); schedule(); });
  document.getElementById('mode-ring').addEventListener('click', function () { state.mode = 'ring'; persist(); schedule(); });
  document.getElementById('mode-pair').addEventListener('click', function () { state.mode = 'pair'; persist(); schedule(); });
  document.getElementById('mode-quad').addEventListener('click', function () { state.mode = 'quad'; persist(); schedule(); });
  document.getElementById('resetview').addEventListener('click', function () { focusPage(); state.zoom = 1; state.fz = 1; state.fpx = 0; state.fpy = 0; schedule(); });

  // ---- sürükleme (ters yön) ----
  var drag = null;
  cv.addEventListener('pointerdown', function (e) {
    drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId);
    cv.style.cursor = 'grabbing';
  });
  cv.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (state.mode === '3d') {
      state.yaw -= dx * 0.006 / state.zoom;
      state.pitch -= dy * 0.006 / state.zoom;
    } else if (state.mode === 'ring') {
      state.ringA -= dy * 0.006 / state.zoom;
    } else {
      state.fpx += dx; state.fpy += dy;
    }
    drag = { x: e.clientX, y: e.clientY };
    schedule();
  });
  cv.addEventListener('pointerup', function () { drag = null; cv.style.cursor = 'grab'; persist(); });
  cv.addEventListener('wheel', function (e) {
    e.preventDefault();
    var f = Math.exp(-e.deltaY * 0.0012);
    if (state.mode === '3d' || state.mode === 'ring') state.zoom = Math.min(10, Math.max(0.5, state.zoom * f));
    else state.fz = Math.min(12, Math.max(0.4, state.fz * f));
    schedule();
  }, { passive: false });
  cv.addEventListener('dblclick', function () {
    if (state.mode === '3d' || state.mode === 'ring') state.zoom = 1;
    else { state.fz = 1; state.fpx = 0; state.fpy = 0; }
    schedule();
  });

  // ---- gelişmiş metin ----
  var ADVINPUTS = [
    ['adv-tracking',     'tracking',     'px'],
    ['adv-hscale',       'hscale',       ''],
    ['adv-wordsp',       'wordsp',       'px'],
    ['adv-baseline',     'baseline',     'px'],
    ['adv-lineheight',   'lineheight',   ''],
    ['adv-linetracking', 'linetracking', 'px']
  ];
  ADVINPUTS.forEach(function (d) {
    var el = document.getElementById(d[0]);
    el.addEventListener('change', function () {
      var v = el.value.trim();
      if (v === '' || (d[1] === 'hscale' && +v === 100) || (d[1] === 'lineheight' && v === '')) {
        quill.format(d[1], false, 'user');
      } else {
        quill.format(d[1], d[2] ? v + d[2] : String(v), 'user');
      }
    });
  });
  document.getElementById('adv-clear').addEventListener('click', function () {
    ADVINPUTS.forEach(function (d) { quill.format(d[1], false, 'user'); });
  });
  quill.on('selection-change', function (range) {
    if (!range) return;
    var fmt = quill.getFormat(range);
    ADVINPUTS.forEach(function (d) {
      var el = document.getElementById(d[0]);
      var v = fmt[d[1]];
      el.value = v === undefined ? '' : parseFloat(v);
    });
  });

  // ---- sütun seçici ----
  document.getElementById('col-out').addEventListener('click', function () {
    if (curCol === 0) return;
    curCol = 0; quill.setContents(curDelta(), 'api'); updateColUI();
  });
  document.getElementById('col-in').addEventListener('click', function () {
    if (curCol === 1) return;
    curCol = 1; quill.setContents(curDelta(), 'api'); updateColUI();
  });

  // ---- girişler ----
  quill.on('text-change', function (d, o, source) {
    if (source !== 'user') return;
    if (curCol === 1) state.pages[state.cur].delta2 = quill.getContents();
    else state.pages[state.cur].delta = quill.getContents();
    invalidate(state.cur);
    persist();
    schedule();
  });

  PAGEFIELDS.forEach(function (f) {
    ui[f].addEventListener('input', function () {
      var v = +ui[f].value;
      if (ui.bulk.checked) {
        state.pages.forEach(function (p) { p[f] = v; });
        invalidateAll();
      } else {
        state.pages[state.cur][f] = v;
        invalidate(state.cur);
      }
      syncOutputs();
      persist();
      schedule();
    });
  });
  ui.cols.addEventListener('input', function () {
    var v = ui.cols.checked ? 2 : 1;
    if (ui.bulk.checked) {
      state.pages.forEach(function (p) { p.cols = v; });
      invalidateAll();
    } else {
      state.pages[state.cur].cols = v;
      invalidate(state.cur);
    }
    if (v === 1 && curCol === 1) { curCol = 0; quill.setContents(curDelta(), 'api'); }
    updateColUI();
    loadPage();
    persist();
    schedule();
  });
  document.getElementById('copyall').addEventListener('click', function () {
    var src = state.pages[state.cur];
    state.pages.forEach(function (p) {
      PAGEFIELDS.forEach(function (f) { p[f] = src[f]; });
      p.cols = src.cols;
    });
    invalidateAll();
    persist();
    schedule();
  });
  ui.radius.addEventListener('input', function () {
    state.R = +ui.radius.value; invalidateAll(); syncOutputs(); persist(); schedule();
  });
  ui.font.addEventListener('input', function () {
    state.font = ui.font.value.trim() || 'Georgia';
    measureCache.clear(); atlasReset(); invalidateAll(); persist(); schedule();
  });
  ui.showgrid.addEventListener('input', schedule);

  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) mq.addEventListener('change', schedule);
  new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  loadPage();
  focusPage();
  fitCanvas();
  if (document.fonts) {
    var refreshFonts = function () {
      measureCache.clear(); atlasReset(); invalidateAll(); schedule();
    };
    document.fonts.addEventListener('loadingdone', refreshFonts);
    Promise.all(['16px "Crimson Pro"', 'bold 16px "Crimson Pro"',
                 'italic 16px "Crimson Pro"', 'italic bold 16px "Crimson Pro"'].map(function (font) {
      return document.fonts.load(font);
    })).then(refreshFonts);
  }
  schedule();
})();
