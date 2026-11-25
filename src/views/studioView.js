import {
  GARMENT_CATEGORIES,
  TOP_SLEEVE_OPTIONS,
  COLLAR_SHIRT_OPTIONS,
  NECKLINE_KNIT_OPTIONS,
  TOP_BOTTOM_OPTIONS,
  TOP_FITTING_OPTIONS,
  TOP_DETAIL_OPTIONS,
  PANTS_LENGTH_OPTIONS,
  SKIRT_DRESS_LENGTH_OPTIONS,
  WAIST_OPTIONS,
  PANTS_CUT_OPTIONS,
  SKIRT_DRESS_CUT_OPTIONS,
  BOTTOM_FITTING_OPTIONS,
  BOTTOM_DETAIL_OPTIONS,
  TWOTONE_TOP_PATTERNS,
  TWOTONE_BOTTOM_PATTERNS,
  COLOR_SWATCHES,
  getCategoryMeta
} from '../data/defaults.js';
import { GarmentSVGEngine } from '../services/svgEngine.js';
import { CostAndRuleEngine } from '../services/costRuleEngine.js';
import { StorageService } from '../services/storageService.js';
import { Store } from '../state/store.js';
import { escapeHTML, formatIDR, openModal, closeModal, showToast } from '../utils/dom.js';

