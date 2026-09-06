const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('./')); // Serve static frontend files

function sendValidationError(res, message) {
    return res.status(400).json({ error: message });
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

// 1. Search Services
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
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. Portal shipments
app.get('/api/shipments', (req, res) => {
    const userId = Number.parseInt(req.query.user_id, 10);
    const hasUserFilter = Number.isInteger(userId) && userId > 0;
    const sql = `
        SELECT id, tracking_number, description, current_status, tracking_stage,
               origin, destination, estimated_arrival, updated_at
        FROM shipments
        ${hasUserFilter ? 'WHERE user_id = ?' : ''}
        ORDER BY updated_at DESC
    `;

    db.query(sql, hasUserFilter ? [userId] : [], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 3. Track Shipment
app.get('/api/track/:number', (req, res) => {
    const trackingNumber = String(req.params.number || '').trim().toUpperCase();
    if (!trackingNumber) return sendValidationError(res, 'Tracking number is required.');
    const sql = 'SELECT * FROM shipments WHERE tracking_number = ?';
    db.query(sql, [trackingNumber], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Tracking number not found.' });
        res.json(results[0]);
    });
});

// 4. Submit Quote Request
app.post('/api/quotes', (req, res) => {
    const { full_name, email, commodity_type, shipment_details } = req.body;
    if (!full_name || !email || !shipment_details) {
        return sendValidationError(res, 'Name, email, and shipment details are required.');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return sendValidationError(res, 'Enter a valid email address.');
    }
    const sql = 'INSERT INTO quotes (full_name, email, commodity_type, shipment_details) VALUES (?, ?, ?, ?)';
    db.query(sql, [full_name, email, commodity_type, shipment_details], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Quote request received.', id: result.insertId });
    });
});

// 5. Newsletter Subscription
app.post('/api/subscribe', (req, res) => {
    const email = String(req.body.email || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return sendValidationError(res, 'Enter a valid email address.');
    }
    const sql = 'INSERT INTO newsletter_subs (email) VALUES (?)';
    db.query(sql, [email], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Subscribed successfully.' });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
