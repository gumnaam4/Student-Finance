// public/script.js
// Shared utilities used across all pages

// ── Auth guard ────────────────────────────────────────────
function requireAuth() {
  const raw = localStorage.getItem('student');
  if (!raw) {
    window.location.href = 'index.html';
    throw new Error('Not authenticated');
  }
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('student');
    window.location.href = 'index.html';
    throw new Error('Invalid session');
  }
}

// ── Logout ────────────────────────────────────────────────
function logout() {
  localStorage.removeItem('student');
  window.location.href = 'index.html';
}

// ── API fetch wrapper ─────────────────────────────────────
async function apiFetch(url, options = {}) {
  const defaultOptions = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const res  = await fetch(url, defaultOptions);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }

  return data;
}

// ── Format currency ───────────────────────────────────────
function formatINR(amount) {
  return '₹' + parseFloat(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ── Format date ───────────────────────────────────────────
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}