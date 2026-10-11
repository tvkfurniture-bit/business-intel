/**
 * Business Scope in Your City — Navigation & UI Shell Controller
 * Accessible header interactions, responsive mobile drawer, quick search modal,
 * announcement bar dismissal, and dynamic copyright year.
 */

const NavigationManager = (function() {
  'use strict';

  /**
   * Initialize all navigation elements on DOM ready.
   */
  function init() {
    initActiveNavLinks();
    initMobileDrawer();
    initGlobalSearchModal();
    initAnnouncementBar();
    initDynamicYear();
  }

  /**
   * 1. Highlight active navigation items based on current URL path.
   */
  function initActiveNavLinks() {
    const currentPath = window.location.pathname;
    const desktopLinks = document.querySelectorAll('.desktop-nav a');
    const mobileLinks = document.querySelectorAll('.mobile-nav-drawer a');

    function applyActive(links) {
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        // Exact match or sub-route match (e.g. /opportunities/ matches /opportunities/?city=pune)
        if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        } else {
          link.classList.remove('active');
          link.removeAttribute('aria-current');
        }
      });
    }

    applyActive(desktopLinks);
    applyActive(mobileLinks);
  }

  /**
   * 2. Accessible Mobile Navigation Drawer with Focus Trapping & ARIA Support.
   */
  function initMobileDrawer() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const drawer = document.getElementById('mobile-drawer');

    if (!menuBtn || !drawer) return;

    let isOpen = false;

    // Create backdrop dynamically if not in DOM
    let backdrop = document.getElementById('mobile-drawer-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'mobile-drawer-backdrop';
      backdrop.className = 'mobile-drawer-backdrop';
      backdrop.hidden = true;
      document.body.appendChild(backdrop);
    }

    function toggleDrawer(open) {
      isOpen = open;
      menuBtn.setAttribute('aria-expanded', String(isOpen));

      if (isOpen) {
        drawer.hidden = false;
        drawer.classList.add('is-open');
        backdrop.hidden = false;
        document.body.style.overflow = 'hidden';

        // Focus first focusable link in drawer
        const firstLink = drawer.querySelector('a');
        if (firstLink) firstLink.focus();
      } else {
        drawer.classList.remove('is-open');
        backdrop.hidden = true;
        document.body.style.overflow = '';
        setTimeout(() => {
          if (!isOpen) drawer.hidden = true;
        }, 200);
        menuBtn.focus();
      }
    }

    menuBtn.addEventListener('click', () => toggleDrawer(!isOpen));
    backdrop.addEventListener('click', () => toggleDrawer(false));

    // Close on Escape key press
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        toggleDrawer(false);
      }
    });

    // Close drawer when clicking an internal link
    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (isOpen) toggleDrawer(false);
      });
    });
  }

  /**
   * 3. Global Floating Quick Search Modal.
   */
  function initGlobalSearchModal() {
    const triggerBtn = document.getElementById('global-search-btn');
    const modal = document.getElementById('search-modal');
    const closeBtn = document.getElementById('modal-search-close');
    const backdrop = document.getElementById('search-modal-backdrop');
    const input = document.getElementById('quick-search-input');
    const resultsContainer = document.getElementById('quick-search-results');

    if (!modal) return;

    function openModal() {
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      if (input) {
        input.value = '';
        input.focus();
      }
      if (resultsContainer) {
        resultsContainer.innerHTML = '<p class="search-hint">Type at least 2 characters to filter verified public records.</p>';
      }
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = '';
      if (triggerBtn) triggerBtn.focus();
    }

    if (triggerBtn) triggerBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) {
        closeModal();
      }
    });

    // Quick Search Input Handler
    if (input && resultsContainer) {
      input.addEventListener('input', debounce(async () => {
        const query = input.value.trim().toLowerCase();

        if (query.length < 2) {
          resultsContainer.innerHTML = '<p class="search-hint">Type at least 2 characters to filter verified public records.</p>';
          return;
        }

        resultsContainer.innerHTML = '<p class="search-hint">Searching published opportunities...</p>';

        try {
          const opps = await API.get('opportunities');
          if (!Array.isArray(opps) || opps.length === 0) {
            resultsContainer.innerHTML = '<p class="search-hint">No opportunities available in current database.</p>';
            return;
          }

          const matches = opps.filter(o => {
            const title = (o.title || '').toLowerCase();
            const summary = (o.short_summary || '').toLowerCase();
            const cat = (o.category || '').toLowerCase();
            return title.includes(query) || summary.includes(query) || cat.includes(query);
          });

          if (matches.length === 0) {
            resultsContainer.innerHTML = `
              <div class="search-no-match">
                <p>No exact opportunities found for "${escapeHtml(query)}".</p>
                <a href="/opportunities/?keyword=${encodeURIComponent(query)}" class="link-arrow">Search all directory records &rarr;</a>
              </div>
            `;
            return;
          }

          const html = matches.slice(0, 5).map(m => `
            <div class="quick-result-item">
              <a href="/opportunity/${encodeURIComponent(m.slug)}/">
                <span class="badge badge-teal" style="font-size: 0.75rem;">${escapeHtml(m.category)}</span>
                <strong>${escapeHtml(m.title)}</strong>
                <small>Capex: ₹${Number(m.budget_min).toLocaleString('en-IN')} – ₹${Number(m.budget_max).toLocaleString('en-IN')}</small>
              </a>
            </div>
          `).join('');

          resultsContainer.innerHTML = html + `
            <div style="text-align: center; margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--border);">
              <a href="/opportunities/?keyword=${encodeURIComponent(query)}" class="link-arrow" style="font-size: 0.9rem;">View all matching records &rarr;</a>
            </div>
          `;
        } catch (err) {
          resultsContainer.innerHTML = '<p class="search-hint">Search connection unavailable.</p>';
        }
      }, 250));
    }
  }

  /**
   * 4. Announcement Bar Persistence (Session dismissal).
   */
  function initAnnouncementBar() {
    const bar = document.getElementById('announcement-bar');
    const closeBtn = document.getElementById('announcement-close-btn');

    if (!bar || !closeBtn) return;

    // Check if dismissed in current browser session
    const isDismissed = sessionStorage.getItem('dismiss_announcement');
    if (isDismissed === 'true') {
      bar.style.display = 'none';
      return;
    }

    closeBtn.addEventListener('click', () => {
      bar.style.display = 'none';
      sessionStorage.setItem('dismiss_announcement', 'true');
    });
  }

  /**
   * 5. Dynamic Copyright Year.
   */
  function initDynamicYear() {
    const currentYear = new Date().getFullYear();
    const yearSpans = document.querySelectorAll('#current-year');
    yearSpans.forEach(span => {
      span.textContent = String(currentYear);
    });
  }

  // Utilities
  function debounce(fn, wait) {
    let t;
    return function(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // Public Interface
  return {
    init
  };
})();

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', NavigationManager.init);
