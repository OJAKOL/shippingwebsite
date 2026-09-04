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
    const query = req.query.q || '';
    const sql = `
        SELECT s.*, c.name as category_name
        FROM services s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.title LIKE ? OR c.name LIKE ?
    `;
    db.query(sql, [`%${query}%`, `%${query}%`], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. Track Shipment
app.get('/api/track/:number', (req, res) => {
    const trackingNumber = req.params.number;
    const sql = 'SELECT * FROM shipments WHERE tracking_number = ?';
    db.query(sql, [trackingNumber], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Tracking number not found.' });
        res.json(results[0]);
    });
});

// 3. Submit Quote Request
app.post('/api/quotes', (req, res) => {
    const { full_name, email, commodity_type, shipment_details } = req.body;
    const sql = 'INSERT INTO quotes (full_name, email, commodity_type, shipment_details) VALUES (?, ?, ?, ?)';
    db.query(sql, [full_name, email, commodity_type, shipment_details], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Quote request received.', id: result.insertId });
    });
});

// 4. Newsletter Subscription
app.post('/api/subscribe', (req, res) => {
    const { email } = req.body;
    const sql = 'INSERT INTO newsletter_subs (email) VALUES (?)';
    db.query(sql, [email], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Subscribed successfully.' });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
