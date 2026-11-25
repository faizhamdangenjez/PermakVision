import { GARMENT_CATEGORIES, getCategoryMeta } from '../data/defaults.js';
import { GarmentSVGEngine } from '../services/svgEngine.js';
import { StorageService } from '../services/storageService.js';
import { escapeHTML, formatIDR, openModal, closeModal } from '../utils/dom.js';

export const CatalogView = {
  init({ onApplyTemplate }) {
    this.onApplyTemplate = onApplyTemplate;

    const catFilter = document.getElementById('catalogFilterCategory');
    if (catFilter) {
      GARMENT_CATEGORIES.forEach((c) => catFilter.appendChild(new Option(c.label, c.id)));
      catFilter.addEventListener('change', () => this.render());
    }

    document.getElementById('catalogSearch')?.addEventListener('input', () => this.render());
    document.getElementById('catalogFilterType')?.addEventListener('change', () => this.render());

    document.getElementById('catalogGrid')?.addEventListener('click', (e) => {
      const detailBtn = e.target.closest('[data-detail-id]');
      if (detailBtn) {
        this.showDetail(detailBtn.dataset.detailId);
        return;
      }
      const useBtn = e.target.closest('[data-use-id]');
      if (useBtn && this.onApplyTemplate) {
        this.onApplyTemplate(useBtn.dataset.useId);
      }
    });

    document.getElementById('templateDetailContent')?.addEventListener('click', (e) => {
      const remixBtn = e.target.closest('[data-remix-id]');
      if (remixBtn) {
        closeModal('templateDetailModal');
        if (this.onApplyTemplate) this.onApplyTemplate(remixBtn.dataset.remixId);
      }
    });

    this.refreshTypeFilter();
    this.render();
  },

  refreshTypeFilter() {
    const typeFilter = document.getElementById('catalogFilterType');
    if (!typeFilter) return;
    const current = typeFilter.value;
    typeFilter.innerHTML = '<option value="all">Semua Jenis Perubahan</option>';
    StorageService.getJenisPermak().forEach((j) => {
      typeFilter.appendChild(new Option(j.nama, j.kategori));
    });
    typeFilter.value = current || 'all';
  },

  render() {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;

    const templates = StorageService.getTemplates();
    const q = (document.getElementById('catalogSearch')?.value || '').toLowerCase().trim();
    const cat = document.getElementById('catalogFilterCategory')?.value || 'all';
    const type = document.getElementById('catalogFilterType')?.value || 'all';

    const filtered = templates.filter((t) => {
      const matchQ = !q || t.nama.toLowerCase().includes(q) || t.deskripsi.toLowerCase().includes(q);
      const matchC = cat === 'all' || t.kategoriPakaian === cat;
      const matchT = type === 'all' || t.kategoriPermak === type;
      return matchQ && matchC && matchT;
    });

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="studio-card" style="grid-column:1/-1; text-align:center; padding:3rem;">
          <h3>Tidak ada template yang cocok</h3>
          <p style="color:var(--muted);">Coba ubah filter atau kata kunci pencarian Anda.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map((t) => {
        const catObj = getCategoryMeta(t.kategoriPakaian);
        const svgThumb = GarmentSVGEngine.renderSVG(t.kategoriPakaian, t.konfigurasiDesain, null, false);
        return `
          <article class="studio-card catalog-card">
            <div class="catalog-thumb">
              ${svgThumb}
              <span class="sticker sticker-yellow" style="position:absolute; top:10px; left:10px;">${escapeHTML(catObj.label)}</span>
              <span class="sticker sticker-lime" style="position:absolute; top:10px; right:10px;">${escapeHTML(t.tingkatKesulitan)}</span>
            </div>
            <div class="catalog-body">
              <h3 style="font-family:var(--font-display); font-size:1.08rem; margin-bottom:0.35rem;">${escapeHTML(t.nama)}</h3>
              <p style="font-size:0.83rem; color:var(--muted); margin-bottom:0.65rem;">${escapeHTML(t.deskripsi)}</p>
              <div style="font-size:0.84rem;">
                Estimasi: <strong>${formatIDR(t.estimasiBiaya.min)} – ${formatIDR(t.estimasiBiaya.max)}</strong>
              </div>
              <div class="catalog-actions">
                <button type="button" class="btn btn-white btn-sm" data-detail-id="${escapeHTML(t.id)}">Detail</button>
                <button type="button" class="btn btn-cobalt btn-sm" style="flex:1;" data-use-id="${escapeHTML(t.id)}">Gunakan Template</button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  },

  showDetail(id) {
    const t = StorageService.getTemplates().find((item) => item.id === id);
    if (!t) return;

    const catObj = getCategoryMeta(t.kategoriPakaian);
    const svgPreview = GarmentSVGEngine.renderSVG(t.kategoriPakaian, t.konfigurasiDesain, null, true);

    document.getElementById('templateDetailContent').innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.85rem;">
        <div>
          <span class="sticker sticker-lime">${escapeHTML(catObj.label)} &bull; ${escapeHTML(t.tingkatKesulitan)}</span>
          <h2 style="font-size:1.6rem; margin-top:0.35rem;">${escapeHTML(t.nama)}</h2>
        </div>
        <button type="button" class="btn btn-white btn-sm" data-close-modal="templateDetailModal" aria-label="Tutup">&times;</button>
      </div>
      <div style="background:var(--gray-bg); border:var(--border-ink); border-radius:12px; padding:1rem; text-align:center; margin-bottom:0.9rem;">
        <div style="max-width:210px; margin:0 auto;">${svgPreview}</div>
      </div>
      <p style="font-size:0.88rem; color:var(--muted); margin-bottom:0.85rem;">${escapeHTML(t.deskripsi)}</p>
      <div style="background:var(--yellow); border:1.5px solid var(--charcoal); padding:0.85rem; border-radius:10px; font-size:0.84rem; margin-bottom:1.1rem;">
        <strong>Estimasi Biaya Simulasi:</strong> ${formatIDR(t.estimasiBiaya.min)} – ${formatIDR(t.estimasiBiaya.max)}
      </div>
      <div class="modal-footer-actions">
        <button type="button" class="btn btn-white btn-sm" data-close-modal="templateDetailModal">Tutup</button>
        <button type="button" class="btn btn-cobalt btn-sm" data-remix-id="${escapeHTML(t.id)}">Remix di Studio &rarr;</button>
      </div>
    `;
    openModal('templateDetailModal');
  }
};
