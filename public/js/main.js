// 
// Create JavaScript with:
// - Event listeners
// - Form handling
// - Smooth scrolling/animations
// - Mobile menu toggle
// - Any interactive features

document.addEventListener('DOMContentLoaded', () => {
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const navList = document.querySelector('.nav-list');

    // Mobile menu toggle
    if (hamburgerMenu && navList) {
        hamburgerMenu.addEventListener('click', () => {
            navList.classList.toggle('nav-open');
            // Toggle ARIA expanded attribute for accessibility
            const isExpanded = hamburgerMenu.getAttribute('aria-expanded') === 'true';
            hamburgerMenu.setAttribute('aria-expanded', !isExpanded);
        });

        // Close menu if a link is clicked (for single-page navigation)
        navList.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navList.classList.contains('nav-open')) {
                    navList.classList.remove('nav-open');
                    hamburgerMenu.setAttribute('aria-expanded', 'false');
                }
            });
        });

        // Close menu if clicking outside (optional, but good UX)
        document.addEventListener('click', (event) => {
            if (!navList.contains(event.target) && !hamburgerMenu.contains(event.target) && navList.classList.contains('nav-open')) {
                navList.classList.remove('nav-open');
                hamburgerMenu.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Highlight active navigation link
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.main-nav .nav-list a');

    navLinks.forEach(link => {
        // Remove .html from the path for cleaner comparison
        const linkPath = link.getAttribute('href').replace('.html', '');
        const currentPathClean = currentPath.replace('.html', '').replace('/public', ''); // Account for public folder

        // Handle root path separately if needed, e.g., '/' and '/index'
        if (linkPath === '/' && currentPathClean === '/index') {
            link.classList.add('nav-active');
        } else if (linkPath === currentPathClean || currentPathClean.startsWith(linkPath) && linkPath !== '/') {
            link.classList.add('nav-active');
        } else if (linkPath.includes('index') && (currentPathClean === '/' || currentPathClean === '')) {
            link.classList.add('nav-active');
        }
    });
});