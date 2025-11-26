// Smooth scroll for navigation links with sticky nav offset
const nav = document.querySelector('.nav-container');
const getSmoother = () => (typeof ScrollSmoother !== "undefined" ? ScrollSmoother.get() : null);

function getNavHeight() {
    return nav ? nav.offsetHeight : 0;
}

function scrollToAnchor(targetEl) {
    const offset = getNavHeight();
    const targetY = Math.max(targetEl.getBoundingClientRect().top + window.pageYOffset - offset, 0);
    const smoother = getSmoother();
    if (smoother) {
        smoother.scrollTo(targetY, true);
    } else {
        window.scrollTo({
            top: targetY,
            behavior: 'smooth'
        });
    }
}

function bindInternalAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#' || anchor.classList.contains('skip-link')) return;

        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                scrollToAnchor(target);
            }
        });
    });
}

bindInternalAnchors();

// Respect motion preferences and mobile constraints for ScrollSmoother
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const isTouchScreen = window.innerWidth < 768;

function initSmoother() {
    if (!prefersReducedMotion.matches && !isTouchScreen && typeof ScrollSmoother !== "undefined") {
        ScrollSmoother.create({
            wrapper: "#smooth-wrapper",
            content: "#smooth-content",
            smooth: 0.8,
            smoothTouch: 0.1,
            effects: true,
            normalizeScroll: true
        });

    }
}

initSmoother();
prefersReducedMotion.addEventListener('change', initSmoother);

// Theme toggle
const themeToggleBtn = document.querySelector('.theme-toggle');
const themeToggleIcon = document.querySelector('.theme-toggle-icon');
const metaThemeColor = document.querySelector('#meta-theme-color');
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(theme) {
    const body = document.body;
    body.classList.remove('theme-dark', 'theme-light');
    if (theme === 'dark') {
        body.classList.add('theme-dark');
        if (metaThemeColor) metaThemeColor.setAttribute('content', '#0f1115');
        if (themeToggleIcon) {
            themeToggleIcon.querySelector('.icon-moon').style.display = 'inline';
            themeToggleIcon.querySelector('.icon-sun').style.display = 'none';
        }
        if (themeToggleBtn) themeToggleBtn.setAttribute('aria-pressed', 'true');
    } else {
        body.classList.add('theme-light');
        if (metaThemeColor) metaThemeColor.setAttribute('content', '#ffffff');
        if (themeToggleIcon) {
            themeToggleIcon.querySelector('.icon-moon').style.display = 'none';
            themeToggleIcon.querySelector('.icon-sun').style.display = 'inline';
        }
        if (themeToggleBtn) themeToggleBtn.setAttribute('aria-pressed', 'false');
    }
}

function getStoredTheme() {
    return localStorage.getItem('theme-preference');
}

function getPreferredTheme() {
    const stored = getStoredTheme();
    if (stored === 'light' || stored === 'dark') return stored;
    return systemPrefersDark.matches ? 'dark' : 'light';
}

function toggleTheme() {
    const current = getPreferredTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme-preference', next);
    applyTheme(next);
}

applyTheme(getPreferredTheme());
systemPrefersDark.addEventListener('change', () => {
    const stored = getStoredTheme();
    if (!stored) {
        applyTheme(getPreferredTheme());
    }
});

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
}

// Set current year dynamically
if (document.getElementById('current-year')) {
    document.getElementById('current-year').textContent = new Date().getFullYear();
}

// Image fade-in when loaded
const fadeImages = document.querySelectorAll('.fade-image');
fadeImages.forEach((img) => {
    if (img.complete) {
        img.classList.add('is-loaded');
        return;
    }
    img.addEventListener('load', () => img.classList.add('is-loaded'));
});
