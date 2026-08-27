document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Hero Slider Interactivity ---
    let currentSlide = 0;
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.dot');

    function showSlide(n) {
        if (slides.length === 0) return;
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        currentSlide = (n + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');
    }

    let sliderTimer = setInterval(() => showSlide(currentSlide + 1), 5000);

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            clearInterval(sliderTimer);
            showSlide(index);
            sliderTimer = setInterval(() => showSlide(currentSlide + 1), 5000);
        });
    });

    // --- 2. Live Search & Service Filtering ---
    const searchInput = document.getElementById('main-search');
    const searchBtn = document.getElementById('search-action-btn');
    const items = document.querySelectorAll('#service-grid .item-card');

    function filterServices() {
        const val = searchInput.value.toLowerCase();
        items.forEach(item => {
            const name = item.querySelector('.name').textContent.toLowerCase();
            const cat = item.getAttribute('data-category') || '';
            if (name.includes(val) || cat.toLowerCase().includes(val)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterServices);
    }
    if (searchBtn) {
        searchBtn.addEventListener('click', filterServices);
    }

    // --- 3. Quotes "Cart" Interaction ---
    let quoteCount = 0;
    const countBadge = document.getElementById('cart-count');

    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            quoteCount++;
            if (countBadge) {
                countBadge.textContent = quoteCount;
                countBadge.style.display = 'flex';
                countBadge.style.animation = 'bounce 0.4s';
                setTimeout(() => countBadge.style.animation = '', 400);
            }

            // Visual feedback on button
            const originalText = btn.textContent;
            btn.textContent = 'ADDED';
            btn.style.background = '#002e5b';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 1500);

            showToast("Service added to your inquiry list!");
        });
    });

    // --- 3b. Quick View Modal ---
    const quickViewModal = document.getElementById('quick-view-modal');
    const quickViewImage = document.getElementById('qv-img');
    const quickViewName = document.getElementById('qv-name');
    const quickViewPrice = document.getElementById('qv-price');

    document.querySelectorAll('.quick-view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const card = btn.closest('.item-card');
            const image = card?.querySelector('img');
            const name = card?.querySelector('.name');
            const price = card?.querySelector('.price');

            if (!quickViewModal || !image || !name || !price) return;

            quickViewImage.src = image.src;
            quickViewImage.alt = image.alt;
            quickViewName.textContent = name.textContent;
            quickViewPrice.textContent = price.textContent;
            quickViewModal.style.display = 'block';
        });
    });

    // --- 4. Tracking Modal Logic ---
    const trackModal = document.getElementById('track-modal');
    const modalTrackBtn = document.getElementById('modal-track-btn');
    const closeModals = document.querySelectorAll('.close-modal');
    const trackingRecords = {
        ZH123456: { status: 'Dispatched from Global Hub.', stage: 2 },
        ZH654321: { status: 'In transit to destination port.', stage: 3 },
        ZH202600: { status: 'Arrived at destination and ready for delivery.', stage: 4 }
    };

    document.querySelectorAll('.modal-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            if (trackModal) trackModal.style.display = 'block';
        });
    });

    if (modalTrackBtn) {
        modalTrackBtn.onclick = () => {
            const num = document.getElementById('modal-track-input').value.trim();
            if (num.length < 5) {
                alert("Please enter a valid tracking number.");
                return;
            }
            const trackingId = num.toUpperCase();
            const record = trackingRecords[trackingId];
            const statusBox = document.getElementById('track-status-result');
            const statusText = document.getElementById('status-text');
            if (statusBox && statusText) {
                statusText.textContent = record
                    ? `Tracking ID: ${trackingId} | Status: ${record.status}`
                    : `Tracking ID: ${trackingId} was not found. Check the number and try again.`;
                statusBox.style.display = 'block';

                // Animate progress nodes
                const nodes = document.querySelectorAll('.status-node');
                nodes.forEach((n, i) => {
                    n.classList.remove('active');
                    if (record && i < record.stage) {
                        setTimeout(() => n.classList.add('active'), i * 300);
                    }
                });
            }
        };
    }

    closeModals.forEach(c => {
        c.onclick = () => {
            const modal = c.closest('.modal');
            if (modal) modal.style.display = 'none';
        };
    });

    // --- 5. Flash Deals Timer ---
    function updateTimer() {
        const timerEl = document.getElementById('flash-timer');
        if (!timerEl) return;

        const now = new Date();
        const end = new Date();
        end.setHours(23, 59, 59);
        const diff = end - now;

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        timerEl.textContent = `${h}h : ${m}m : ${s}s`;
    }
    setInterval(updateTimer, 1000);
    updateTimer();

    // --- Helper: Toast Notification ---
    function showToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'toast-notify';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    // --- 6. Form Feedback ---
    const subscribeForm = document.querySelector('.subscribe-form');
    const subscribeEmail = document.getElementById('sub-email');
    if (subscribeForm && subscribeEmail) {
        subscribeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!subscribeEmail.checkValidity()) {
                subscribeEmail.reportValidity();
                return;
            }
            showToast('You are subscribed to route updates.');
            subscribeForm.reset();
        });
    }

    window.onclick = (e) => {
        if (e.target.classList.contains('modal')) e.target.style.display = 'none';
    }
});