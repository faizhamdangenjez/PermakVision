import { getCategoryMeta, getDefaultConfigForCategory } from '../data/defaults.js';
import { GarmentSVGEngine } from '../services/svgEngine.js';
import { StorageService } from '../services/storageService.js';
import { Store } from '../state/store.js';
import { escapeHTML } from '../utils/dom.js';

export const LandingView = {
  init(onApplyTemplate) {
    this.onApplyTemplate = onApplyTemplate;

    document.querySelectorAll('[data-hero-demo]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Store.state.heroDemoType = btn.dataset.heroDemo;
        this.renderHeroDemo();
      });
    });

    const featuredGrid = document.getElementById('landingFeaturedGrid');
    if (featuredGrid) {
      featuredGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-apply-template]');
        if (btn && this.onApplyTemplate) {
          this.onApplyTemplate(btn.dataset.applyTemplate);
        }
      });
    }

    this.renderHeroDemo();
    this.renderFeatured();
  },

  renderHeroDemo() {
    const stage = document.getElementById('heroSvgStage');
    const titleEl = document.getElementById('heroShowcaseTitle');
    const costEl = document.getElementById('heroShowcaseCost');
    if (!stage || !titleEl || !costEl) return;

    if (Store.state.heroDemoType === 'jeans') {
      titleEl.textContent = 'Celana Jeans Lurus → 7/8 Tapered Two-Tone';
      costEl.textContent = 'EST. PERMAK: Rp55rb – Rp130rb';
      const beforeCfg = getDefaultConfigForCategory('jeans');
      const afterCfg = {
        ...beforeCfg,
        panjangBawahan: 'ankle',
        pinggang: 'high_waist',
        potonganKaki: 'tapered',
        fittingBawahan: 'slim',
        detailBawahan: ['cargo'],
        twoTone: true,
        secondaryColor: '#FF8A35',
        twoTonePattern: 'bottom_block'
      };
      stage.innerHTML = `
        <div class="hero-svg-pane">
          <span class="sticker sticker-white" style="margin-bottom:0.4rem;">BEFORE (ASLI)</span>
          ${GarmentSVGEngine.renderSVG('jeans', beforeCfg, null, false)}
        </div>
        <div class="hero-svg-pane hero-svg-pane--after">
          <span class="sticker sticker-pink" style="margin-bottom:0.4rem;">AFTER (TWO-TONE)</span>
          ${GarmentSVGEngine.renderSVG('jeans', afterCfg, beforeCfg, true)}
        </div>
      `;
    } else {
      titleEl.textContent = 'Kemeja Oversized → Cropped Two-Tone';
      costEl.textContent = 'EST. PERMAK: Rp65rb – Rp145rb';
      const beforeCfg = getDefaultConfigForCategory('shirt');
      const afterCfg = {
        ...beforeCfg,
        panjangPakaian: -20,
        panjangLengan: '3/4',
        kerah: 'mandarin',
        fitting: 'oversized',
        detail: ['saku', 'plaket'],
        twoTone: true,
        secondaryColor: '#4357FF',
        twoTonePattern: 'sleeves_collar'
      };
      stage.innerHTML = `
        <div class="hero-svg-pane">
          <span class="sticker sticker-white" style="margin-bottom:0.4rem;">BEFORE (ASLI)</span>
          ${GarmentSVGEngine.renderSVG('shirt', beforeCfg, null, false)}
        </div>
        <div class="hero-svg-pane hero-svg-pane--after">
          <span class="sticker sticker-pink" style="margin-bottom:0.4rem;">AFTER (TWO-TONE)</span>
          ${GarmentSVGEngine.renderSVG('shirt', afterCfg, beforeCfg, true)}
        </div>
      `;
    }
  },

  renderFeatured() {
    const grid = document.getElementById('landingFeaturedGrid');
    if (!grid) return;

    const templates = StorageService.getTemplates().slice(0, 3);
    const bgColors = ['var(--yellow)', 'var(--lavender)', 'var(--lime)'];
    grid.innerHTML = templates
      .map((t, idx) => {
        const catObj = getCategoryMeta(t.kategoriPakaian);
        return `
          <article class="feat-card" style="background:${bgColors[idx % 3]};">
            <div>
              <span class="sticker sticker-white">${escapeHTML(catObj.label)}</span>
              <h3 style="font-family:var(--font-display); font-size:1.25rem; margin-top:0.5rem;">${escapeHTML(t.nama)}</h3>
              <div class="feat-svg-box">
                ${GarmentSVGEngine.renderSVG(t.kategoriPakaian, t.konfigurasiDesain, null, false)}
              </div>
              <p style="font-size:0.84rem; margin-bottom:1rem;">${escapeHTML(t.deskripsi)}</p>
            </div>
            <button type="button" class="btn btn-dark btn-sm" data-apply-template="${escapeHTML(t.id)}">Coba di Studio &rarr;</button>
          </article>
        `;
      })
      .join('');
  }
};