export const StudioView = {
  currentRecs: [],

  init({ onSaved, onOpenBrief }) {
    this.onSaved = onSaved;
    this.onOpenBrief = onOpenBrief;

    document.getElementById('btnUndo')?.addEventListener('click', () => {
      if (Store.undo()) {
        this.syncUI();
        showToast('Undo ke langkah sebelumnya.');
      }
    });

    document.getElementById('btnResetDesign')?.addEventListener('click', () => {
      Store.resetToInitial();
      this.syncUI();
      showToast('Desain dikembalikan ke kondisi awal.');
    });

    document.getElementById('btnOpenStudioBrief')?.addEventListener('click', () => {
      if (this.onOpenBrief) this.onOpenBrief();
    });

    document.getElementById('btnOpenSaveModal')?.addEventListener('click', () => this.openSaveModal());
    document.getElementById('btnConfirmSaveDesign')?.addEventListener('click', () => this.confirmSaveDesign());

    document.querySelectorAll('.look-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        Store.state.activeAltIndex = Number(btn.dataset.alt);
        this.syncUI();
      });
    });

    document.querySelectorAll('.mode-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        Store.state.comparisonMode = btn.dataset.mode;
        document.querySelectorAll('.mode-pill').forEach((p) => p.classList.toggle('active', p === btn));
        this.renderStage();
      });
    });

    document.getElementById('toggleGuideLines')?.addEventListener('change', () => this.renderStage());

    document.getElementById('studioTemplateSelect')?.addEventListener('change', (e) => {
      const tplId = e.target.value;
      if (!tplId) return;
      const tpl = StorageService.getTemplates().find((t) => t.id === tplId);
      if (tpl) {
        Store.applyTemplate(tpl);
        this.syncUI();
        showToast(`Template "${tpl.nama}" diterapkan!`);
      }
    });

    // Category Chips Delegation
    document.getElementById('categoryChipGroup')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cat]');
      if (!btn) return;
      Store.setCategory(btn.dataset.cat);
      this.syncUI();
    });

    // Adaptive Controls Delegation (Buttons & Smooth Range Slider)
    const adaptiveContainer = document.getElementById('adaptiveControlsContainer');
    adaptiveContainer?.addEventListener('click', (e) => {
      const paramBtn = e.target.closest('[data-param]');
      if (paramBtn) {
        Store.pushUndo();
        Store.activeConfig[paramBtn.dataset.param] = paramBtn.dataset.value;
        this.syncUI();
        return;
      }

      const detailBtn = e.target.closest('[data-detail-key]');
      if (detailBtn) {
        Store.pushUndo();
        const key = detailBtn.dataset.detailKey;
        const val = detailBtn.dataset.detailVal;
        const list = Store.activeConfig[key] || [];
        const idx = list.indexOf(val);
        if (idx >= 0) list.splice(idx, 1);
        else list.push(val);
        Store.activeConfig[key] = list;
        this.syncUI();
      }
    });

    // Smooth slider dragging without replacing slider DOM
    let sliderSnapshotPushed = false;
    adaptiveContainer?.addEventListener('pointerdown', (e) => {
      if (e.target.matches('[data-range-param]')) {
        sliderSnapshotPushed = false;
      }
    });
    adaptiveContainer?.addEventListener('input', (e) => {
      if (!e.target.matches('[data-range-param]')) return;
      if (!sliderSnapshotPushed) {
        Store.pushUndo();
        sliderSnapshotPushed = true;
      }
      const val = Number(e.target.value);
      Store.activeConfig[e.target.dataset.rangeParam] = val;
      const badge = document.getElementById('lengthBadgeValue');
      if (badge) {
        badge.textContent = val === 0 ? 'Standar (0%)' : val < 0 ? `Crop ${val}%` : `Extend +${val}%`;
      }
      document.getElementById('btnUndo').disabled = Store.state.undoStack.length === 0;
      this.renderCost();
      this.renderStage();
    });

    // Two-Tone & Color Controls
    document.getElementById('btnColorSolid')?.addEventListener('click', () => {
      Store.pushUndo();
      Store.activeConfig.twoTone = false;
      this.syncUI();
    });

    document.getElementById('btnColorTwoTone')?.addEventListener('click', () => {
      Store.pushUndo();
      Store.activeConfig.twoTone = true;
      const meta = getCategoryMeta(Store.state.category);
      if (!Store.activeConfig.twoTonePattern) {
        Store.activeConfig.twoTonePattern = meta.group.startsWith('bottom') ? 'left_right' : 'sleeves_collar';
      }
      this.syncUI();
    });

    document.getElementById('btnSwapColors')?.addEventListener('click', () => {
      Store.pushUndo();
      const tmp = Store.activeConfig.primaryColor;
      Store.activeConfig.primaryColor = Store.activeConfig.secondaryColor;
      Store.activeConfig.secondaryColor = tmp;
      this.syncUI();
      showToast('Warna Utama & Warna Alternatif ditukar!');
    });

    document.getElementById('primarySwatchesRow')?.addEventListener('click', (e) => {
      const swatch = e.target.closest('[data-color]');
      if (!swatch) return;
      Store.pushUndo();
      Store.activeConfig.primaryColor = swatch.dataset.color;
      this.syncUI();
    });
    document.getElementById('primarySwatchesRow')?.addEventListener('change', (e) => {
      if (e.target.matches('[data-color-picker]')) {
        Store.pushUndo();
        Store.activeConfig.primaryColor = e.target.value;
        this.syncUI();
      }
    });

    document.getElementById('secondarySwatchesRow')?.addEventListener('click', (e) => {
      const swatch = e.target.closest('[data-color]');
      if (!swatch) return;
      Store.pushUndo();
      Store.activeConfig.secondaryColor = swatch.dataset.color;
      this.syncUI();
    });
    document.getElementById('secondarySwatchesRow')?.addEventListener('change', (e) => {
      if (e.target.matches('[data-color-picker]')) {
        Store.pushUndo();
        Store.activeConfig.secondaryColor = e.target.value;
        this.syncUI();
      }
    });

    document.getElementById('twoTonePatternGroup')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-pattern]');
      if (!btn) return;
      Store.pushUndo();
      Store.activeConfig.twoTonePattern = btn.dataset.pattern;
      this.syncUI();
    });

    document.getElementById('studioRecommendations')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-rec-id]');
      if (!btn) return;
      const rec = this.currentRecs.find((r) => r.id === btn.dataset.recId);
      if (!rec) return;
      Store.pushUndo();
      Object.assign(Store.activeConfig, JSON.parse(JSON.stringify(rec.patch)));
      this.syncUI();
      showToast('Rekomendasi permak diterapkan!');
    });

    document.getElementById('studioTailorNotes')?.addEventListener('input', (e) => {
      Store.state.tailorNotes = e.target.value;
    });
  },

  refreshTemplateDropdown() {
    const select = document.getElementById('studioTemplateSelect');
    if (!select) return;
    const templates = StorageService.getTemplates();
    select.innerHTML = '<option value="">-- Pilih Template Desain --</option>';
    templates.forEach((t) => {
      const catObj = getCategoryMeta(t.kategoriPakaian);
      select.appendChild(new Option(`${t.nama} [${catObj.label}]`, t.id));
    });
  },

  syncUI() {
    const cfg = Store.activeConfig;
    const meta = getCategoryMeta(Store.state.category);

    document.querySelectorAll('.look-tab').forEach((b) => {
      const active = Number(b.dataset.alt) === Store.state.activeAltIndex;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
    });

    const editTag = document.getElementById('studioEditingTag');
    if (editTag) editTag.hidden = !Store.state.editingDesignId;

    const undoBtn = document.getElementById('btnUndo');
    if (undoBtn) undoBtn.disabled = Store.state.undoStack.length === 0;

    document.getElementById('studioGarmentTitle').textContent = Store.state.designTitle;

    const archetypeLabels = {
      top_collar: 'MODE: ATASAN BERKERAH',
      top_knit: 'MODE: ATASAN LEHER / KAOS',
      bottom_pants: 'MODE: CELANA',
      bottom_skirt: 'MODE: ROK',
      dress: 'MODE: DRESS'
    };
    document.getElementById('studioArchetypeTag').textContent = archetypeLabels[meta.group] || meta.label;
    document.getElementById('studioColorModeTag').textContent = cfg.twoTone ? '2 WARNA (TWO-TONE)' : '1 WARNA (SOLID)';

    document.getElementById('categoryChipGroup').innerHTML = GARMENT_CATEGORIES.map(
      (c) =>
        `<button type="button" class="choice-chip ${c.id === Store.state.category ? 'active' : ''}" data-cat="${c.id}">${escapeHTML(c.label)}</button>`
    ).join('');

    this.renderAdaptiveControls(meta, cfg);

    document.getElementById('btnColorSolid').className = !cfg.twoTone ? 'choice-chip active' : 'choice-chip';
    document.getElementById('btnColorTwoTone').className = cfg.twoTone ? 'choice-chip active-pink' : 'choice-chip';
    document.getElementById('btnSwapColors').hidden = !cfg.twoTone;
    document.getElementById('twoToneControlsBox').hidden = !cfg.twoTone;

    document.getElementById('valPrimaryHex').textContent = cfg.primaryColor;
    document.getElementById('primarySwatchesRow').innerHTML =
      COLOR_SWATCHES.map(
        (sw) =>
          `<button type="button" class="color-chip ${cfg.primaryColor.toUpperCase() === sw.hex ? 'active' : ''}" style="background:${sw.hex};" title="${sw.name}" aria-label="${sw.name}" data-color="${sw.hex}"></button>`
      ).join('') +
      `<input type="color" class="native-color-picker" aria-label="Pilih warna utama kustom" value="${escapeHTML(cfg.primaryColor)}" data-color-picker="primary" />`;

    if (cfg.twoTone) {
      document.getElementById('valSecondaryHex').textContent = cfg.secondaryColor;
      document.getElementById('secondarySwatchesRow').innerHTML =
        COLOR_SWATCHES.map(
          (sw) =>
            `<button type="button" class="color-chip ${cfg.secondaryColor.toUpperCase() === sw.hex ? 'active' : ''}" style="background:${sw.hex};" title="${sw.name}" aria-label="${sw.name}" data-color="${sw.hex}"></button>`
        ).join('') +
        `<input type="color" class="native-color-picker" aria-label="Pilih warna kedua kustom" value="${escapeHTML(cfg.secondaryColor)}" data-color-picker="secondary" />`;

      const patternList = meta.group.startsWith('bottom') ? TWOTONE_BOTTOM_PATTERNS : TWOTONE_TOP_PATTERNS;
      document.getElementById('twoTonePatternGroup').innerHTML = patternList
        .map(
          (p) =>
            `<button type="button" class="choice-chip ${cfg.twoTonePattern === p.id ? 'active-pink' : ''}" data-pattern="${p.id}">${escapeHTML(p.label)}</button>`
        )
        .join('');
    }

    document.getElementById('studioTailorNotes').value = Store.state.tailorNotes;

    this.renderRecommendations();
    this.renderCost();
    this.renderStage();
  },

  renderChipRow(paramName, currentVal, options) {
    return options
      .map(
        (o) =>
          `<button type="button" class="choice-chip ${currentVal === o.id ? 'active' : ''}" data-param="${paramName}" data-value="${o.id}">${escapeHTML(o.label)}</button>`
      )
      .join('');
  },

  renderDetailRow(arrayKey, activeList, options) {
    return options
      .map((o) => {
        const active = activeList.includes(o.id);
        return `<button type="button" class="choice-chip ${active ? 'active' : ''}" data-detail-key="${arrayKey}" data-detail-val="${o.id}">${active ? '&#10003; ' : '+ '}${escapeHTML(o.label)}</button>`;
      })
      .join('');
  },

  renderAdaptiveControls(meta, cfg) {
    const headerEl = document.getElementById('adaptiveCtrlHeader');
    const box = document.getElementById('adaptiveControlsContainer');

    if (meta.group === 'bottom_pants') {
      headerEl.textContent = `2. Kontrol Permak ${meta.label} (Khusus Celana)`;
      const activeDets = cfg.detailBawahan || [];
      box.innerHTML = `
        <div class="form-block">
          <label class="field-label">Panjang Celana</label>
          <div class="chip-group">${this.renderChipRow('panjangBawahan', cfg.panjangBawahan, PANTS_LENGTH_OPTIONS)}</div>
        </div>
        <div class="form-block">
          <label class="field-label">Model Pinggang</label>
          <div class="chip-group">${this.renderChipRow('pinggang', cfg.pinggang, WAIST_OPTIONS)}</div>
        </div>
        <div class="form-block">
          <label class="field-label">Potongan Kaki Celana (Hem &amp; Leg Cut)</label>
          <div class="chip-group">${this.renderChipRow('potonganKaki', cfg.potonganKaki, PANTS_CUT_OPTIONS)}</div>
        </div>
        <div class="form-block">
          <label class="field-label">Fitting Pinggul &amp; Paha</label>
          <div class="chip-group">${this.renderChipRow('fittingBawahan', cfg.fittingBawahan, BOTTOM_FITTING_OPTIONS)}</div>
        </div>
        <div class="form-block">
          <label class="field-label">Detail &amp; Saku Bawahan</label>
          <div class="chip-group">${this.renderDetailRow('detailBawahan', activeDets, BOTTOM_DETAIL_OPTIONS)}</div>
        </div>
      `;
      return;
    }

    if (meta.group === 'bottom_skirt') {
      headerEl.textContent = '2. Kontrol Permak Rok (Khusus Rok)';
      const activeDets = cfg.detailBawahan || [];
      box.innerHTML = `
        <div class="form-block">
          <label class="field-label">Panjang Rok</label>
          <div class="chip-group">${this.renderChipRow('panjangBawahan', cfg.panjangBawahan, SKIRT_DRESS_LENGTH_OPTIONS)}</div>
        </div>
        <div class="form-block">
          <label class="field-label">Model Pinggang</label>
          <div class="chip-group">${this.renderChipRow('pinggang', cfg.pinggang, WAIST_OPTIONS)}</div>
        </div>
        <div class="form-block">
          <label class="field-label">Siluet &amp; Potongan Rok</label>
          <div class="chip-group">${this.renderChipRow('potonganKaki', cfg.potonganKaki, SKIRT_DRESS_CUT_OPTIONS)}</div>
        </div>
        <div class="form-block">
          <label class="field-label">Fitting Pinggul</label>
          <div class="chip-group">${this.renderChipRow('fittingBawahan', cfg.fittingBawahan, BOTTOM_FITTING_OPTIONS)}</div>
        </div>
        <div class="form-block">
          <label class="field-label">Detail Dekoratif Rok</label>
          <div class="chip-group">${this.renderDetailRow('detailBawahan', activeDets, BOTTOM_DETAIL_OPTIONS)}</div>
        </div>
      `;
      return;
    }

    if (meta.group === 'dress') {
      headerEl.textContent = '2. Kontrol Permak Dress';
      const activeDets = cfg.detail || [];
      box.innerHTML = `
        <div class="form-block">
          <label class="field-label">Panjang Dress</label>
          <div class="chip-group">${this.renderChipRow('panjangBawahan', cfg.panjangBawahan, SKIRT_DRESS_LENGTH_OPTIONS)}</div>
        </div>
        <div class="form-block">
          <label class="field-label">Panjang Lengan</label>
          <div class="chip-group">${this.renderChipRow('panjangLengan', cfg.panjangLengan, TOP_SLEEVE_OPTIONS)}</div>
        </div>
        <div class="form-block">
          <label class="field-label">Model Garis Leher</label>
          <div class="chip-group">${this.renderChipRow('kerah', cfg.kerah, NECKLINE_KNIT_OPTIONS)}</div>
        </div>
        <div class="form-block">
          <label class="field-label">Potongan Rok Bawah Dress</label>
          <div class="chip-group">${this.renderChipRow('modelBawah', cfg.modelBawah, SKIRT_DRESS_CUT_OPTIONS)}</div>
        </div>
        <div class="form-block">
          <label class="field-label">Fitting Pinggang &amp; Badan</label>
          <div class="chip-group">${this.renderChipRow('fitting', cfg.fitting, TOP_FITTING_OPTIONS)}</div>
        </div>
        <div class="form-block">
          <label class="field-label">Detail Dress</label>
          <div class="chip-group">${this.renderDetailRow('detail', activeDets, TOP_DETAIL_OPTIONS)}</div>
        </div>
      `;
      return;
    }

    headerEl.textContent = `2. Kontrol Permak ${meta.label} (Khusus Atasan)`;
    const len = cfg.panjangPakaian || 0;
    const lenLabel = len === 0 ? 'Standar (0%)' : len < 0 ? `Crop ${len}%` : `Extend +${len}%`;
    const collarOpts = meta.group === 'top_collar' ? COLLAR_SHIRT_OPTIONS : NECKLINE_KNIT_OPTIONS;
    const activeDets = cfg.detail || [];

    box.innerHTML = `
      <div class="form-block">
        <label class="field-label" for="rangePanjangPakaian">
          <span>Panjang Pakaian (Crop / Extend)</span>
          <span class="sticker sticker-orange" id="lengthBadgeValue">${lenLabel}</span>
        </label>
        <input type="range" id="rangePanjangPakaian" class="range-bar" min="-30" max="15" step="5" value="${len}" data-range-param="panjangPakaian" />
      </div>
      <div class="form-block">
        <label class="field-label">Panjang Lengan</label>
        <div class="chip-group">${this.renderChipRow('panjangLengan', cfg.panjangLengan, TOP_SLEEVE_OPTIONS)}</div>
      </div>
      <div class="form-block">
        <label class="field-label">${meta.group === 'top_collar' ? 'Model Kerah' : 'Bentuk Garis Leher'}</label>
        <div class="chip-group">${this.renderChipRow('kerah', cfg.kerah, collarOpts)}</div>
      </div>
      <div class="form-block">
        <label class="field-label">Model Bagian Bawah Baju</label>
        <div class="chip-group">${this.renderChipRow('modelBawah', cfg.modelBawah, TOP_BOTTOM_OPTIONS)}</div>
      </div>
      <div class="form-block">
        <label class="field-label">Fitting Badan</label>
        <div class="chip-group">${this.renderChipRow('fitting', cfg.fitting, TOP_FITTING_OPTIONS)}</div>
      </div>
      <div class="form-block">
        <label class="field-label">Detail Atasan</label>
        <div class="chip-group">${this.renderDetailRow('detail', activeDets, TOP_DETAIL_OPTIONS)}</div>
      </div>
    `;
  },

  renderStage() {
    const stage = document.getElementById('studioCanvasStage');
    if (!stage) return;

    const showGuides = document.getElementById('toggleGuideLines')?.checked ?? true;
    const lookLabel = ['Look A', 'Look B', 'Look C'][Store.state.activeAltIndex];
    const afterSVG = GarmentSVGEngine.renderSVG(Store.state.category, Store.activeConfig, Store.state.initialConfig, showGuides);
    const beforeSVG = GarmentSVGEngine.renderSVG(Store.state.category, Store.state.initialConfig, null, false);

    if (Store.state.comparisonMode === 'after') {
      stage.innerHTML = `
        <div class="svg-single-box">
          <div class="svg-single-overlay-tags">
            <span class="sticker sticker-pink">AFTER (${lookLabel})</span>
            ${
              Store.activeConfig.twoTone
                ? `<span class="sticker sticker-yellow">TWO-TONE: ${escapeHTML(Store.activeConfig.primaryColor)} + ${escapeHTML(Store.activeConfig.secondaryColor)}</span>`
                : ''
            }
          </div>
          ${afterSVG}
        </div>
      `;
    } else if (Store.state.comparisonMode === 'side') {
      stage.innerHTML = `
        <div class="svg-side-grid">
          <div class="svg-side-card">
            <span class="sticker sticker-white">BEFORE (KONDISI AWAL)</span>
            ${beforeSVG}
            <span style="font-size:0.74rem; color:var(--muted);">Pola asli sebelum permak</span>
          </div>
          <div class="svg-side-card svg-side-card--after">
            <span class="sticker sticker-pink">AFTER (${lookLabel})</span>
            ${afterSVG}
            <span style="font-size:0.74rem; color:var(--charcoal); font-weight:700;">Target hasil permak</span>
          </div>
        </div>
      `;
    } else {
      stage.innerHTML = `
        <div style="text-align:center; margin-bottom:0.5rem;">
          <span class="sticker sticker-yellow">Geser Handle Pink atau Gunakan Panah Kiri/Kanan</span>
        </div>
        <div class="split-stage" id="studioSplitStage" tabindex="0" role="slider" aria-label="Perbandingan Before dan After" aria-valuemin="5" aria-valuemax="95" aria-valuenow="${Math.round(Store.state.splitPercent)}">
          <div class="split-pane split-pane--after">
            ${afterSVG}
            <span class="sticker sticker-pink" style="position:absolute; top:12px; right:12px;">AFTER (${lookLabel})</span>
          </div>
          <div class="split-pane" id="studioSplitBefore" style="clip-path: inset(0 ${100 - Store.state.splitPercent}% 0 0);">
            ${beforeSVG}
            <span class="sticker sticker-white" style="position:absolute; top:12px; left:12px;">BEFORE</span>
          </div>
          <div class="split-bar" id="studioSplitBar" style="left: ${Store.state.splitPercent}%;">
            <div class="split-knob">&#8596;</div>
          </div>
        </div>
      `;
      this.bindSplitPointerEvents();
    }
  },

  bindSplitPointerEvents() {
    const box = document.getElementById('studioSplitStage');
    const bar = document.getElementById('studioSplitBar');
    const before = document.getElementById('studioSplitBefore');
    if (!box || !bar || !before) return;

    const updatePercent = (pct) => {
      const clamped = Math.max(5, Math.min(95, pct));
      Store.state.splitPercent = clamped;
      bar.style.left = `${clamped}%`;
      before.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
      box.setAttribute('aria-valuenow', String(Math.round(clamped)));
    };

    const moveByClientX = (clientX) => {
      const rect = box.getBoundingClientRect();
      if (!rect.width) return;
      updatePercent(((clientX - rect.left) / rect.width) * 100);
    };

    let dragging = false;
    box.addEventListener('pointerdown', (e) => {
      dragging = true;
      box.setPointerCapture(e.pointerId);
      moveByClientX(e.clientX);
    });
    box.addEventListener('pointermove', (e) => {
      if (dragging) moveByClientX(e.clientX);
    });
    const endDrag = (e) => {
      if (dragging) {
        dragging = false;
        if (box.hasPointerCapture(e.pointerId)) {
          box.releasePointerCapture(e.pointerId);
        }
      }
    };
    box.addEventListener('pointerup', endDrag);
    box.addEventListener('pointercancel', endDrag);

    box.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        updatePercent(Store.state.splitPercent - 5);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        updatePercent(Store.state.splitPercent + 5);
      }
    });
  },

  renderRecommendations() {
    const container = document.getElementById('studioRecommendations');
    if (!container) return;
    this.currentRecs = CostAndRuleEngine.getRecommendations(Store.state.category);
    container.innerHTML = this.currentRecs
      .map(
        (r) => `
        <div class="rec-card">
          <div>
            <strong style="font-size:0.84rem; display:block;">${escapeHTML(r.title)}</strong>
            <span style="font-size:0.76rem; color:var(--charcoal);">${escapeHTML(r.desc)}</span>
          </div>
          <button type="button" class="btn btn-white btn-sm" data-rec-id="${escapeHTML(r.id)}">Terapkan</button>
        </div>
      `
      )
      .join('');
  },

  renderCost() {
    const jenisList = StorageService.getJenisPermak();
    const evalRes = CostAndRuleEngine.evaluateChanges(
      Store.state.category,
      Store.state.initialConfig,
      Store.activeConfig,
      jenisList
    );

    const priceEl = document.getElementById('studioCostRange');
    const diffEl = document.getElementById('studioDifficultyTag');
    const listEl = document.getElementById('studioChangeList');

    if (evalRes.changes.length === 0) {
      priceEl.textContent = 'Rp0';
      diffEl.textContent = 'Belum Ada Perubahan';
      diffEl.className = 'sticker sticker-white';
      listEl.innerHTML = '<li>Ubah parameter kontrol di atas untuk menghitung simulasi biaya permak.</li>';
    } else {
      priceEl.textContent = `${formatIDR(evalRes.totalMin)} – ${formatIDR(evalRes.totalMax)}`;
      diffEl.textContent = evalRes.difficulty;
      diffEl.className =
        'sticker ' +
        (evalRes.difficulty === 'Sulit'
          ? 'sticker-pink'
          : evalRes.difficulty === 'Sedang'
          ? 'sticker-orange'
          : 'sticker-lime');
      listEl.innerHTML = evalRes.changes
        .map(
          (c) => `
          <li>
            <span><strong>${escapeHTML(c.nama)}:</strong> ${escapeHTML(c.detail)}</span>
            <strong class="mono">${formatIDR(c.biayaMin)}–${formatIDR(c.biayaMax)}</strong>
          </li>
        `
        )
        .join('');
    }
  },

  openSaveModal() {
    const lookLabel = ['Look A', 'Look B', 'Look C'][Store.state.activeAltIndex];
    document.getElementById('saveDesignNameInput').value = Store.state.editingDesignId
      ? Store.state.designTitle
      : `${Store.state.designTitle} (${lookLabel})`;
    document.getElementById('saveDesignNotesInput').value = Store.state.tailorNotes;
    openModal('saveDesignModal');
  },

  confirmSaveDesign() {
    const name = document.getElementById('saveDesignNameInput').value.trim() || 'Desain Permak Kustom';
    const notes = document.getElementById('saveDesignNotesInput').value.trim();
    Store.state.tailorNotes = notes;

    const jenisList = StorageService.getJenisPermak();
    const evalRes = CostAndRuleEngine.evaluateChanges(
      Store.state.category,
      Store.state.initialConfig,
      Store.activeConfig,
      jenisList
    );
    const designs = StorageService.getDesigns();
    const now = new Date().toISOString();

    const record = {
      id: Store.state.editingDesignId || 'dsn_' + Date.now(),
      namaDesain: name,
      kategoriPakaian: Store.state.category,
      konfigurasiAwal: JSON.parse(JSON.stringify(Store.state.initialConfig)),
      konfigurasiDesain: JSON.parse(JSON.stringify(Store.activeConfig)),
      daftarPerubahan: evalRes.changes,
      catatan: notes,
      estimasiBiaya: { min: evalRes.totalMin, max: evalRes.totalMax },
      tingkatKesulitan: evalRes.difficulty,
      tanggalDibuat: now,
      tanggalDiperbarui: now
    };

    const idx = designs.findIndex((d) => d.id === record.id);
    if (idx >= 0) {
      record.tanggalDibuat = designs[idx].tanggalDibuat;
      designs[idx] = record;
    } else {
      designs.unshift(record);
    }

    if (StorageService.saveDesigns(designs)) {
      Store.state.editingDesignId = record.id;
      Store.state.designTitle = name;
      closeModal('saveDesignModal');
      this.syncUI();
      if (this.onSaved) this.onSaved();
      showToast(`Desain "${name}" tersimpan di My Designs!`);
    }
  }
};
