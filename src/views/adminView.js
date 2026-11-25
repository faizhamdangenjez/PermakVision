import { GARMENT_CATEGORIES, getCategoryMeta, getDefaultConfigForCategory } from '../data/defaults.js';
import { StorageService } from '../services/storageService.js';
import { Store } from '../state/store.js';
import { escapeHTML, formatIDR, openConfirm, showToast } from '../utils/dom.js';

export const AdminView = {
  init({ onDataMutated }) {
    this.onDataMutated = onDataMutated;

    const admCat = document.getElementById('admTplCategory');
    if (admCat) {
      GARMENT_CATEGORIES.forEach((c) => admCat.appendChild(new Option(c.label, c.id)));
    }
    this.refreshPermakTypeSelect();

    document.querySelectorAll('[data-admin-tab]').forEach((btn) => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.adminTab));
    });

    document.getElementById('btnResetAdminDefaults')?.addEventListener('click', () => {
      openConfirm(
        'Reset Data Admin ke Default?',
        'Semua perubahan template dan tarif kustom akan dikembalikan ke data awal.',
        () => {
          StorageService.resetAdminDefaults();
          this.refreshPermakTypeSelect();
          this.renderTables();
          if (this.onDataMutated) this.onDataMutated();
          showToast('Data studio dikembalikan ke pengaturan awal.');
        }
      );
    });

    document.getElementById('adminTemplateForm')?.addEventListener('submit', (e) => this.saveTemplate(e));
    document.getElementById('btnCancelAdminTpl')?.addEventListener('click', () => this.resetTemplateForm());

    document.getElementById('adminTemplatesTableBody')?.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-edit-tpl]');
      if (editBtn) {
        this.editTemplate(editBtn.dataset.editTpl);
        return;
      }
      const delBtn = e.target.closest('[data-del-tpl]');
      if (delBtn) {
        this.deleteTemplate(delBtn.dataset.delTpl);
      }
    });

    document.getElementById('adminJenisForm')?.addEventListener('submit', (e) => this.saveJenis(e));
    document.getElementById('btnCancelAdminJenis')?.addEventListener('click', () => this.resetJenisForm());

    document.getElementById('adminJenisTableBody')?.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-edit-jenis]');
      if (editBtn) {
        this.editJenis(editBtn.dataset.editJenis);
        return;
      }
      const delBtn = e.target.closest('[data-del-jenis]');
      if (delBtn) {
        this.deleteJenis(delBtn.dataset.delJenis);
      }
    });

    this.renderTables();
  },

  refreshPermakTypeSelect() {
    const select = document.getElementById('admTplPermakType');
    if (!select) return;
    select.innerHTML = '';
    StorageService.getJenisPermak().forEach((j) => {
      select.appendChild(new Option(j.nama, j.kategori));
    });
  },

  switchTab(tab) {
    Store.state.adminTab = tab;
    document.getElementById('adminPanelTemplates').hidden = tab !== 'templates';
    document.getElementById('adminPanelJenis').hidden = tab !== 'jenis';
    document.getElementById('tabAdminTemplates').className = tab === 'templates' ? 'btn btn-cobalt btn-sm' : 'btn btn-white btn-sm';
    document.getElementById('tabAdminJenis').className = tab === 'jenis' ? 'btn btn-cobalt btn-sm' : 'btn btn-white btn-sm';
  },

  renderTables() {
    const templates = StorageService.getTemplates();
    const jenisList = StorageService.getJenisPermak();

    document.getElementById('adminTemplatesTableBody').innerHTML = templates
      .map((t) => {
        const catObj = getCategoryMeta(t.kategoriPakaian);
        return `
          <tr>
            <td><strong>${escapeHTML(t.nama)}</strong><div style="font-size:0.75rem; color:var(--muted);">${escapeHTML(t.deskripsi)}</div></td>
            <td><span class="sticker sticker-yellow">${escapeHTML(catObj.label)}</span></td>
            <td class="mono">${formatIDR(t.estimasiBiaya.min)} – ${formatIDR(t.estimasiBiaya.max)}</td>
            <td>${escapeHTML(t.tingkatKesulitan)}</td>
            <td style="white-space:nowrap;">
              <button type="button" class="btn btn-white btn-sm" data-edit-tpl="${escapeHTML(t.id)}">Edit</button>
              <button type="button" class="btn btn-pink btn-sm" data-del-tpl="${escapeHTML(t.id)}">Hapus</button>
            </td>
          </tr>
        `;
      })
      .join('');

    document.getElementById('adminJenisTableBody').innerHTML = jenisList
      .map(
        (j) => `
        <tr>
          <td><strong>${escapeHTML(j.nama)}</strong><div style="font-size:0.75rem; color:var(--muted);">${escapeHTML(j.deskripsi)}</div></td>
          <td><code>${escapeHTML(j.parameterDesain)}</code></td>
          <td class="mono">${formatIDR(j.estimasiBiayaMinimum)} – ${formatIDR(j.estimasiBiayaMaksimum)}</td>
          <td>${escapeHTML(j.tingkatKesulitan)}</td>
          <td style="white-space:nowrap;">
            <button type="button" class="btn btn-white btn-sm" data-edit-jenis="${escapeHTML(j.id)}">Edit</button>
            <button type="button" class="btn btn-pink btn-sm" data-del-jenis="${escapeHTML(j.id)}">Hapus</button>
          </td>
        </tr>
      `
      )
      .join('');
  },

  saveTemplate(e) {
    e.preventDefault();
    const templates = StorageService.getTemplates();
    const id = document.getElementById('admTplId').value || 'tpl_' + Date.now();
    const cat = document.getElementById('admTplCategory').value;
    const baseCfg = getDefaultConfigForCategory(cat);

    const record = {
      id,
      nama: document.getElementById('admTplName').value.trim(),
      kategoriPakaian: cat,
      kategoriPermak: document.getElementById('admTplPermakType').value,
      deskripsi: document.getElementById('admTplDesc').value.trim(),
      konfigurasiDesain: {
        ...baseCfg,
        primaryColor: document.getElementById('admTplPrimaryColor').value,
        secondaryColor: document.getElementById('admTplSecondaryColor').value,
        twoTone: document.getElementById('admTplTwoTone').checked
      },
      estimasiBiaya: {
        min: Number(document.getElementById('admTplMin').value),
        max: Number(document.getElementById('admTplMax').value)
      },
      tingkatKesulitan: document.getElementById('admTplDiff').value,
      featured: false
    };

    const idx = templates.findIndex((t) => t.id === id);
    if (idx >= 0) templates[idx] = { ...templates[idx], ...record };
    else templates.unshift(record);

    StorageService.saveTemplates(templates);
    this.resetTemplateForm();
    this.renderTables();
    if (this.onDataMutated) this.onDataMutated();
    showToast('Template berhasil disimpan!');
  },

  editTemplate(id) {
    const t = StorageService.getTemplates().find((item) => item.id === id);
    if (!t) return;

    document.getElementById('adminTplFormTitle').textContent = 'Edit Template Desain';
    document.getElementById('admTplId').value = t.id;
    document.getElementById('admTplName').value = t.nama;
    document.getElementById('admTplCategory').value = t.kategoriPakaian;
    document.getElementById('admTplPermakType').value = t.kategoriPermak;
    document.getElementById('admTplDesc').value = t.deskripsi;
    document.getElementById('admTplPrimaryColor').value = t.konfigurasiDesain.primaryColor || '#FFFFFF';
    document.getElementById('admTplSecondaryColor').value = t.konfigurasiDesain.secondaryColor || '#4357FF';
    document.getElementById('admTplTwoTone').checked = Boolean(t.konfigurasiDesain.twoTone);
    document.getElementById('admTplMin').value = t.estimasiBiaya.min;
    document.getElementById('admTplMax').value = t.estimasiBiaya.max;
    document.getElementById('admTplDiff').value = t.tingkatKesulitan;
  },

  deleteTemplate(id) {
    openConfirm('Hapus Template?', 'Template akan dihapus dari katalog lokal.', () => {
      const remaining = StorageService.getTemplates().filter((t) => t.id !== id);
      StorageService.saveTemplates(remaining);
      this.renderTables();
      if (this.onDataMutated) this.onDataMutated();
      showToast('Template dihapus.');
    });
  },

  resetTemplateForm() {
    document.getElementById('adminTplFormTitle').textContent = 'Tambah Template Baru';
    document.getElementById('admTplId').value = '';
    document.getElementById('adminTemplateForm').reset();
  },

  saveJenis(e) {
    e.preventDefault();
    const list = StorageService.getJenisPermak();
    const id = document.getElementById('admJenisId').value || 'jp_' + Date.now();
    const param = document.getElementById('admJenisParam').value;
    const record = {
      id,
      nama: document.getElementById('admJenisName').value.trim(),
      kategori: param,
      parameterDesain: param,
      deskripsi: document.getElementById('admJenisDesc').value.trim(),
      estimasiBiayaMinimum: Number(document.getElementById('admJenisMin').value),
      estimasiBiayaMaksimum: Number(document.getElementById('admJenisMax').value),
      tingkatKesulitan: document.getElementById('admJenisDiff').value
    };

    const idx = list.findIndex((j) => j.id === id);
    if (idx >= 0) list[idx] = record;
    else list.push(record);

    StorageService.saveJenisPermak(list);
    this.resetJenisForm();
    this.refreshPermakTypeSelect();
    this.renderTables();
    if (this.onDataMutated) this.onDataMutated();
    showToast('Jenis permak & tarif simulasi diperbarui!');
  },

  editJenis(id) {
    const j = StorageService.getJenisPermak().find((item) => item.id === id);
    if (!j) return;

    document.getElementById('adminJenisFormTitle').textContent = 'Edit Jenis Permak';
    document.getElementById('admJenisId').value = j.id;
    document.getElementById('admJenisName').value = j.nama;
    document.getElementById('admJenisParam').value = j.parameterDesain;
    document.getElementById('admJenisDesc').value = j.deskripsi;
    document.getElementById('admJenisMin').value = j.estimasiBiayaMinimum;
    document.getElementById('admJenisMax').value = j.estimasiBiayaMaksimum;
    document.getElementById('admJenisDiff').value = j.tingkatKesulitan;
  },

  deleteJenis(id) {
    openConfirm('Hapus Jenis Permak?', 'Aturan tarif ini akan dihapus.', () => {
      const remaining = StorageService.getJenisPermak().filter((j) => j.id !== id);
      StorageService.saveJenisPermak(remaining);
      this.refreshPermakTypeSelect();
      this.renderTables();
      if (this.onDataMutated) this.onDataMutated();
      showToast('Jenis permak dihapus.');
    });
  },

  resetJenisForm() {
    document.getElementById('adminJenisFormTitle').textContent = 'Tambah / Edit Jenis Permak';
    document.getElementById('admJenisId').value = '';
    document.getElementById('adminJenisForm').reset();
  }
};
