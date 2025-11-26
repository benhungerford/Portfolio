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
// GSAP ScrollSmoother init
if (typeof ScrollSmoother !== "undefined") {
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

// Hamburger menu toggle
const hamburger = document.querySelector('.hamburger');
const navRight = document.querySelector('.nav-right');
const menuOverlay = document.querySelector('.menu-overlay');

if (hamburger && navRight && menuOverlay) {
    // Toggle menu function
    function toggleMenu() {
        hamburger.classList.toggle('active');
        navRight.classList.toggle('active');
        menuOverlay.classList.toggle('active');

        // Prevent body scroll when menu is open
        if (navRight.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    // Close menu function
    function closeMenu() {
        hamburger.classList.remove('active');
        navRight.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Hamburger click
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    // Overlay click
    menuOverlay.addEventListener('click', closeMenu);

    // Close menu when clicking a nav link
    navRight.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}
