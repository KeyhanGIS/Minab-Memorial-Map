// =========================================
// 1. GLOBAL VARIABLES
// =========================================
let map;
let borderPoints = [];
let martyrsList = [];
let currentLang = 'en';
let currentMarker = null;
let searchTimeout = null;
let slidingContainer = null;

// =========================================
// 2. WAIT FOR DOM AND LOAD DATA
// =========================================
document.addEventListener('DOMContentLoaded', function() {
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error('Leaflet not loaded! Retrying...');
        setTimeout(arguments.callee, 500);
        return;
    }
    
    // Load both JSON files simultaneously
    Promise.all([
        fetch('js/border-points.json').then(res => res.json()),
        fetch('js/martyrs.json').then(res => res.json())
    ]).then(([borderData, martyrsData]) => {
        borderPoints = borderData.points;
        martyrsList = martyrsData.martyrs;
        
        console.log(`✅ Loaded ${borderPoints.length} border points`);
        console.log(`✅ Loaded ${martyrsList.length} martyrs`);
        
        // Initialize map after data is loaded
        initMap();
        createGlowingBorder();
        createHearts();
        setupSearch();
        setupBilingual();
        setupSidebarToggle();
        setupHint();
        initSlidingBanner();
        setupDragScroll();

        
    }).catch(error => {
        console.error('Error loading JSON files:', error);
        document.getElementById('heartCount').textContent = 'Error';
    });
});

// =========================================
// SLIDING BANNER FUNCTION
// =========================================

// =========================================
// SLIDING BANNER (martyrs names ticker)
// =========================================

// Current horizontal offset of the sliding text (persists across calls)
let bannerPos = 0;

// Animation frame id, used to start/stop the loop
let autoScrollInterval = null;

// True while the mouse is hovering the banner (pauses the animation)
let isHovering = false;

// True while the user is dragging the banner with the mouse
let isDragging = false;

// Initialize the banner once on page load
function initSlidingBanner() {
    const wrapper = document.getElementById('slidingWrapper');
    if (!wrapper) return;

    // Try to start right away...
    updateBannerText();

    // ...and also retry after the whole page (fonts, images, layout)
    // has fully loaded, in case widths weren't ready on the first try.
    window.addEventListener('load', () => {
        setTimeout(() => {
            updateBannerText();
        }, 300);
    });

    // Pause when mouse enters, resume when it leaves
    wrapper.addEventListener('mouseenter', () => {
        isHovering = true;
    });
    wrapper.addEventListener('mouseleave', () => {
        isHovering = false;
    });
}

// Build/rebuild the names list (called on language change too)
function updateBannerText() {
    const slidingContent = document.getElementById('slidingContent');
    const wrapper = document.getElementById('slidingWrapper');
    if (!slidingContent || !wrapper || !martyrsList.length) return;

    // Build "❤️ Name ❤️ • ❤️ Name ❤️ • ..." string
    const names = martyrsList
        .map(martyr => {
            const name = currentLang === 'fa' ? martyr.name_fa : martyr.name_en;
            return `<span>❤️</span> ${name} <span>❤️</span>`;
        })
        .join(' • ');

    // Duplicate the content so the loop has no visible jump
    slidingContent.innerHTML = names + ' • ' + names;

    // Stop any running animation before resetting
    stopAutoScroll();

    // Reset position to the start
    bannerPos = 0;
    slidingContent.style.transition = 'none';
    slidingContent.style.transform = 'translateX(0)';

    // Wait one frame so the browser updates layout/widths, then start
    requestAnimationFrame(() => {
        startAutoScroll();
    });
}

// Start the scrolling animation loop
function startAutoScroll() {
    const slidingContent = document.getElementById('slidingContent');
    const wrapper = document.getElementById('slidingWrapper');
    if (!slidingContent || !wrapper) return;

    // Don't start a second loop if one is already running
    if (autoScrollInterval) return;

    // Half width = width of one copy of the names (content is duplicated)
    const halfWidth = slidingContent.scrollWidth / 2;

    // No need to scroll if the content already fits
    if (halfWidth <= wrapper.clientWidth) return;

    // Direction: Persian moves right (+), English moves left (-)
    const direction = currentLang === 'fa' ? 1 : -1;

    // Speed in pixels per frame
    const speed = 0.7;

    function step() {
        // Only move when not hovering and not dragging
        if (!isHovering && !isDragging) {
            bannerPos += direction * speed;

            // Loop back to start once a full cycle has passed
            if (Math.abs(bannerPos) >= halfWidth) {
                bannerPos = 0;
            }

            slidingContent.style.transform = `translateX(${bannerPos}px)`;
        }

        autoScrollInterval = requestAnimationFrame(step);
    }

    autoScrollInterval = requestAnimationFrame(step);
}

