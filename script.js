document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Global Data for Search Suggestions ---
    const services = [
        { name: 'Luxury Sedan Shipping', cat: 'vehicles', img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=50&q=80' },
        { name: 'SUV & 4x4 Transport', cat: 'vehicles', img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=50&q=80' },
        { name: 'Heavy Duty Truck Freight', cat: 'vehicles', img: 'https://images.unsplash.com/photo-1562911791-c7a97b729ec5?auto=format&fit=crop&w=50&q=80' },
        { name: 'Industrial Engine Logistics', cat: 'mechanics', img: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=50&q=80' },
        { name: 'Heavy Machinery Flat-Rack', cat: 'machinery', img: 'https://images.unsplash.com/photo-1579847611797-d463328e12f4?auto=format&fit=crop&w=50&q=80' },
        { name: 'Medical Tech Shipping', cat: 'electronics', img: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=50&q=80' }
    ];

    // --- 2. Hero Slider ---
    let slideIdx = 0;
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.dot');

    function moveSlide(n) {
        if (slides.length === 0) return;
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        slideIdx = (n + slides.length) % slides.length;
        slides[slideIdx].classList.add('active');
        if (dots[slideIdx]) dots[slideIdx].classList.add('active');
    }
    if (slides.length > 0) setInterval(() => moveSlide(slideIdx + 1), 6000);

    // --- 3. Live Search Suggestions ---
    const searchInput = document.getElementById('main-search');
    const suggestionBox = document.getElementById('search-suggestions');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase().trim();
            suggestionBox.innerHTML = '';
            if (val.length < 2) {
                suggestionBox.style.display = 'none';
                return;
            }
            const matches = services.filter(s => s.name.toLowerCase().includes(val));
            if (matches.length > 0) {
                matches.forEach(m => {
                    const item = document.createElement('div');
                    item.className = 'suggestion-item';
                    item.innerHTML = `<img src="${m.img}"> <div><strong>${m.name}</strong><br><small>${m.cat}</small></div>`;
                    item.onclick = () => window.location.href = 'contact.html?query=' + encodeURIComponent(m.name);
                    suggestionBox.appendChild(item);
                });
                suggestionBox.style.display = 'block';
            }
        });
    }

    // --- 4. Quote Request System ---
    let quotes = parseInt(localStorage.getItem('zahaati_quotes')) || 0;
    const badge = document.getElementById('cart-count');
    if (badge) badge.textContent = quotes;

    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            quotes++;
            localStorage.setItem('zahaati_quotes', quotes);
            if (badge) {
                badge.textContent = quotes;
                badge.style.animation = 'bounceBadge 0.4s';
                setTimeout(() => badge.style.animation = '', 400);
            }
            showToast("Service added to your request list!");
        });
    });

    // --- 5. Tracking Logic ---
    const modal = document.getElementById('track-modal');
    const modalInput = document.getElementById('modal-track-input');
    const modalBtn = document.getElementById('modal-track-btn');

    document.querySelectorAll('.modal-trigger').forEach(trigger => {
        trigger.onclick = (e) => { e.preventDefault(); modal.style.display = 'block'; };
    });

    if (modalBtn) {
        modalBtn.onclick = () => {
            const id = modalInput.value.trim();
            if (id.length < 5) return alert("Enter valid Tracking ID");
            document.getElementById('status-text').innerHTML = `ID: <strong>${id.toUpperCase()}</strong> | Status: Dispatched`;
            document.getElementById('track-status-result').style.display = 'block';
            document.querySelectorAll('.status-node').forEach((n, i) => {
                setTimeout(() => n.classList.add('active'), i * 300);
            });
        };
    }

    // --- 6. Quick View ---
    const qvModal = document.getElementById('quick-view-modal');
    document.querySelectorAll('.quick-view-btn').forEach(btn => {
        btn.onclick = () => {
            const card = btn.closest('.item-card');
            document.getElementById('qv-name').textContent = card.querySelector('.name').textContent;
            document.getElementById('qv-price').textContent = card.querySelector('.price').textContent;
            document.getElementById('qv-img').src = card.querySelector('img').src;
            qvModal.style.display = 'block';
        };
    });

    document.querySelectorAll('.close-modal').forEach(c => {
        c.onclick = () => {
            modal.style.display = 'none';
            if (qvModal) qvModal.style.display = 'none';
        };
    });

    // --- Helpers ---
    function showToast(msg) {
        const t = document.createElement('div');
        t.className = 'toast-notify';
        t.innerHTML = `<i class="fas fa-check-circle"></i> ${msg}`;
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 500); }, 3000);
    }

    window.onclick = (e) => {
        if (e.target == modal || e.target == qvModal) {
            modal.style.display = 'none';
            if (qvModal) qvModal.style.display = 'none';
        }
    };
});