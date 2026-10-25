/* MIT — book composition, not a physical sphere cutting template. */
(function (root) {
  'use strict';
  const MM_PER_PT = 25.4 / 72;
  const BASE_PX = 26.5;
  const BASE_ANGLE = 43.4 * Math.PI / 180;

  function baseSize(state) {
    const sizes = state.pages.map(page => page.size).filter(size => Number.isFinite(size) && size > 0);
    sizes.sort((a, b) => a - b);
    return sizes.length ? sizes[Math.floor(sizes.length / 2)] : BASE_PX;
  }

  function prepareState(input, fontPt, leadingPt, normalizeLeading) {
    const state = JSON.parse(JSON.stringify(input));
    if (!state || !Array.isArray(state.pages) || state.pages.length !== 16 ||
        !Number.isFinite(state.R) || state.R <= 0) {
      throw new Error('16 sayfalı, pozitif yarıçaplı bir çalışma dosyası gerekli.');
    }
    if (!(fontPt > 0) || !(leadingPt > 0)) throw new Error('Punto ve satır aralığı pozitif olmalı.');
    for (const page of state.pages) {
      page.delta2 ??= { ops: [] };
      page.cols ??= 1;
      page.ratio ??= 33;
      page.colgap ??= 1.5;
      page.jwmin ??= 95;
      page.jwmax ??= 220;
      page.jgmin ??= 97;
      page.jgmax ??= 103;
      page.shift ??= 0;
      if (normalizeLeading) {
        page.leading = leadingPt / fontPt * baseSize(state) / page.size;
        for (const delta of [page.delta, page.delta2]) {
          for (const op of delta.ops || []) {
            if (op.attributes) delete op.attributes.lineheight;
          }
        }
      }
    }
    return state;
  }

  function project(glyph, state, page, angleDegrees, squeeze, verticalStretch = 1) {
    const center = ((page >> 1) + 0.5) * Math.PI / 4;
    const tau = glyph.tau - center;
    const bend = angleDegrees * Math.PI / 180 / BASE_ANGLE;
    const sigma = glyph.sigma;
    const u = squeeze * sigma;
    // Integral of the local horizontal scale: no overlapping center advances.
    const x = squeeze > 1e-8 ? state.R * Math.sin(u) / squeeze : state.R * sigma;
    const dx = Math.cos(u);
    const y = state.R * tau * Math.cos(bend * sigma) * verticalStretch;
    const dy = -tau * bend * Math.sin(bend * sigma) * verticalStretch;
    return {
      x, y,
      // Affine tangent frame: horizontal foreshortening; upright glyph height
      // remains the requested point size. At sigma=0, the frame is identity.
      a: dx * (glyph.hs || 1), b: dy * (glyph.hs || 1), c: 0, d: 1
    };
  }

  root.KureBookProjection = {
    MM_PER_PT, BASE_PX, BASE_ANGLE, baseSize, prepareState, project,
    scaleForPointSize: (pt, px = BASE_PX) => pt * MM_PER_PT / px
  };
})(typeof window !== 'undefined' ? window : globalThis);
