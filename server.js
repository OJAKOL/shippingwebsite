const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production' && (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME || !process.env.FRONTEND_ORIGIN)) {
    throw new Error('Production requires DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, and FRONTEND_ORIGIN.');
}

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });
const writeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false });

// Middleware
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || false, credentials: true }));
app.use(bodyParser.json({ limit: '50kb' }));
app.use(express.static('./')); // Serve static frontend files

function sendValidationError(res, message) {
    return res.status(400).json({ error: message });
}

const sessionCookie = 'zahaati_session';

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}

function verifyPassword(password, storedHash) {
    const [salt, storedKey] = String(storedHash || '').split(':');
    if (!salt || !storedKey) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const savedKey = Buffer.from(storedKey, 'hex');
    return savedKey.length === derivedKey.length && crypto.timingSafeEqual(savedKey, derivedKey);
}

function getCookies(req) {
    return Object.fromEntries(String(req.headers.cookie || '').split(';').filter(Boolean).map(cookie => {
        const separator = cookie.indexOf('=');
        return [cookie.slice(0, separator).trim(), decodeURIComponent(cookie.slice(separator + 1).trim())];
    }));
}

function setSessionCookie(res, token) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `${sessionCookie}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${secure}`);
}

function clearSessionCookie(res) {
    res.setHeader('Set-Cookie', `${sessionCookie}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

function requireAuth(req, res, next) {
    const token = getCookies(req)[sessionCookie];
    if (!token) return res.status(401).json({ error: 'Authentication required.' });
    db.query(`SELECT u.id, u.full_name, u.email, u.company_name, u.phone
              FROM sessions s JOIN users u ON u.id = s.user_id
              WHERE s.token = ? AND s.expires_at > NOW()`, [token], (err, results) => {
        if (err) return res.status(500).json({ error: 'Authentication service unavailable.' });
        if (results.length === 0) return res.status(401).json({ error: 'Session expired. Please sign in again.' });
        req.user = results[0];
        next();
    });
}

function optionalAuth(req, res, next) {
    const token = getCookies(req)[sessionCookie];
    if (!token) return next();
    db.query(`SELECT u.id, u.full_name, u.email, u.company_name, u.phone
              FROM sessions s JOIN users u ON u.id = s.user_id
              WHERE s.token = ? AND s.expires_at > NOW()`, [token], (err, results) => {
        if (!err && results.length > 0) req.user = results[0];
        next();
    });
}

// Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zahaati_db'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database.');
});

// API Routes

// 1. Authentication
app.post('/api/auth/signup', authLimiter, (req, res) => {
    const fullName = String(req.body.full_name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const companyName = String(req.body.company_name || '').trim() || null;
    if (fullName.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
        return sendValidationError(res, 'Enter a name, valid email, and password of at least 8 characters.');
    }

    db.query('INSERT INTO users (full_name, email, password_hash, company_name) VALUES (?, ?, ?, ?)', [fullName, email, hashPassword(password), companyName], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'An account with that email already exists.' });
            return res.status(500).json({ error: 'Unable to create account.' });
        }
        createSession(result.insertId, res, () => res.status(201).json({ message: 'Account created.' }));
    });
});

app.post('/api/auth/login', authLimiter, (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    db.query('SELECT id, full_name, email, password_hash, company_name FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Authentication service unavailable.' });
        if (results.length === 0 || !verifyPassword(password, results[0].password_hash)) {
            return res.status(401).json({ error: 'Email or password is incorrect.' });
        }
        createSession(results[0].id, res, () => res.json({ user: publicUser(results[0]) }));
    });
});

app.post('/api/auth/logout', authLimiter, (req, res) => {
    const token = getCookies(req)[sessionCookie];
    if (!token) return res.json({ message: 'Signed out.' });
    db.query('DELETE FROM sessions WHERE token = ?', [token], () => {
        clearSessionCookie(res);
        res.json({ message: 'Signed out.' });
    });
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: req.user }));

app.put('/api/auth/profile', requireAuth, (req, res) => {
    const fullName = String(req.body.full_name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const companyName = String(req.body.company_name || '').trim() || null;
    const phone = String(req.body.phone || '').trim() || null;
    if (fullName.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) {
        return sendValidationError(res, 'Enter a valid name and email address.');
    }
    db.query('UPDATE users SET full_name = ?, email = ?, company_name = ?, phone = ? WHERE id = ?', [fullName, email, companyName, phone, req.user.id], (err) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That email address is already in use.' });
            return res.status(500).json({ error: 'Unable to update profile.' });
        }
        res.json({ message: 'Profile updated.', user: { id: req.user.id, full_name: fullName, email, company_name: companyName, phone } });
    });
});

app.put('/api/auth/password', requireAuth, (req, res) => {
    const currentPassword = String(req.body.current_password || '');
    const newPassword = String(req.body.new_password || '');
    if (newPassword.length < 8) return sendValidationError(res, 'New password must be at least 8 characters.');
    db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id], (err, results) => {
        if (err || results.length === 0) return res.status(500).json({ error: 'Unable to update password.' });
        if (!verifyPassword(currentPassword, results[0].password_hash)) return res.status(401).json({ error: 'Current password is incorrect.' });
        db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(newPassword), req.user.id], (updateError) => {
            if (updateError) return res.status(500).json({ error: 'Unable to update password.' });
            res.json({ message: 'Password updated.' });
        });
    });
});

function publicUser(user) {
    return { id: user.id, full_name: user.full_name, email: user.email, company_name: user.company_name, phone: user.phone };
}

function createSession(userId, res, callback) {
    const token = crypto.randomBytes(32).toString('hex');
    db.query('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))', [token, userId], (err) => {
        if (err) return res.status(500).json({ error: 'Unable to start session.' });
        setSessionCookie(res, token);
        callback();
    });
}

// 2. Search Services
app.get('/api/services', (req, res) => {
    const query = String(req.query.q || '').trim();
    if (query.length < 2) return res.json([]);

    const sql = `
        SELECT s.*, c.name as category_name
        FROM services s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.title LIKE ? OR s.description LIKE ? OR c.name LIKE ?
        ORDER BY s.title ASC
        LIMIT 8
    `;
    const term = `%${query}%`;
    db.query(sql, [term, term, term], (err, results) => {
        if (err) return res.status(500).json({ error: 'Unable to search services.' });
        res.json(results);
    });
});

// 3. Portal shipments
app.get('/api/shipments', requireAuth, (req, res) => {
    const userId = req.user.id;
    const hasUserFilter = Number.isInteger(userId) && userId > 0;
    const sql = `
        SELECT id, tracking_number, description, current_status, tracking_stage,
               origin, destination, estimated_arrival, updated_at
        FROM shipments
        ${hasUserFilter ? 'WHERE user_id = ?' : ''}
        ORDER BY updated_at DESC
    `;

    db.query(sql, hasUserFilter ? [userId] : [], (err, results) => {
        if (err) return res.status(500).json({ error: 'Unable to load shipments.' });
        res.json(results);
    });
});

// 4. Track Shipment
app.get('/api/track/:number', (req, res) => {
    const trackingNumber = String(req.params.number || '').trim().toUpperCase();
    if (!trackingNumber) return sendValidationError(res, 'Tracking number is required.');
    const sql = 'SELECT * FROM shipments WHERE tracking_number = ?';
    db.query(sql, [trackingNumber], (err, results) => {
        if (err) return res.status(500).json({ error: 'Unable to retrieve tracking information.' });
        if (results.length === 0) return res.status(404).json({ message: 'Tracking number not found.' });
        res.json(results[0]);
    });
});

// 5. Submit Quote Request
app.post('/api/quotes', writeLimiter, optionalAuth, (req, res) => {
    const { full_name, email, commodity_type, shipment_details } = req.body;
    if (!full_name || !email || !shipment_details) {
        return sendValidationError(res, 'Name, email, and shipment details are required.');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return sendValidationError(res, 'Enter a valid email address.');
    }
    const sql = 'INSERT INTO quotes (user_id, full_name, email, commodity_type, shipment_details) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [req.user?.id || null, full_name, email, commodity_type, shipment_details], (err, result) => {
        if (err) return res.status(500).json({ error: 'Unable to save quote request.' });
        res.status(201).json({ message: 'Quote request received.', id: result.insertId });
    });
});

// 6. Authenticated user's quote requests
app.get('/api/quotes', requireAuth, (req, res) => {
    const sql = `SELECT id, commodity_type, shipment_details, status, created_at
                 FROM quotes WHERE user_id = ? ORDER BY created_at DESC`;
    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Unable to load quote requests.' });
        res.json(results);
    });
});

// 7. Authenticated user's shipping addresses
app.get('/api/addresses', requireAuth, (req, res) => {
    db.query(`SELECT id, label, recipient_name, line1, city, country, postal_code, phone, is_default
              FROM addresses WHERE user_id = ? ORDER BY is_default DESC, label ASC`, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Unable to load addresses.' });
        res.json(results);
    });
});

app.post('/api/addresses', requireAuth, (req, res) => {
    const address = normalizeAddress(req.body);
    if (!address.label || !address.recipient_name || !address.line1 || !address.city || !address.country) {
        return sendValidationError(res, 'Label, recipient, address, city, and country are required.');
    }
    saveAddress(req.user.id, address, res, (id) => res.status(201).json({ id, message: 'Address saved.' }));
});

app.put('/api/addresses/:id', requireAuth, (req, res) => {
    const addressId = Number.parseInt(req.params.id, 10);
    const address = normalizeAddress(req.body);
    if (!Number.isInteger(addressId) || addressId < 1) return sendValidationError(res, 'Invalid address.');
    if (!address.label || !address.recipient_name || !address.line1 || !address.city || !address.country) {
        return sendValidationError(res, 'Label, recipient, address, city, and country are required.');
    }
    db.query(`UPDATE addresses SET label = ?, recipient_name = ?, line1 = ?, city = ?, country = ?, postal_code = ?, phone = ?
              WHERE id = ? AND user_id = ?`, [address.label, address.recipient_name, address.line1, address.city, address.country, address.postal_code, address.phone, addressId, req.user.id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Unable to update address.' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Address not found.' });
        if (address.is_default) setDefaultAddress(req.user.id, addressId, res, () => res.json({ message: 'Address updated.' }));
        else res.json({ message: 'Address updated.' });
    });
});

app.delete('/api/addresses/:id', requireAuth, (req, res) => {
    const addressId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(addressId) || addressId < 1) return sendValidationError(res, 'Invalid address.');
    db.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [addressId, req.user.id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Unable to delete address.' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Address not found.' });
        res.json({ message: 'Address deleted.' });
    });
});

app.post('/api/addresses/:id/default', requireAuth, (req, res) => {
    const addressId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(addressId) || addressId < 1) return sendValidationError(res, 'Invalid address.');
    setDefaultAddress(req.user.id, addressId, res, () => res.json({ message: 'Default address updated.' }));
});

function normalizeAddress(body) {
    return {
        label: String(body.label || '').trim(),
        recipient_name: String(body.recipient_name || '').trim(),
        line1: String(body.line1 || '').trim(),
        city: String(body.city || '').trim(),
        country: String(body.country || '').trim(),
        postal_code: String(body.postal_code || '').trim() || null,
        phone: String(body.phone || '').trim() || null,
        is_default: Boolean(body.is_default)
    };
}

function saveAddress(userId, address, res, callback) {
    db.query('INSERT INTO addresses (user_id, label, recipient_name, line1, city, country, postal_code, phone, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [userId, address.label, address.recipient_name, address.line1, address.city, address.country, address.postal_code, address.phone, address.is_default], (err, result) => {
        if (err) return res.status(500).json({ error: 'Unable to save address.' });
        if (address.is_default) setDefaultAddress(userId, result.insertId, res, () => callback(result.insertId));
        else callback(result.insertId);
    });
}

function setDefaultAddress(userId, addressId, res, callback) {
    db.query('UPDATE addresses SET is_default = (id = ?) WHERE user_id = ?', [addressId, userId], (err) => {
        if (err) return res.status(500).json({ error: 'Unable to set default address.' });
        callback();
    });
}

// 8. Newsletter Subscription
app.post('/api/subscribe', writeLimiter, (req, res) => {
    const email = String(req.body.email || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return sendValidationError(res, 'Enter a valid email address.');
    }
    const sql = 'INSERT INTO newsletter_subs (email) VALUES (?)';
    db.query(sql, [email], (err, result) => {
        if (err) return res.status(500).json({ error: 'Unable to save subscription.' });
        res.status(201).json({ message: 'Subscribed successfully.' });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
