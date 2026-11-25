import { getCategoryMeta, getDefaultConfigForCategory } from '../data/defaults.js';

const clone = (obj) => JSON.parse(JSON.stringify(obj));

export const Store = {
  state: {
    currentView: 'landing',
    heroDemoType: 'shirt',
    editingDesignId: null,
    designTitle: 'Kemeja Lengan Panjang',
    category: 'shirt',
    initialConfig: getDefaultConfigForCategory('shirt'),
    alternatives: [
      getDefaultConfigForCategory('shirt'),
      getDefaultConfigForCategory('shirt'),
      getDefaultConfigForCategory('shirt')
    ],
    activeAltIndex: 0,
    undoStack: [],
    comparisonMode: 'after',
    splitPercent: 50,
    tailorNotes: '',
    selectedBriefId: 'current',
    adminTab: 'templates'
  },

  get activeConfig() {
    return this.state.alternatives[this.state.activeAltIndex];
  },

  set activeConfig(val) {
    this.state.alternatives[this.state.activeAltIndex] = val;
  },

  pushUndo() {
    this.state.undoStack.push(clone(this.activeConfig));
    if (this.state.undoStack.length > 25) {
      this.state.undoStack.shift();
    }
  },

  undo() {
    if (!this.state.undoStack.length) return false;
    this.activeConfig = this.state.undoStack.pop();
    return true;
  },

  resetToInitial() {
    this.pushUndo();
    this.activeConfig = clone(this.state.initialConfig);
  },

  setCategory(catId, resetAll = false) {
    if (!resetAll) this.pushUndo();
    const catObj = getCategoryMeta(catId);
    const fresh = getDefaultConfigForCategory(catId);
    this.state.category = catId;
    this.state.designTitle = `${catObj.label} Permak Custom`;
    this.state.initialConfig = clone(fresh);
    this.state.alternatives = [clone(fresh), clone(fresh), clone(fresh)];
    this.state.activeAltIndex = 0;
    if (resetAll) this.state.undoStack = [];
  },

  applyTemplate(tpl) {
    const base = getDefaultConfigForCategory(tpl.kategoriPakaian);
    this.state.editingDesignId = null;
    this.state.category = tpl.kategoriPakaian;
    this.state.designTitle = tpl.nama;
    this.state.initialConfig = clone(base);
    this.activeConfig = { ...clone(base), ...clone(tpl.konfigurasiDesain) };
    this.state.undoStack = [];
  },

  loadSavedDesign(design) {
    this.state.editingDesignId = design.id;
    this.state.designTitle = design.namaDesain;
    this.state.category = design.kategoriPakaian;
    this.state.initialConfig = clone(design.konfigurasiAwal);
    this.state.alternatives[0] = clone(design.konfigurasiDesain);
    this.state.activeAltIndex = 0;
    this.state.tailorNotes = design.catatan || '';
    this.state.undoStack = [];
  }
};
