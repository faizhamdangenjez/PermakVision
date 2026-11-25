import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/views.css';
import './styles/print.css';

import { StorageService } from './services/storageService.js';
import { Store } from './state/store.js';
import { LandingView } from './views/landingView.js';
import { StudioView } from './views/studioView.js';
import { CatalogView } from './views/catalogView.js';
import { MyDesignsView } from './views/myDesignsView.js';
import { BriefView } from './views/briefView.js';
import { AdminView } from './views/adminView.js';
import { closeModal, closeAllModals, showToast } from './utils/dom.js';

const VALID_VIEWS = ['landing', 'studio', 'catalog', 'mydesigns', 'brief', 'admin'];

function updateNavBadges() {
  const countEl = document.getElementById('navDesignCount');
  if (countEl) {
    countEl.textContent = String(StorageService.getDesigns().length);
  }
}

function navigate(viewName, pushHash = true) {
  const targetView = VALID_VIEWS.includes(viewName) ? viewName : 'landing';
  Store.state.currentView = targetView;

  document.querySelectorAll('.view-section').forEach((sec) => {
    sec.classList.toggle('active', sec.id === `view-${targetView}`);
  });

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.nav === targetView);
  });

  if (pushHash && window.location.hash !== `#${targetView}`) {
    window.history.pushState({ view: targetView }, '', `#${targetView}`);
  }

  if (targetView === 'studio') StudioView.syncUI();
  if (targetView === 'catalog') CatalogView.render();
  if (targetView === 'mydesigns') MyDesignsView.render();
  if (targetView === 'brief') BriefView.render();
  if (targetView === 'admin') AdminView.renderTables();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyTemplateById(tplId) {
  const tpl = StorageService.getTemplates().find((t) => t.id === tplId);
  if (!tpl) return;
  Store.applyTemplate(tpl);
  navigate('studio');
  showToast(`Template "${tpl.nama}" diterapkan!`);
}

function bootstrap() {
  StorageService.initDefaults();
  updateNavBadges();

  LandingView.init((tplId) => applyTemplateById(tplId));

  StudioView.init({
    onSaved: () => updateNavBadges(),
    onOpenBrief: () => {
      Store.state.selectedBriefId = 'current';
      navigate('brief');
    }
  });
  StudioView.refreshTemplateDropdown();
  StudioView.syncUI();

  CatalogView.init({
    onApplyTemplate: (tplId) => applyTemplateById(tplId)
  });

  MyDesignsView.init({
    onEditDesign: (design) => {
      Store.loadSavedDesign(design);
      navigate('studio');
      showToast(`Membuka "${design.namaDesain}" untuk diedit.`);
    },
    onOpenBrief: (designId) => {
      Store.state.selectedBriefId = designId;
      navigate('brief');
    },
    onNewDesign: () => {
      Store.state.editingDesignId = null;
      Store.setCategory('shirt', true);
      navigate('studio');
    },
    onDesignsChanged: () => updateNavBadges()
  });

  BriefView.init();

  AdminView.init({
    onDataMutated: () => {
      StudioView.refreshTemplateDropdown();
      StudioView.renderCost();
      CatalogView.refreshTypeFilter();
      CatalogView.render();
      LandingView.renderFeatured();
    }
  });

  // Global navigation delegation
  document.addEventListener('click', (e) => {
    const navTrigger = e.target.closest('[data-nav]');
    if (navTrigger) {
      e.preventDefault();
      navigate(navTrigger.dataset.nav);
      return;
    }

    const closeTrigger = e.target.closest('[data-close-modal]');
    if (closeTrigger) {
      closeModal(closeTrigger.dataset.closeModal);
      return;
    }

    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('open');
    }
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  // Browser back/forward hash routing
  window.addEventListener('hashchange', () => {
    const hashView = window.location.hash.replace('#', '');
    if (VALID_VIEWS.includes(hashView) && hashView !== Store.state.currentView) {
      navigate(hashView, false);
    }
  });

  const initialHash = window.location.hash.replace('#', '');
  if (VALID_VIEWS.includes(initialHash)) {
    navigate(initialHash, false);
  }
}

window.addEventListener('DOMContentLoaded', bootstrap);
