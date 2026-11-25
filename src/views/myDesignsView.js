import { getCategoryMeta } from '../data/defaults.js';
import { GarmentSVGEngine } from '../services/svgEngine.js';
import { StorageService } from '../services/storageService.js';
import { Store } from '../state/store.js';
import { escapeHTML, formatIDR, formatDateID, openConfirm, showToast } from '../utils/dom.js';

export const MyDesignsView = {
  init({ onEditDesign, onOpenBrief, onNewDesign, onDesignsChanged }) {
    this.onEditDesign = onEditDesign;
    this.onOpenBrief = onOpenBrief;
    this.onNewDesign = onNewDesign;
    this.onDesignsChanged = onDesignsChanged;

    document.getElementById('btnNewDesignFromList')?.addEventListener('click', () => {
      if (this.onNewDesign) this.onNewDesign();
    });

    document.getElementById('btnExportDesigns')?.addEventListener('click', () => {
      StorageService.exportDesignsJSON();
      showToast('File backup JSON berhasil diunduh.');
    });

    document.getElementById('inputImportDesigns')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const total = await StorageService.importDesignsJSON(file);
        this.render();
        if (this.onDesignsChanged) this.onDesignsChanged();
        showToast(`Import berhasil! Total ${total} desain di koleksi.`);
      } catch {
        showToast('Gagal membaca file JSON.');
      } finally {
        e.target.value = '';
      }
    });

    document.getElementById('myDesignsContainer')?.addEventListener('click', (e) => {
      const startBtn = e.target.closest('[data-start-studio]');
      if (startBtn && this.onNewDesign) {
        this.onNewDesign();
        return;
      }

      const editBtn = e.target.closest('[data-edit-id]');
      if (editBtn) {
        const d = StorageService.getDesigns().find((item) => item.id === editBtn.dataset.editId);
        if (d && this.onEditDesign) this.onEditDesign(d);
        return;
      }

      const briefBtn = e.target.closest('[data-brief-id]');
      if (briefBtn && this.onOpenBrief) {
        this.onOpenBrief(briefBtn.dataset.briefId);
        return;
      }

      const delBtn = e.target.closest('[data-delete-id]');
      if (delBtn) {
        const id = delBtn.dataset.deleteId;
        openConfirm('Hapus Desain Tersimpan?', 'Desain ini akan dihapus permanen dari penyimpanan lokal browser.', () => {
          const remaining = StorageService.getDesigns().filter((d) => d.id !== id);
          StorageService.saveDesigns(remaining);
          if (Store.state.editingDesignId === id) Store.state.editingDesignId = null;
          this.render();
          if (this.onDesignsChanged) this.onDesignsChanged();
          showToast('Desain berhasil dihapus.');
        });
      }
    });

    this.render();
  },

  render() {
    const container = document.getElementById('myDesignsContainer');
    if (!container) return;

    const designs = StorageService.getDesigns();
    if (!designs.length) {
      container.innerHTML = `
        <div class="studio-card" style="text-align:center; padding:3.5rem 1.5rem; background:var(--white);">
          <span class="sticker sticker-yellow" style="margin-bottom:0.75rem;">EMPTY WARDROBE</span>
          <h3 style="font-family:var(--font-display); font-size:1.5rem; margin-bottom:0.5rem;">Belum Ada Desain Permak Tersimpan</h3>
          <p style="font-size:0.9rem; color:var(--muted); max-width:450px; margin:0 auto 1.25rem;">
            Eksplorasi perubahan pakaian di Design Studio dan simpan ke koleksi Anda untuk dibandingkan atau dicetak menjadi Design Brief.
          </p>
          <button type="button" class="btn btn-cobalt" data-start-studio="true">Buka Design Studio</button>
        </div>
      `;
      return;
    }

    container.innerHTML =
      `<div class="cards-grid">` +
      designs
        .map((d) => {
          const catObj = getCategoryMeta(d.kategoriPakaian);
          const dateStr = formatDateID(d.tanggalDiperbarui, false);
          const svgThumb = GarmentSVGEngine.renderSVG(d.kategoriPakaian, d.konfigurasiDesain, null, false);
          return `
            <article class="studio-card catalog-card">
              <div class="catalog-thumb">
                ${svgThumb}
                <span class="sticker sticker-yellow" style="position:absolute; top:10px; left:10px;">${escapeHTML(catObj.label)}</span>
                <span class="sticker sticker-pink" style="position:absolute; top:10px; right:10px;">${escapeHTML(d.tingkatKesulitan)}</span>
              </div>
              <div class="catalog-body">
                <h3 style="font-family:var(--font-display); font-size:1.08rem; margin-bottom:0.25rem;">${escapeHTML(d.namaDesain)}</h3>
                <div style="font-size:0.78rem; color:var(--muted); margin-bottom:0.55rem;">
                  Diperbarui: ${escapeHTML(dateStr)} &bull; ${d.daftarPerubahan.length} perubahan
                </div>
                <div style="font-size:0.86rem; margin-bottom:0.5rem;">
                  Estimasi: <strong>${formatIDR(d.estimasiBiaya.min)} – ${formatIDR(d.estimasiBiaya.max)}</strong>
                </div>
                <div class="catalog-actions">
                  <button type="button" class="btn btn-white btn-sm" data-edit-id="${escapeHTML(d.id)}">Edit</button>
                  <button type="button" class="btn btn-lime btn-sm" data-brief-id="${escapeHTML(d.id)}">Design Brief</button>
                  <button type="button" class="btn btn-pink btn-sm" style="margin-left:auto;" data-delete-id="${escapeHTML(d.id)}">Hapus</button>
                </div>
              </div>
            </article>
          `;
        })
        .join('') +
      `</div>`;
  }
};
