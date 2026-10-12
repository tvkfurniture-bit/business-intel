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
    initMobileBottomNav();
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
        document.body.classList.add('drawer-is-open');

        // Focus first focusable link in drawer
        const firstLink = drawer.querySelector('a');
        if (firstLink) firstLink.focus();
      } else {
        drawer.classList.remove('is-open');
        backdrop.hidden = true;
        document.body.style.overflow = '';
        document.body.classList.remove('drawer-is-open');
        setTimeout(() => {
          if (!isOpen) drawer.hidden = true;
        }, 200);
        menuBtn.focus();
      }
    }

    menuBtn.addEventListener('click', () => toggleDrawer(!isOpen));
    backdrop.addEventListener('click', () => toggleDrawer(false));

    // Expose toggler so mobile bottom nav Menu item can trigger it
    window._toggleMobileDrawer = toggleDrawer;
    window._isMobileDrawerOpen = () => isOpen;

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
   * 2b. Ergonomic Mobile Bottom Tab Bar (<768px).
   * Renders 5 natural thumb-zone items: Explore, Cities, Blueprints, Purchases, and Menu.
   */
  function initMobileBottomNav() {
    let bottomNav = document.getElementById('mobile-bottom-nav');
    if (!bottomNav) {
      bottomNav = document.createElement('nav');
      bottomNav.id = 'mobile-bottom-nav';
      bottomNav.className = 'mobile-bottom-nav';
      bottomNav.setAttribute('aria-label', 'Mobile Quick Navigation');

      // Determine proper relative routing that handles clean URLs, subpaths, and GitHub Pages
      const currentPath = window.location.pathname;
      const inPagesDir = currentPath.includes('/pages/') || !!document.querySelector('link[href*="../../assets/css/"]');
      const isSubSection = inPagesDir || (currentPath.replace(/^\/+|\/+$/g, '').split('/').length >= 1 && currentPath !== '/' && !currentPath.endsWith('/index.html'));

      function getSectionLink(section) {
        // If the page already has a header link to this section, reuse its exact verified relative path
        const pageLink = document.querySelector(`.desktop-nav a[href*="${section}"], .mobile-nav-drawer a[href*="${section}"]`);
        if (pageLink && pageLink.getAttribute('href')) {
          return pageLink.getAttribute('href');
        }
        if (isSubSection) {
          return `../${section}/index.html`;
        }
        return `pages/${section}/index.html`;
      }

      const items = [
        {
          label: 'Explore',
          href: getSectionLink('opportunities'),
          cleanHref: 'opportunities',
          icon: '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>'
        },
        {
          label: 'Cities',
          href: getSectionLink('cities'),
          cleanHref: 'cities',
          icon: '<rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="9" y1="22" x2="9" y2="22.01"></line><line x1="15" y1="22" x2="15" y2="22.01"></line><line x1="9" y1="6" x2="9" y2="6.01"></line><line x1="15" y1="6" x2="15" y2="6.01"></line><line x1="9" y1="10" x2="9" y2="10.01"></line><line x1="15" y1="10" x2="15" y2="10.01"></line><line x1="9" y1="14" x2="9" y2="14.01"></line><line x1="15" y1="14" x2="15" y2="14.01"></line>'
        },
        {
          label: 'Blueprints',
          href: getSectionLink('blueprints'),
          cleanHref: 'blueprints',
          icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>'
        },
        {
          label: 'Orders',
          href: getSectionLink('account'),
          cleanHref: 'account',
          icon: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>'
        }
      ];

      let navHtml = items.map(item => {
        const isActive = currentPath.includes(item.cleanHref) || currentPath.includes(item.label.toLowerCase());
        return `
          <a href="${item.href}" class="mobile-bottom-item ${isActive ? 'active' : ''}" aria-label="${item.label}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">${item.icon}</svg>
            <span>${item.label}</span>
          </a>
        `;
      }).join('');

      navHtml += `
        <button type="button" class="mobile-bottom-item" id="bottom-nav-menu-btn" aria-label="Toggle Navigation Drawer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          <span>Menu</span>
        </button>
      `;

      bottomNav.innerHTML = navHtml;
      document.body.appendChild(bottomNav);
    }

    const bottomMenuBtn = document.getElementById('bottom-nav-menu-btn');
    if (bottomMenuBtn) {
      bottomMenuBtn.addEventListener('click', () => {
        if (typeof window._toggleMobileDrawer === 'function') {
          const isOpen = typeof window._isMobileDrawerOpen === 'function' ? window._isMobileDrawerOpen() : false;
          window._toggleMobileDrawer(!isOpen);
        } else {
          const menuBtn = document.getElementById('mobile-menu-btn');
          if (menuBtn) menuBtn.click();
        }
      });
    }
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