// Stop the scrolling animation loop
function stopAutoScroll() {
    if (autoScrollInterval) {
        cancelAnimationFrame(autoScrollInterval);
        autoScrollInterval = null;
    }
}

// Optional: allow dragging the banner with the mouse
function setupDragScroll() {
    const wrapper = document.getElementById('slidingWrapper');
    if (!wrapper) return;

    wrapper.addEventListener('mousedown', () => {
        isDragging = true;
        wrapper.style.cursor = 'grabbing';
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        wrapper.style.cursor = 'grab';
        // Animation loop is still running (just paused via isDragging),
        // so it will resume automatically.
    });
}
// =========================================
// 3. MAP INITIALIZATION
// =========================================
function initMap() {
    map = L.map('map').setView([27.5, 56.5], 7);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
    
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
}

// =========================================
// 4. GLOWING BORDER LINE
// =========================================
function createGlowingBorder() {
    // Boundary boundary (connecting the last point to the first)
    const closedBorderPoints = [...borderPoints, borderPoints[0]];
  
    // Convert border points to format needed for polyline (swap lat/lng for Leaflet)
    const borderLinePoints = closedBorderPoints.map(point => [point[0], point[1]]);    
    
    // Main green line with dash animation
    const borderLine = L.polyline(borderLinePoints, {
        color: '#00ff88',
        weight: 3,
        opacity: 0.9,
        dashArray: '12, 16'
    }).addTo(map);
    
    // Glow effect underneath
    L.polyline(borderLinePoints, {
        color: '#ffffff',
        weight: 6,
        opacity: 0.3
    }).addTo(map);
    
    // Animate the dashed line
    let dashOffset = 0;
    function animateBorder() {
        dashOffset = (dashOffset + 1) % 28;
        borderLine.setStyle({ dashOffset: dashOffset });
        requestAnimationFrame(animateBorder);
    }
    animateBorder();
    
    // Fit map to bounds
    try {
        const bounds = L.latLngBounds(borderLinePoints);
        map.fitBounds(bounds, { padding: [30, 30] });
    } catch (e) {
        map.setView([27.5, 56.5], 7);
    }
}
// =========================================
// 5. HEART MARKERS WITH MARTYR NAMES
// =========================================
function createHearts() {
    const heartIcon = L.divIcon({
        html: '<div class="heart-marker">❤️</div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        className: ''
    });
    
    const totalHearts = Math.min(borderPoints.length, martyrsList.length);
    
    for (let i = 0; i < totalHearts; i++) {
        const point = borderPoints[i];
        const martyr = martyrsList[i];
        
        const marker = L.marker([point[0], point[1]], {
            icon: heartIcon,
            interactive: true
        }).addTo(map);
        
        marker.bindPopup(() => {
            const name = currentLang === 'fa' ? martyr.name_fa : martyr.name_en;
            const job = currentLang === 'fa' ? martyr.job_fa : martyr.job_en;
            const ageText = currentLang === 'fa' ? `سن: ${martyr.age} سال` : `Age: ${martyr.age}`;
            
            return `
                <div class="martyr-popup" style="direction: ${currentLang === 'fa' ? 'rtl' : 'ltr'}; text-align: center; font-size: 13px;">
                    <div style="color: #ff3366; font-size: 20px; margin-bottom: 5px;">❤️</div>
                    <div style="font-weight: bold; color: #1a5c38;">${name}</div>
                    <div style="color: #555; margin-top: 5px;">${job}</div>
                    <div style="color: #888; font-size: 11px;">${ageText}</div>
                    <div style="color: #aaa; font-size: 10px; margin-top: 8px; border-top: 1px solid #eee; padding-top: 5px;">
                        🏴‍☠️ ${currentLang === 'fa' ? 'شهید والامقام میناب' : 'Martyr from Minab'}
                    </div>
                </div>
            `;
        }, { maxWidth: 220 });
    }
    
    document.getElementById('heartCount').textContent = totalHearts;
}

