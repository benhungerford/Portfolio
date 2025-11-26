// Smooth Scroll for navigation links only
document.querySelectorAll('.nav-right a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Respect motion preferences and mobile constraints for ScrollSmoother
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouchScreen = window.innerWidth < 768;

if (!prefersReducedMotion && !isTouchScreen && typeof ScrollSmoother !== "undefined") {
    ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 1.5,
        effects: true,
        smoothTouch: 0.1
    });
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
