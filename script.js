document.addEventListener('DOMContentLoaded', () => {
    const configuredApiBase = window.ZAHAATI_API_BASE?.trim();
    const API_BASE = configuredApiBase || (window.location.protocol === 'file:' ? 'http://localhost:3000/api' : '/api');

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
        const authTrigger = document.createElement('button');
        authTrigger.type = 'button';
        authTrigger.className = 'auth-menu-trigger';
        authTrigger.innerHTML = '<i class="fas fa-user-lock"></i> SIGN IN / SIGN UP';
        authTrigger.addEventListener('click', (event) => {
            event.stopPropagation();
            openAuthModal('login');
        });
        const divider = dropdown.querySelector('.dropdown-content hr');
        if (divider) divider.before(authTrigger);
        else dropdown.querySelector('.dropdown-content')?.prepend(authTrigger);
        dropdown.addEventListener('click', (event) => {
            if (event.target.closest('.dropdown-content')) return;
            event.preventDefault();
            const isOpen = dropdown.classList.toggle('open');
            dropdown.setAttribute('aria-expanded', String(isOpen));
        });
    });

    function getAuthModal() {
        let authModal = document.getElementById('auth-modal');
        if (authModal) return authModal;
        authModal = document.createElement('div');
        authModal.id = 'auth-modal';
        authModal.className = 'modal';
        authModal.setAttribute('role', 'dialog');
        authModal.setAttribute('aria-modal', 'true');
        authModal.innerHTML = `
            <div class="modal-content"><button class="close-modal" type="button" aria-label="Close account dialog">&times;</button>
                <div class="auth-panel"><h3 id="auth-title"><i class="fas fa-user-lock"></i> Client Portal Access</h3>
                <p class="auth-intro">Manage your shipments and quote requests securely.</p>
                <div class="auth-tabs" role="tablist" aria-label="Account access mode"><button type="button" role="tab" aria-selected="true" class="auth-tab active" data-auth-mode="login">SIGN IN</button><button type="button" role="tab" aria-selected="false" class="auth-tab" data-auth-mode="signup">CREATE ACCOUNT</button></div>
                <div id="auth-form-status" class="form-status" role="status" aria-live="polite"></div>
                <form id="login-form" class="auth-form"><label for="login-email">Email address</label><input id="login-email" name="email" type="email" autocomplete="email" required><label for="login-password">Password</label><input id="login-password" name="password" type="password" autocomplete="current-password" required><button class="hero-btn auth-submit" type="submit">SIGN IN</button></form>
                <form id="signup-form" class="auth-form" hidden><label for="signup-name">Full name</label><input id="signup-name" name="full_name" type="text" autocomplete="name" required><label for="signup-email">Email address</label><input id="signup-email" name="email" type="email" autocomplete="email" required><label for="signup-company">Company name <span>(optional)</span></label><input id="signup-company" name="company_name" type="text" autocomplete="organization"><label for="signup-password">Password <span>(8 characters minimum)</span></label><input id="signup-password" name="password" type="password" autocomplete="new-password" minlength="8" required><button class="hero-btn auth-submit" type="submit">CREATE ACCOUNT</button></form></div>
            </div>`;
        document.body.appendChild(authModal);
        return authModal;
    }

    function openAuthModal(mode = 'login') {
        const authModal = getAuthModal();
        authModal.style.display = 'block';
        authModal.querySelector(`[data-auth-mode="${mode}"]`)?.click();
    }

    document.getElementById('mobile-login-btn')?.addEventListener('click', (event) => {
        event.preventDefault();
        openAuthModal('login');
    });

    document.addEventListener('click', (event) => {
        const tab = event.target.closest('.auth-tab');
        if (!tab) return;
        const mode = tab.dataset.authMode;
        document.querySelectorAll('.auth-tab').forEach(item => {
            const active = item === tab;
            item.classList.toggle('active', active);
            item.setAttribute('aria-selected', String(active));
        });
        document.getElementById('login-form')?.toggleAttribute('hidden', mode !== 'login');
        document.getElementById('signup-form')?.toggleAttribute('hidden', mode !== 'signup');
        const status = document.getElementById('auth-form-status');
        if (status) status.textContent = '';
    });

    document.addEventListener('click', (event) => {
        if (event.target.closest('[data-auth-mode]')) return;
        if (event.target.closest('#auth-modal .close-modal')) document.getElementById('auth-modal').style.display = 'none';
        if (event.target.closest('[href="index.html"]')?.textContent.includes('Logout')) {
            event.preventDefault();
            fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).finally(() => { window.location.href = 'index.html'; });
        }
    });

    async function submitAuthForm(form, endpoint, successMessage) {
        const status = document.getElementById('auth-form-status');
        const payload = Object.fromEntries(new FormData(form));
        try {
            const response = await fetch(`${API_BASE}/auth/${endpoint}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Authentication failed.');
            status.textContent = successMessage;
            status.className = 'form-status success';
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
        } catch (error) {
            status.textContent = error.message;
            status.className = 'form-status error';
        }
    }

    document.addEventListener('submit', (event) => {
        if (event.target.id === 'login-form') { event.preventDefault(); submitAuthForm(event.target, 'login', 'Signed in. Opening your portal...'); }
        if (event.target.id === 'signup-form') { event.preventDefault(); submitAuthForm(event.target, 'signup', 'Account created. Opening your portal...'); }
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

    function addRequest(serviceName) {
        const requestItems = JSON.parse(localStorage.getItem('zahaati_request_items') || '[]');
        requestItems.push({ name: serviceName, addedAt: new Date().toISOString() });
        localStorage.setItem('zahaati_request_items', JSON.stringify(requestItems));
        quotes++;
        localStorage.setItem('zahaati_quotes', quotes);
        if (badge) {
            badge.textContent = quotes;
            badge.style.animation = 'bounceBadge 0.4s';
            setTimeout(() => badge.style.animation = '', 400);
        }
        window.location.href = 'contact.html?service=' + encodeURIComponent(serviceName);
    }

    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const card = btn.closest('.item-card');
            const serviceName = card?.querySelector('.name')?.textContent.trim()
                || document.getElementById('qv-name')?.textContent.trim()
                || 'Freight service';
            addRequest(serviceName);
        });
    });

    const requestedService = new URLSearchParams(window.location.search).get('service')
        || new URLSearchParams(window.location.search).get('query');
    const shipmentDetails = document.querySelector('[name="shipment_details"]');
    if (requestedService && shipmentDetails) {
        shipmentDetails.value = `I would like a quote for: ${requestedService}\n\nOrigin and destination: `;
        shipmentDetails.focus();
    }

    // --- 5. Tracking Logic ---
    const modal = document.getElementById('track-modal');
    const modalInput = document.getElementById('modal-track-input');
    const modalBtn = document.getElementById('modal-track-btn');

    document.querySelectorAll('.modal-trigger').forEach(trigger => {
        trigger.onclick = (e) => {
            e.preventDefault();
            const targetId = trigger.dataset.target || 'track-modal';
            const targetModal = document.getElementById(targetId);
            if (targetModal) targetModal.style.display = 'block';
        };
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
                const result = document.getElementById('track-status-result');
                result.hidden = false;
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
    const quoteList = document.getElementById('quote-list');
    const addressSection = document.getElementById('address-list');
    const addressesGrid = document.getElementById('addresses');
    const addressForm = document.getElementById('address-form');
    const addressFormTitle = document.getElementById('address-form-title');
    const addressFormStatus = document.getElementById('address-form-status');
    const addressCancel = document.getElementById('address-cancel');
    const settingsSection = document.getElementById('settings-panel');
    const profileForm = document.getElementById('profile-form');
    const profileFormStatus = document.getElementById('profile-form-status');
    const passwordForm = document.getElementById('password-form');
    const passwordFormStatus = document.getElementById('password-form-status');
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
            const description = (shipment.description || '').toLowerCase();
            const image = description.includes('vehicle') || description.includes('car')
                ? 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=320&q=80'
                : description.includes('machinery') || description.includes('equipment')
                    ? 'https://images.unsplash.com/photo-1579847611797-d463328e12f4?auto=format&fit=crop&w=320&q=80'
                    : description.includes('electronic') || description.includes('medical')
                        ? 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=320&q=80'
                        : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=320&q=80';
            card.innerHTML = `
                <div class="shipment-card-top">
                    <img class="shipment-image" src="${image}" alt="${shipment.description || 'Freight shipment'}">
                    <div class="shipment-card-content">
                        <div class="shipment-heading">
                            <div><span class="shipment-label">HBL / TRACKING</span><strong>${shipment.tracking_number}</strong></div>
                            <span class="shipment-status">${status}</span>
                        </div>
                        <div class="shipment-route"><span><i class="fas fa-map-marker-alt"></i>${shipment.origin || 'Origin pending'}</span><i class="fas fa-arrow-right"></i><span><i class="fas fa-flag-checkered"></i>${shipment.destination || 'Destination pending'}</span></div>
                    </div>
                </div>
                <div class="shipment-progress"><span style="width: ${stage * 25}%"></span></div>
                <div class="shipment-meta"><span>${shipment.description || 'Freight shipment'}</span><span>Stage ${stage} of 4</span></div>`;
            shipmentList.appendChild(card);
        });
    }

    if (shipmentList) {
        fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
            .then(response => { if (response.status === 401) { window.location.href = 'index.html'; throw new Error('Please sign in to view your portal.'); } if (!response.ok) throw new Error('Unable to verify your session.'); return response.json(); })
            .then(({ user }) => { populateProfile(user); return fetch(`${API_BASE}/shipments`, { credentials: 'include' }); })
            .then(response => { if (!response.ok) throw new Error('Unable to load shipments.'); return response.json(); })
            .then(shipments => { renderShipments(shipments); if (dashboardSync) dashboardSync.textContent = 'Live data'; })
            .catch(error => { shipmentList.innerHTML = `<div class="dashboard-state error"><i class="fas fa-triangle-exclamation"></i> ${error.message} Start the server to view live shipments.</div>`; if (dashboardSync) dashboardSync.textContent = 'Offline'; });
    }

    function renderQuotes(quotes) {
        if (!quoteList) return;
        quoteList.replaceChildren();
        if (quotes.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'dashboard-state';
            const icon = document.createElement('i');
            icon.className = 'fas fa-file-invoice';
            empty.append(icon, document.createTextNode(' No quote requests yet. '));
            const link = document.createElement('a');
            link.href = 'contact.html#quote-form';
            link.textContent = 'Request a quote.';
            empty.appendChild(link);
            quoteList.appendChild(empty);
            return;
        }
        quotes.forEach(quote => {
            const card = document.createElement('article');
            card.className = 'quote-card';
            const date = new Date(quote.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
            const content = document.createElement('div');
            const label = document.createElement('span');
            label.className = 'shipment-label';
            label.textContent = `REQUESTED ${date}`;
            const title = document.createElement('h3');
            title.textContent = quote.commodity_type || 'General freight';
            const details = document.createElement('p');
            details.textContent = quote.shipment_details || '';
            content.append(label, title, details);
            const status = document.createElement('span');
            status.className = `quote-status ${quote.status}`;
            status.textContent = quote.status;
            card.append(content, status);
            quoteList.appendChild(card);
        });
    }

    let quotesLoaded = false;
    let addressesLoaded = false;
    let editingAddressId = null;

    function renderAddresses(addresses) {
        if (!addressesGrid) return;
        addressesGrid.replaceChildren();
        if (addresses.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'dashboard-state';
            empty.textContent = 'No saved addresses yet. Add your first shipping destination above.';
            addressesGrid.appendChild(empty);
            return;
        }
        addresses.forEach(address => {
            const card = document.createElement('article');
            card.className = 'address-card';
            const heading = document.createElement('div');
            heading.className = 'address-card-heading';
            const title = document.createElement('h3');
            title.textContent = address.label;
            heading.appendChild(title);
            if (address.is_default) {
                const badge = document.createElement('span');
                badge.className = 'default-badge';
                badge.textContent = 'Default';
                heading.appendChild(badge);
            }
            const details = document.createElement('p');
            details.textContent = `${address.recipient_name}\n${address.line1}\n${address.city}, ${address.country}${address.postal_code ? ` ${address.postal_code}` : ''}${address.phone ? `\n${address.phone}` : ''}`;
            const actions = document.createElement('div');
            actions.className = 'address-actions';
            actions.innerHTML = `<button type="button" data-address-action="edit" data-address-id="${address.id}">Edit</button><button type="button" data-address-action="delete" data-address-id="${address.id}">Delete</button>${address.is_default ? '' : `<button type="button" data-address-action="default" data-address-id="${address.id}">Set default</button>`}`;
            card.append(heading, details, actions);
            addressesGrid.appendChild(card);
        });
    }

    let addressCache = [];
    function loadAddresses() {
        if (!addressesGrid || addressesLoaded) return;
        fetch(`${API_BASE}/addresses`, { credentials: 'include' })
            .then(response => { if (!response.ok) throw new Error('Unable to load addresses.'); return response.json(); })
            .then(data => { addressCache = data; renderAddresses(data); addressesLoaded = true; })
            .catch(error => { addressesGrid.innerHTML = `<div class="dashboard-state error">${error.message}</div>`; });
    }

    function resetAddressForm() {
        editingAddressId = null;
        addressForm?.reset();
        if (addressFormTitle) addressFormTitle.textContent = 'ADD AN ADDRESS';
        if (addressCancel) addressCancel.hidden = true;
        if (addressFormStatus) addressFormStatus.textContent = '';
    }

    addressCancel?.addEventListener('click', resetAddressForm);
    addressForm?.addEventListener('submit', async event => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(addressForm));
        payload.is_default = addressForm.elements.is_default.checked;
        const method = editingAddressId ? 'PUT' : 'POST';
        const endpoint = editingAddressId ? `/addresses/${editingAddressId}` : '/addresses';
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Unable to save address.');
            addressFormStatus.textContent = result.message;
            addressFormStatus.className = 'form-status success';
            addressCache = [];
            addressesLoaded = false;
            resetAddressForm();
            loadAddresses();
        } catch (error) {
            addressFormStatus.textContent = error.message;
            addressFormStatus.className = 'form-status error';
        }
    });

    addressesGrid?.addEventListener('click', async event => {
        const button = event.target.closest('[data-address-action]');
        if (!button) return;
        const id = Number(button.dataset.addressId);
        const address = addressCache.find(item => item.id === id);
        if (button.dataset.addressAction === 'edit' && address) {
            editingAddressId = id;
            Object.entries(address).forEach(([key, value]) => { if (addressForm.elements[key]) addressForm.elements[key].type === 'checkbox' ? addressForm.elements[key].checked = Boolean(value) : addressForm.elements[key].value = value || ''; });
            addressFormTitle.textContent = 'EDIT ADDRESS';
            addressCancel.hidden = false;
            addressForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (button.dataset.addressAction === 'delete' && confirm('Delete this saved address?')) {
            const response = await fetch(`${API_BASE}/addresses/${id}`, { method: 'DELETE', credentials: 'include' });
            if (response.ok) { addressCache = []; addressesLoaded = false; loadAddresses(); }
        }
        if (button.dataset.addressAction === 'default') {
            const response = await fetch(`${API_BASE}/addresses/${id}/default`, { method: 'POST', credentials: 'include' });
            if (response.ok) { addressCache = []; addressesLoaded = false; loadAddresses(); }
        }
    });

    function populateProfile(user) {
        if (!profileForm) return;
        Object.entries(user).forEach(([key, value]) => {
            if (profileForm.elements[key]) profileForm.elements[key].value = value || '';
        });
    }

    profileForm?.addEventListener('submit', async event => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(profileForm));
        try {
            const response = await fetch(`${API_BASE}/auth/profile`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Unable to update profile.');
            populateProfile(result.user);
            profileFormStatus.textContent = result.message;
            profileFormStatus.className = 'form-status success';
        } catch (error) {
            profileFormStatus.textContent = error.message;
            profileFormStatus.className = 'form-status error';
        }
    });

    passwordForm?.addEventListener('submit', async event => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(passwordForm));
        try {
            const response = await fetch(`${API_BASE}/auth/password`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Unable to update password.');
            passwordForm.reset();
            passwordFormStatus.textContent = result.message;
            passwordFormStatus.className = 'form-status success';
        } catch (error) {
            passwordFormStatus.textContent = error.message;
            passwordFormStatus.className = 'form-status error';
        }
    });

    function setPortalView(view) {
        const showQuotes = view === 'quotes';
        const showAddresses = view === 'addresses';
        const showSettings = view === 'settings';
        if (shipmentList) shipmentList.hidden = showQuotes || showAddresses || showSettings;
        if (quoteList) quoteList.hidden = !showQuotes;
        if (addressSection) addressSection.hidden = !showAddresses;
        if (settingsSection) settingsSection.hidden = !showSettings;
        const title = document.querySelector('.dashboard-panel .section-title-bar h2');
        if (title) title.textContent = showQuotes ? 'MY QUOTES' : showAddresses ? 'SAVED ADDRESSES' : showSettings ? 'ACCOUNT SETTINGS' : 'ACTIVE SHIPMENTS';
        if (showAddresses) loadAddresses();
    }

    document.querySelectorAll('.portal-view-link').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const view = link.dataset.portalView;
            document.querySelectorAll('.portal-view-link').forEach(item => item.classList.toggle('active', item === link));
            setPortalView(view);
            if (view === 'quotes' && !quotesLoaded) {
                fetch(`${API_BASE}/quotes`, { credentials: 'include' })
                    .then(response => { if (!response.ok) throw new Error('Unable to load quote requests.'); return response.json(); })
                    .then(data => { renderQuotes(data); quotesLoaded = true; })
                    .catch(error => { quoteList.innerHTML = `<div class="dashboard-state error">${error.message}</div>`; });
            }
        });
    });

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
            const response = await fetch(`${API_BASE}/quotes`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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