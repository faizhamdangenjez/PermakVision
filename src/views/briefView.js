import { getCategoryMeta } from '../data/defaults.js';
import { GarmentSVGEngine } from '../services/svgEngine.js';
import { CostAndRuleEngine } from '../services/costRuleEngine.js';
import { StorageService } from '../services/storageService.js';
import { Store } from '../state/store.js';
import { escapeHTML, formatIDR, formatDateID } from '../utils/dom.js';

export const BriefView = {
  init() {
    document.getElementById('briefDesignSelector')?.addEventListener('change', (e) => {
      Store.state.selectedBriefId = e.target.value;
      this.render();
    });

    document.getElementById('btnPrintBrief')?.addEventListener('click', () => {
      window.print();
    });
  },

  render() {
    const designs = StorageService.getDesigns();
    const selector = document.getElementById('briefDesignSelector');
    if (selector) {
      selector.innerHTML = '<option value="current">Desain Aktif di Studio</option>';
      designs.forEach((d) => selector.appendChild(new Option(`Tersimpan: ${d.namaDesain}`, d.id)));
      selector.value = Store.state.selectedBriefId;
    }

    let brief = designs.find((d) => d.id === Store.state.selectedBriefId);
    if (!brief) {
      const jenisList = StorageService.getJenisPermak();
      const evalRes = CostAndRuleEngine.evaluateChanges(
        Store.state.category,
        Store.state.initialConfig,
        Store.activeConfig,
        jenisList
      );
      brief = {
        id: 'DRAFT-' + Date.now().toString().slice(-5),
        namaDesain: Store.state.designTitle,
        kategoriPakaian: Store.state.category,
        konfigurasiAwal: Store.state.initialConfig,
        konfigurasiDesain: Store.activeConfig,
        daftarPerubahan: evalRes.changes,
        catatan: Store.state.tailorNotes,
        estimasiBiaya: { min: evalRes.totalMin, max: evalRes.totalMax },
        tingkatKesulitan: evalRes.difficulty,
        tanggalDibuat: new Date().toISOString()
      };
    }

    const catObj = getCategoryMeta(brief.kategoriPakaian);
    const beforeSVG = GarmentSVGEngine.renderSVG(brief.kategoriPakaian, brief.konfigurasiAwal, null, false);
    const afterSVG = GarmentSVGEngine.renderSVG(brief.kategoriPakaian, brief.konfigurasiDesain, brief.konfigurasiAwal, true);
    const cfg = brief.konfigurasiDesain;
    const dateStr = formatDateID(brief.tanggalDibuat, true);

    const sheet = document.getElementById('briefSheetContent');
    if (!sheet) return;

    sheet.innerHTML = `
      <div class="brief-top">
        <div>
          <span class="sticker sticker-cobalt" style="margin-bottom:0.4rem;">PERMAKVISION TAILOR BRIEF</span>
          <h2 style="font-size:1.95rem;">${escapeHTML(brief.namaDesain)}</h2>
          <p style="font-size:0.85rem; color:var(--muted);">
            Kategori: <strong>${escapeHTML(catObj.label)}</strong> &bull; Tanggal: ${escapeHTML(dateStr)}
          </p>
        </div>
        <div style="text-align:right;">
          <div class="mono" style="font-size:0.72rem; color:var(--muted);">BRIEF REF ID</div>
          <strong class="mono" style="font-size:0.95rem;">${escapeHTML(brief.id.toUpperCase())}</strong>
        </div>
      </div>

      <div class="brief-media-grid">
        <div class="brief-media-box">
          <div class="mono" style="font-size:0.74rem; font-weight:700; margin-bottom:0.5rem;">1. POLA PAKAIAN AWAL (BEFORE)</div>
          ${beforeSVG}
        </div>
        <div class="brief-media-box brief-media-box--after">
          <div class="mono" style="font-size:0.74rem; font-weight:700; color:var(--pink); margin-bottom:0.5rem;">2. TARGET HASIL PERMAK (AFTER)</div>
          ${afterSVG}
        </div>
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:1rem; align-items:center; background:var(--gray-bg); border:1.5px solid var(--charcoal); border-radius:10px; padding:0.8rem 1rem; margin-bottom:1.25rem;">
        <strong style="font-size:0.84rem;">Spesifikasi Warna Kain:</strong>
        <span style="display:inline-flex; align-items:center; gap:0.4rem; font-size:0.82rem;">
          <span style="width:18px; height:18px; border-radius:50%; border:1.5px solid #20212A; background:${escapeHTML(cfg.primaryColor)};"></span>
          Warna Utama: <code class="mono">${escapeHTML(cfg.primaryColor)}</code>
        </span>
        ${
          cfg.twoTone
            ? `
          <span style="display:inline-flex; align-items:center; gap:0.4rem; font-size:0.82rem;">
            <span style="width:18px; height:18px; border-radius:50%; border:1.5px solid #20212A; background:${escapeHTML(cfg.secondaryColor)};"></span>
            Warna Alternatif (Two-Tone): <code class="mono">${escapeHTML(cfg.secondaryColor)}</code>
          </span>
        `
            : `<span class="sticker sticker-white">1 Warna Solid</span>`
        }
      </div>

      <h3 style="font-family:var(--font-display); font-size:1.05rem; margin-bottom:0.65rem;">Daftar Instruksi Perubahan</h3>
      <table class="brief-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Jenis Permak</th>
            <th>Detail Perubahan</th>
            <th>Estimasi Simulasi</th>
          </tr>
        </thead>
        <tbody>
          ${
            brief.daftarPerubahan.length === 0
              ? `<tr><td colspan="4" style="text-align:center; color:var(--muted);">Belum ada perubahan struktural yang dipilih.</td></tr>`
              : brief.daftarPerubahan
                  .map(
                    (c, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${escapeHTML(c.nama)}</strong></td>
                    <td>${escapeHTML(c.detail)}</td>
                    <td class="mono">${formatIDR(c.biayaMin)} – ${formatIDR(c.biayaMax)}</td>
                  </tr>
                `
                  )
                  .join('')
          }
        </tbody>
      </table>

      <div class="two-col-grid" style="grid-template-columns:1.3fr 0.7fr; gap:1rem; margin-bottom:1.25rem;">
        <div style="background:var(--gray-bg); border:1.5px solid var(--charcoal); border-radius:10px; padding:1rem;">
          <div class="mono" style="font-size:0.72rem; font-weight:700; margin-bottom:0.35rem;">CATATAN PELANGGAN UNTUK PENJAHIT</div>
          <p style="font-size:0.88rem;">${escapeHTML(brief.catatan) || 'Tidak ada catatan tambahan.'}</p>
        </div>
        <div style="background:var(--yellow); border:1.5px solid var(--charcoal); border-radius:10px; padding:1rem;">
          <div class="mono" style="font-size:0.72rem; font-weight:700; margin-bottom:0.35rem;">ESTIMASI BIAYA &amp; KERUMITAN</div>
          <div style="font-family:var(--font-display); font-size:1.2rem; font-weight:800;">${formatIDR(brief.estimasiBiaya.min)} – ${formatIDR(brief.estimasiBiaya.max)}</div>
          <div style="font-size:0.82rem; margin-top:0.25rem;">Kesulitan: <strong>${escapeHTML(brief.tingkatKesulitan)}</strong></div>
        </div>
      </div>

      <p style="font-size:0.75rem; color:var(--muted); border-top:1.5px solid var(--gray-bg); padding-top:0.75rem;">
        <strong>Catatan Penting:</strong> Preview pola SVG dan estimasi biaya pada dokumen ini merupakan simulasi perencanaan. Kelayakan pengerjaan, ketersediaan kain sambungan two-tone, dan tarif akhir wajib dikonfirmasi langsung bersama penjahit.
      </p>
    `;
  }
};
