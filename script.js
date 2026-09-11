document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000/api' : '/api';

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
    let suggestionBox = document.getElementById('search-suggestions');
    let searchTimer;

    if (searchInput && !suggestionBox) {
        suggestionBox = document.createElement('div');
        suggestionBox.id = 'search-suggestions';
        suggestionBox.className = 'search-suggestions';
        searchInput.closest('.search-container')?.appendChild(suggestionBox);
    }

    function renderSuggestions(matches, query) {
        if (!suggestionBox) return;
        suggestionBox.replaceChildren();
        if (matches.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'suggestion-empty';
            empty.textContent = `No services found for “${query}”`;
            suggestionBox.appendChild(empty);
            suggestionBox.style.display = 'block';
            return;
        }

        matches.forEach(service => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'suggestion-item';
            if (service.img || service.image_url) {
                const image = document.createElement('img');
                image.src = service.img || service.image_url;
                image.alt = '';
                item.appendChild(image);
            }
            const copy = document.createElement('span');
            const name = document.createElement('strong');
            name.textContent = service.name || service.title;
            const category = document.createElement('small');
            category.textContent = service.cat || service.category_name || 'Shipping service';
            copy.append(name, category);
            item.appendChild(copy);
            item.addEventListener('click', () => {
                window.location.href = 'contact.html?query=' + encodeURIComponent(name.textContent);
            });
            suggestionBox.appendChild(item);
        });
        suggestionBox.style.display = 'block';
    }

    async function findServices(query) {
        try {
            const response = await fetch(`${API_BASE}/services?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Search request failed');
            return await response.json();
        } catch (error) {
            return services.filter(service =>
                `${service.name} ${service.cat}`.toLowerCase().includes(query.toLowerCase())
            );
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            clearTimeout(searchTimer);
            if (!suggestionBox || query.length < 2) {
                if (suggestionBox) suggestionBox.style.display = 'none';
                return;
            }
            searchTimer = setTimeout(async () => renderSuggestions(await findServices(query), query), 250);
        });
    }

    document.getElementById('search-action-btn')?.addEventListener('click', () => {
        const query = searchInput?.value.trim();
        if (query) window.location.href = 'contact.html?query=' + encodeURIComponent(query);
    });

    // --- 4. Freight Simulator ---
    const calculateButton = document.getElementById('calculate-btn');
    calculateButton?.addEventListener('click', () => {
        const origin = document.getElementById('calc-origin');
        const destination = document.getElementById('calc-dest');
        const commodity = document.getElementById('calc-type');
        const price = document.getElementById('est-price');
        const route = document.getElementById('est-route');
        if (!origin || !destination || !commodity || !price || !route) return;

        const routeRates = { dubai: 1450, usa: 2200, china: 1850 };
        const destinationRates = { kenya: 0, nigeria: 250, tanzania: 180 };
        const commodityRates = { car: 0, machinery: 700, electronics: 420 };
        const estimate = routeRates[origin.value] + destinationRates[destination.value] + commodityRates[commodity.value];
        const originLabel = origin.options[origin.selectedIndex].text;
        const destinationLabel = destination.options[destination.selectedIndex].text;
        price.textContent = `$${estimate.toLocaleString()}`;
        route.textContent = `${originLabel} to ${destinationLabel} • indicative estimate`;
    });

    searchInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') document.getElementById('search-action-btn')?.click();
        if (event.key === 'Escape' && suggestionBox) suggestionBox.style.display = 'none';
    });

    // --- 4. Account Dropdowns ---
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        dropdown.setAttribute('aria-expanded', 'false');
        dropdown.addEventListener('click', (event) => {
            if (event.target.closest('.dropdown-content')) return;
            event.preventDefault();
            const isOpen = dropdown.classList.toggle('open');
            dropdown.setAttribute('aria-expanded', String(isOpen));
        });
    });

    document.addEventListener('click', (event) => {
        document.querySelectorAll('.dropdown.open').forEach(dropdown => {
            if (!dropdown.contains(event.target)) {
                dropdown.classList.remove('open');
                dropdown.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // --- 6. Quote Request System ---
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
        modalBtn.onclick = async () => {
            const id = modalInput.value.trim().toUpperCase();
            if (id.length < 5) return alert("Enter valid Tracking ID");
            try {
                const response = await fetch(`${API_BASE}/track/${encodeURIComponent(id)}`);
                if (!response.ok) throw new Error('Tracking number not found.');
                const shipment = await response.json();
                document.getElementById('status-text').textContent = `${shipment.tracking_number} | ${shipment.current_status}`;
                document.getElementById('track-status-result').style.display = 'block';
                document.querySelectorAll('.status-node').forEach((node, index) => {
                    node.classList.toggle('active', index < shipment.tracking_stage);
                });
            } catch (error) {
                alert(error.message);
            }
        };
    }

    // --- 6. Dashboard Integration ---
    const shipmentList = document.getElementById('shipment-list');
    const dashboardSync = document.getElementById('dashboard-sync');

    function renderShipments(shipments) {
        if (!shipmentList) return;
        shipmentList.replaceChildren();
        if (shipments.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'dashboard-state';
            empty.textContent = 'No shipments are currently assigned to this portal.';
            shipmentList.appendChild(empty);
            return;
        }

        shipments.forEach(shipment => {
            const card = document.createElement('article');
            card.className = 'shipment-card';
            const stage = Math.max(1, Math.min(4, Number(shipment.tracking_stage) || 1));
            const status = shipment.current_status || 'In progress';
            card.innerHTML = `
                <div class="shipment-heading">
                    <div><span class="shipment-label">HBL / TRACKING</span><strong>${shipment.tracking_number}</strong></div>
                    <span class="shipment-status">${status}</span>
                </div>
                <div class="shipment-route"><span><i class="fas fa-map-marker-alt"></i>${shipment.origin || 'Origin pending'}</span><i class="fas fa-arrow-right"></i><span><i class="fas fa-flag-checkered"></i>${shipment.destination || 'Destination pending'}</span></div>
                <div class="shipment-progress"><span style="width: ${stage * 25}%"></span></div>
                <div class="shipment-meta"><span>${shipment.description || 'Freight shipment'}</span><span>Stage ${stage} of 4</span></div>`;
            shipmentList.appendChild(card);
        });
    }

    if (shipmentList) {
        fetch(`${API_BASE}/shipments`)
            .then(response => { if (!response.ok) throw new Error('Unable to load shipments.'); return response.json(); })
            .then(shipments => { renderShipments(shipments); if (dashboardSync) dashboardSync.textContent = 'Live data'; })
            .catch(error => { shipmentList.innerHTML = `<div class="dashboard-state error"><i class="fas fa-triangle-exclamation"></i> ${error.message} Start the server to view live shipments.</div>`; if (dashboardSync) dashboardSync.textContent = 'Offline'; });
    }

    // --- 8. Quote and newsletter submissions ---
    const quoteForm = document.getElementById('marketplace-contact-form');
    quoteForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const status = document.getElementById('quote-form-status');
        const values = new FormData(quoteForm);
        const payload = {
            full_name: values.get('full_name') || quoteForm.querySelector('input[type="text"]')?.value,
            email: values.get('email') || quoteForm.querySelector('input[type="email"]')?.value,
            commodity_type: values.get('commodity_type') || quoteForm.querySelector('select')?.value,
            shipment_details: values.get('shipment_details') || quoteForm.querySelector('textarea')?.value
        };
        try {
            const response = await fetch(`${API_BASE}/quotes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Unable to submit request.');
            status.textContent = 'Request received. A freight specialist will respond within 24 hours.';
            status.className = 'form-status success';
            quoteForm.reset();
        } catch (error) {
            status.textContent = error.message;
            status.className = 'form-status error';
        }
    });

    document.getElementById('subscribe-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const input = document.getElementById('sub-email');
        if (!input?.value) return;
        try {
            const response = await fetch(`${API_BASE}/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: input.value }) });
            if (!response.ok) throw new Error('Unable to subscribe.');
            input.value = '';
            showToast('Subscription confirmed.');
        } catch (error) { showToast(error.message); }
    });

    // --- 8. Quick View ---
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
            if (modal) modal.style.display = 'none';
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
            if (modal) modal.style.display = 'none';
            if (qvModal) qvModal.style.display = 'none';
        }
    };
});