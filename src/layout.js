/* Küre Dizgi — original character layout engine, shared by browser tools. */
(function (root) {
  'use strict';
  var SEG = Math.PI / 4;
  var HW = Math.PI / 2;
  var DEG = Math.PI / 180;
  function isLeft(k) { return k % 2 === 0; }
  function tau0(k) { return Math.floor(k / 2) * SEG; }
  function tau1(k) { return tau0(k) + SEG; }

  function deltaLines(delta) {
    var lines = [], runs = [];
    (delta.ops || []).forEach(function (op) {
      if (typeof op.insert !== 'string') return;
      var parts = op.insert.split('\n');
      for (var i = 0; i < parts.length; i++) {
        if (parts[i]) runs.push({ text: parts[i], attrs: op.attributes || {} });
        if (i < parts.length - 1) { lines.push({ runs: runs, attrs: op.attributes || {} }); runs = []; }
      }
    });
    if (runs.length) lines.push({ runs: runs, attrs: {} });
    return lines;
  }
  function runFont(run, page, font) {
    var px = parseFloat(run.attrs.size) || page.size;
    var pre = '';
    if (run.attrs.italic) pre += 'italic ';
    if (run.attrs.bold) pre += 'bold ';
    return { str: pre + px + 'px "' + font + '", Georgia, serif', px: px,
             bold: !!run.attrs.bold, italic: !!run.attrs.italic };
  }

  // Sütun aralıkları: [dış, iç] sırasıyla — dış daima sivri uç tarafında
  function colRanges(page, k) {
    var left = isLeft(k);
    var sigA = left ? (-HW + page.margintip * DEG) : (page.marginspine * DEG);
    var sigB = left ? (-page.marginspine * DEG) : (HW - page.margintip * DEG);
    sigA += (page.shift || 0) * DEG;                 // içerik başlangıcı okuma yönünde ilerler
    if (sigA > sigB - 0.01) sigA = sigB - 0.01;
    if (page.cols !== 2) return [[sigA, sigB]];
    var gap = page.colgap * DEG;
    var w = Math.max(0.01, sigB - sigA - gap);
    var wOut = w * page.ratio / 100;
    if (left) return [[sigA, sigA + wOut], [sigA + wOut + gap, sigB]];
    return [[sigB - wOut, sigB], [sigA, sigB - wOut - gap]];
  }

  function layoutColumn(state, measure, glyphs, page, delta, sigLo, sigHi, k) {
    var R = state.R;
    var t1 = tau1(k);
    var tau = tau0(k) + page.top * DEG;
    deltaLines(delta).forEach(function (line) {
      var maxPx = page.size;
      var items = [];
      var lineTrk = line.attrs.linetracking ? parseFloat(line.attrs.linetracking) : 0;
      line.runs.forEach(function (run) {
        var f = runFont(run, page, state.font);
        if (f.px > maxPx) maxPx = f.px;
        var hs = run.attrs.hscale ? parseFloat(run.attrs.hscale) / 100 : 1;
        var trk = (run.attrs.tracking ? parseFloat(run.attrs.tracking) : 0) + lineTrk;
        var wsp = run.attrs.wordsp ? parseFloat(run.attrs.wordsp) : 0;
        var bl = run.attrs.baseline ? parseFloat(run.attrs.baseline) : 0;
        Array.from(run.text).forEach(function (ch) {
          items.push({ ch: ch, w: measure(f.str, ch) * hs, f: f, hs: hs, bl: bl,
                       adv: trk + (ch === ' ' ? wsp : 0) });
        });
      });
      var lead = line.attrs.lineheight ? parseFloat(line.attrs.lineheight) : page.leading;
      var lh = maxPx * lead;
      var vOver = tau > t1 - 0.004;
      if (!items.length) { tau += lh / R; return; }
      var total = 0;
      items.forEach(function (it) { total += it.w + page.tracking + it.adv; });
      total -= page.tracking;
      var avail = (sigHi - sigLo) * R;
      var indent = (line.attrs.indent || 0) * page.size * 1.5;
      if (line.attrs.align === 'justify' && items.length > 1) {
        var extra = (avail - indent) - total;
        var spaces = [];
        var sumSw = 0, glyphSum = 0;
        items.forEach(function (it) {
          if (it.ch === ' ') { spaces.push(it); sumSw += it.w; }
          else glyphSum += it.w;
        });
        if (extra > 0) {
          var add = Math.min(extra, Math.max(0, sumSw * (page.jwmax / 100 - 1)));
          if (sumSw > 0) spaces.forEach(function (it) { it.jadd = add * it.w / sumSw; });
          var rem = extra - add;
          if (rem > 0 && glyphSum > 0) {
            var gAdd = Math.min(rem, glyphSum * (page.jgmax / 100 - 1));
            if (gAdd > 0) {
              var gs = 1 + gAdd / glyphSum;
              items.forEach(function (it) { if (it.ch !== ' ') { it.w *= gs; it.hs *= gs; } });
              rem -= gAdd;
            }
          }
          if (rem > 0.01) {
            var tAdd = rem / (items.length - 1);
            items.forEach(function (it, ix) { if (ix < items.length - 1) it.jadd = (it.jadd || 0) + tAdd; });
          }
        } else if (extra < 0) {
          var need = -extra;
          var cut = Math.min(need, Math.max(0, sumSw * (1 - page.jwmin / 100)));
          if (sumSw > 0) spaces.forEach(function (it) { it.jadd = -cut * it.w / sumSw; });
          need -= cut;
          if (need > 0 && glyphSum > 0) {
            var gCut = Math.min(need, glyphSum * (1 - page.jgmin / 100));
            if (gCut > 0) {
              var gs2 = 1 - gCut / glyphSum;
              items.forEach(function (it) { if (it.ch !== ' ') { it.w *= gs2; it.hs *= gs2; } });
            }
          }
        }
      }
      var start;
      if (line.attrs.align === 'center') start = (avail - total) / 2;
      else if (line.attrs.align === 'right') start = avail - total;
      else start = indent;
      var arc = start;
      var ct = Math.cos(tau), st = Math.sin(tau);
      items.forEach(function (it) {
        var sigma = sigLo + (arc + it.w / 2) / R;
        if (it.ch !== ' ') {
          glyphs.push({ sigma: sigma, tau: tau,
                        cs: Math.cos(sigma), ss: Math.sin(sigma), ct: ct, st: st,
                        ch: it.ch, f: it.f, hs: it.hs, bl: it.bl,
                        over: vOver || sigma < sigLo - 0.003 || sigma > sigHi + 0.003 });
        }
        arc += it.w + page.tracking + it.adv + (it.jadd || 0);
      });
      tau += lh / R;
    });
  }

  // No DOM, state mutation, or cache: callers supply font measurement.
  function layoutPage(state, k, measure) {
    var page = state.pages[k];
    var glyphs = [];
    var ranges = colRanges(page, k);
    layoutColumn(state, measure, glyphs, page, page.delta, ranges[0][0], ranges[0][1], k);
    if (ranges.length > 1) layoutColumn(state, measure, glyphs, page, page.delta2, ranges[1][0], ranges[1][1], k);
    return glyphs;
  }
  root.KureLayout = Object.freeze({ layoutPage: layoutPage });
})(typeof window !== 'undefined' ? window : globalThis);
