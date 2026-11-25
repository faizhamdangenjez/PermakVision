/**
 * XSS-safe HTML escaping for user-generated text rendered into templates.
 */
export function escapeHTML(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatIDR(num) {
  return 'Rp' + Number(num || 0).toLocaleString('id-ID');
}

export function formatDateID(isoString, includeLongMonth = false) {
  try {
    return new Date(isoString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: includeLongMonth ? 'long' : 'short',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
}

export function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const el = document.createElement('div');
  el.className = 'toast-pill';
  el.innerHTML = `<span style="color:var(--lime);">&#10003;</span> <span>${escapeHTML(message)}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 220);
  }, 2800);
}

export function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

export function closeAllModals() {
  document.querySelectorAll('.modal-overlay.open').forEach((el) => el.classList.remove('open'));
}

export function openConfirm(title, message, onConfirm) {
  const titleEl = document.getElementById('confirmModalTitle');
  const msgEl = document.getElementById('confirmModalMessage');
  const okBtn = document.getElementById('confirmModalOkBtn');
  if (!titleEl || !msgEl || !okBtn) return;

  titleEl.textContent = title;
  msgEl.textContent = message;
  okBtn.onclick = () => {
    closeModal('confirmModal');
    if (typeof onConfirm === 'function') onConfirm();
  };
  openModal('confirmModal');
}
