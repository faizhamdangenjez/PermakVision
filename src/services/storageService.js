import { DEFAULT_TEMPLATES, DEFAULT_JENIS_PERMAK } from '../data/defaults.js';
import { showToast } from '../utils/dom.js';

export const STORAGE_KEYS = {
  DESIGNS: 'permakvision_designs_v3',
  TEMPLATES: 'permakvision_templates_v3',
  JENIS: 'permakvision_jenis_v3'
};

export const StorageService = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      showToast('Penyimpanan lokal penuh atau diblokir browser.');
      return false;
    }
  },

  initDefaults() {
    if (!localStorage.getItem(STORAGE_KEYS.TEMPLATES)) {
      this.set(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.JENIS)) {
      this.set(STORAGE_KEYS.JENIS, DEFAULT_JENIS_PERMAK);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DESIGNS)) {
      this.set(STORAGE_KEYS.DESIGNS, []);
    }
  },

  getDesigns() {
    return this.get(STORAGE_KEYS.DESIGNS, []);
  },

  saveDesigns(list) {
    return this.set(STORAGE_KEYS.DESIGNS, list);
  },

  getTemplates() {
    return this.get(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES);
  },

  saveTemplates(list) {
    return this.set(STORAGE_KEYS.TEMPLATES, list);
  },

  getJenisPermak() {
    return this.get(STORAGE_KEYS.JENIS, DEFAULT_JENIS_PERMAK);
  },

  saveJenisPermak(list) {
    return this.set(STORAGE_KEYS.JENIS, list);
  },

  resetAdminDefaults() {
    this.saveTemplates(DEFAULT_TEMPLATES);
    this.saveJenisPermak(DEFAULT_JENIS_PERMAK);
  },

  exportDesignsJSON() {
    const payload = {
      app: 'PermakVision Studio',
      exportedAt: new Date().toISOString(),
      designs: this.getDesigns()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permakvision-designs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async importDesignsJSON(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const incoming = Array.isArray(parsed) ? parsed : parsed.designs;
    if (!Array.isArray(incoming)) {
      throw new Error('Format file JSON tidak valid.');
    }
    const existing = this.getDesigns();
    const map = new Map(existing.map((d) => [d.id, d]));
    incoming.forEach((item) => {
      if (item && item.id && item.namaDesain && item.kategoriPakaian && item.konfigurasiDesain) {
        map.set(item.id, item);
      }
    });
    const merged = Array.from(map.values());
    this.saveDesigns(merged);
    return merged.length;
  }
};
