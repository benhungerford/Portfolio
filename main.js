// Register GSAP plugins when available
if (typeof gsap !== "undefined") {
    if (typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);
    }
    if (typeof ScrollSmoother !== "undefined") {
        gsap.registerPlugin(ScrollSmoother);
    }
}

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

// Frosted glass on project items when in view
function initProjectGlass() {
    if (typeof ScrollTrigger === "undefined") return;

    const rootStyles = getComputedStyle(document.documentElement);
    const parseRgba = (value) => {
        const match = value.match(/rgba?\\(([^)]+)\\)/);
        if (!match) return null;
        const parts = match[1].split(',').map((p) => parseFloat(p.trim()));
        if (parts.length === 3) parts.push(1);
        return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] };
    };
    const rgbaWithScale = (rgba, scale, fallback) => {
        if (!rgba) return fallback;
        const alpha = Math.max(0, Math.min(1, rgba.a * scale));
        return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${alpha})`;
    };

    const navBg = parseRgba(rootStyles.getPropertyValue('--nav-bg') || '');
    const navBorder = parseRgba(rootStyles.getPropertyValue('--nav-border') || '');
    const navShadow1 = parseRgba(rootStyles.getPropertyValue('--nav-shadow-1') || '');
    const navShadow2 = parseRgba(rootStyles.getPropertyValue('--nav-shadow-2') || '');

    const applyGlassState = (el, factor) => {
        const clamped = Math.max(0, Math.min(1, factor));
        el.style.backgroundColor = rgbaWithScale(navBg, clamped, `rgba(255,255,255,${0.78 * clamped})`);
        el.style.borderColor = rgbaWithScale(navBorder, clamped, `rgba(0,0,0,${0.04 * clamped})`);

        if (clamped === 0) {
            el.style.boxShadow = 'none';
            el.style.backdropFilter = 'none';
        } else {
            const shadow1 = rgbaWithScale(navShadow1, clamped, `rgba(0,0,0,${0.06 * clamped})`);
            const shadow2 = rgbaWithScale(navShadow2, clamped, `rgba(255,255,255,${0.04 * clamped})`);
            el.style.boxShadow = `0 18px 40px -18px ${shadow1}, 0 1px 0 0 ${shadow2}`;
            el.style.backdropFilter = `blur(${(10 * clamped).toFixed(2)}px) saturate(${(100 + 20 * clamped).toFixed(0)}%)`;
        }
    };

    document.querySelectorAll('.project-item').forEach((item) => {
        item.classList.add('project-glass');
        applyGlassState(item, 0);

        ScrollTrigger.create({
            trigger: item,
            start: "top 70%",
            end: "bottom 30%",
            scrub: true,
            onUpdate: (self) => {
                // Triangle wave: 0 at start/end, 1 at midpoint (50%)
                const factor = Math.max(0, 1 - Math.abs(self.progress * 2 - 1));
                applyGlassState(item, factor);
            }
        });
    });
}

initProjectGlass();

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
