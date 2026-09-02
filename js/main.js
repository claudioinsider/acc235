/* Healthy Habit Academy - WORKING JavaScript */

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Page loaded');
    
    // MOBILE MENU - SIMPLE AND BULLETPROOF
    var toggle = document.querySelector('.mobile-menu-toggle');
    var menu = document.querySelector('.nav-menu');
    
    if (toggle && menu) {
        console.log('✅ Menu elements found');
        
        // Click handler
        toggle.onclick = function(e) {
            e.preventDefault();
            console.log('🖱️ Toggle clicked!');
            
            if (menu.classList.contains('active')) {
                menu.classList.remove('active');
                toggle.classList.remove('active');
                console.log('❌ Menu closed');
            } else {
                menu.classList.add('active');
                toggle.classList.add('active');
                console.log('✅ Menu opened');
            }
        };
        
        // Close on link click
        var links = menu.querySelectorAll('a');
        for (var i = 0; i < links.length; i++) {
            links[i].onclick = function() {
                menu.classList.remove('active');
                toggle.classList.remove('active');
                console.log('🔗 Link clicked, menu closed');
            };
        }
        
        // Close on outside click
        document.onclick = function(e) {
            if (!menu.contains(e.target) && !toggle.contains(e.target)) {
                if (menu.classList.contains('active')) {
                    menu.classList.remove('active');
                    toggle.classList.remove('active');
                    console.log('⬅️ Clicked outside, menu closed');
                }
            }
        };
    } else {
        console.log('❌ Menu elements not found!');
    }
    
    // Smooth scroll
    var smoothLinks = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < smoothLinks.length; i++) {
        smoothLinks[i].onclick = function(e) {
            var href = this.getAttribute('href');
            if (href === '#' || href.length <= 1) return;
            
            e.preventDefault();
            var target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };
    }
});