// =========================================
// 6. SEARCH FUNCTIONALITY
// =========================================
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsDiv = document.getElementById('searchResults');
    
    async function searchLocation(query) {
        if (!query || query.length < 2) {
            resultsDiv.classList.remove('active');
            return;
        }
        
        try {
            const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`;
            const response = await fetch(url);
            const data = await response.json();
            displayResults(data.features || []);
        } catch (error) {
            console.error('Search error:', error);
            resultsDiv.innerHTML = '<div class="result-item">Search error. Please try again.</div>';
            resultsDiv.classList.add('active');
        }
    }
    
    function displayResults(features) {
        if (!features.length) {
            resultsDiv.innerHTML = '<div class="result-item">No results found.</div>';
            resultsDiv.classList.add('active');
            return;
        }
        
        resultsDiv.innerHTML = features.map(feature => {
            const props = feature.properties;
            const coords = feature.geometry.coordinates;
            const name = [props.name, props.city, props.state, props.country]
                .filter(Boolean)
                .join(', ');
            
            return `
                <div class="result-item" data-lat="${coords[1]}" data-lon="${coords[0]}">
                    📍 ${name}
                </div>
            `;
        }).join('');
        
        document.querySelectorAll('.result-item').forEach(item => {
            item.addEventListener('click', () => {
                const lat = parseFloat(item.dataset.lat);
                const lon = parseFloat(item.dataset.lon);
                goToLocation(lat, lon, item.textContent);
            });
        });
        
        resultsDiv.classList.add('active');
    }
    
    function goToLocation(lat, lon, name) {
        map.setView([lat, lon], 12);
        
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }
        
        currentMarker = L.marker([lat, lon])
            .bindPopup(`<div style="font-size:12px;"><b>${name}</b></div>`)
            .addTo(map)
            .openPopup();
        
        searchInput.value = '';
        resultsDiv.classList.remove('active');
    }
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchLocation(e.target.value.trim()), 400);
    });
    
    searchBtn.addEventListener('click', () => {
        searchLocation(searchInput.value.trim());
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchLocation(searchInput.value.trim());
        }
    });
    
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
            resultsDiv.classList.remove('active');
        }
    });
}

// =========================================
// 7. BILINGUAL SUPPORT
// =========================================
function setupBilingual() {
    const translations = {
        en: {
            logo: 'Minab Martyrs Memorial',
            searchPlaceholder: 'Search for Minab, Bandar Abbas...',
            searchTitle: '🔍 Find Location',
            memorialTitle: '💚 Memorial',
            heartsLabel: 'Beating Hearts',
            poem: '"We live to never rest..."',
            locationText: 'Minab, Hormozgan, Iran',
            aboutTitle: '📖 About',
            aboutText: 'This map honors 158 martyrs from Minab city. Each red heart represents a brave soul who sacrificed for Iran.',
            badgeTitle: '158 Martyrs',
            badgeSubtitle: 'Minab, Iran',
            hintText: 'Each heart = One martyr'
        },
        fa: {
            logo: 'یادمان شهدای میناب',
            searchPlaceholder: 'جستجوی میناب، بندرعباس...',
            searchTitle: '🔍 جستجوی مکان',
            memorialTitle: '💚 یادمان',
            heartsLabel: 'قلب تپنده',
            poem: '"ما زنده به آنیم که آرام نگیریم..."',
            locationText: 'میناب، هرمزگان، ایران',
            aboutTitle: '📖 درباره',
            aboutText: 'این نقشه به یاد ۱۵۸ شهید والامقام میناب طراحی شده است. هر قلب قرمز نماد یکی از شهداست.',
            badgeTitle: '۱۵۸ شهید',
            badgeSubtitle: 'میناب، ایران',
            hintText: 'هر قلب = یک شهید'
        }
    };
    
    function updateLanguage() {
        const t = translations[currentLang];
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) el.textContent = t[key];
        });
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.placeholder = t.searchPlaceholder;
        }
        
        const logoText = document.querySelector('.logo-text');
        if (logoText) logoText.textContent = t.logo;
        
        const langBtn = document.getElementById('langToggle');
        if (langBtn) {
            const langSpan = langBtn.querySelector('.lang-text');
            if (langSpan) langSpan.textContent = currentLang === 'en' ? 'فارسی' : 'English';
        }
        
        const htmlTag = document.documentElement;
        if (currentLang === 'fa') {
            htmlTag.setAttribute('dir', 'rtl');
            htmlTag.setAttribute('lang', 'fa');
        } else {
            htmlTag.setAttribute('dir', 'ltr');
            htmlTag.setAttribute('lang', 'en');
        }
        
        // به‌روزرسانی بنر (این تابع خودش startAutoScroll را صدا می‌زند)
        updateBannerText();
        // راه‌اندازی مجدد قوی
        setTimeout(() => {
            const wrapper = document.getElementById('slidingWrapper');
            if (wrapper) {
                wrapper.scrollLeft = 0;
                if (autoScrollInterval) clearInterval(autoScrollInterval);
                startAutoScroll();
            }
        }, 300);
        
        // به‌روزرسانی پاپ‌آپ قلب‌ها
        updateAllPopups();
    }
    
    function updateAllPopups() {
        map.eachLayer(layer => {
            if (layer instanceof L.Marker && layer.getPopup()) {
                const latlng = layer.getLatLng();
                const index = borderPoints.findIndex(p => 
                    Math.abs(p[0] - latlng.lat) < 0.001 && 
                    Math.abs(p[1] - latlng.lng) < 0.001
                );
                
                if (index !== -1 && martyrsList[index]) {
                    const martyr = martyrsList[index];
                    const name = currentLang === 'fa' ? martyr.name_fa : martyr.name_en;
                    const job = currentLang === 'fa' ? martyr.job_fa : martyr.job_en;
                    const ageText = currentLang === 'fa' ? `سن: ${martyr.age} سال` : `Age: ${martyr.age}`;
                    
                    layer.unbindPopup();
                    layer.bindPopup(`
                        <div class="martyr-popup" style="direction: ${currentLang === 'fa' ? 'rtl' : 'ltr'}; text-align: center; font-size: 13px;">
                            <div style="color: #ff3366; font-size: 20px; margin-bottom: 5px;">❤️</div>
                            <div style="font-weight: bold; color: #1a5c38;">${name}</div>
                            <div style="color: #555; margin-top: 5px;">${job}</div>
                            <div style="color: #888; font-size: 11px;">${ageText}</div>
                            <div style="color: #aaa; font-size: 10px; margin-top: 8px; border-top: 1px solid #eee; padding-top: 5px;">
                                🏴‍☠️ ${currentLang === 'fa' ? 'شهید والامقام میناب' : 'Martyr from Minab'}
                            </div>
                        </div>
                    `, { maxWidth: 220 });
                }
            }
        });
    }
    
    window.toggleLanguage = function() {
        currentLang = currentLang === 'en' ? 'fa' : 'en';
        updateLanguage();
    };
    
    document.getElementById('langToggle').addEventListener('click', window.toggleLanguage);
    updateLanguage();
}

// =========================================
// 8. HINT TOOLTIP
// =========================================
function setupHint() {
    const hintElement = document.getElementById('hint');
    setTimeout(() => {
        hintElement.style.opacity = '0';
        setTimeout(() => {
            hintElement.style.display = 'none';
        }, 300);
    }, 5000);
}





// =========================================
//  setupSidebarToggle
// =========================================

function setupSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar || !toggleBtn || !overlay) {
        console.log('Sidebar elements not found');
        return;
    }
    
    console.log('✅ Sidebar toggle initialized');
    
    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // prevent background scroll
    }
    
    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sidebar.classList.contains('open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });
    
    overlay.addEventListener('click', closeSidebar);
    
    // Close sidebar on window resize if desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 700) {
            closeSidebar();
        }
    });
}


// =========================================
// 9. CONSOLE MESSAGE
// =========================================
console.log(`%c❤️ Minab Martyrs Memorial ❤️`, 'color: #ff3366; font-size: 16px; font-weight: bold;');
console.log(`%cHonoring the memory of martyrs from Minab, Hormozgan`, 'color: #888; font-size: 11px;');