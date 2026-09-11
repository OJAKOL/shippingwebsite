-- ZAHAATI FREIGHTCARGO LTD - Database Schema (SQL)
-- Target: MySQL / PostgreSQL

CREATE DATABASE IF NOT EXISTS zahaati_db;
USE zahaati_db;

-- 1. User Management (Portal Access)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    company_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    token CHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (expires_at)
);

-- 2. Commodity Categories
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- Cars, Mechanics, Machinery, Electronics
    slug VARCHAR(50) UNIQUE NOT NULL -- URL friendly name
);

-- 3. Shipping Services / Catalog Items
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    price_indicator VARCHAR(50), -- e.g., 'Starting from $500'
    image_url VARCHAR(255),
    tag VARCHAR(50), -- e.g., 'TOP DEAL', 'SECURE'
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 4. Quotes / Inquiries (Lead Generation)
CREATE TABLE IF NOT EXISTS quotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL, -- Optional if guest
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    commodity_type VARCHAR(50),
    shipment_details TEXT,
    status ENUM('pending', 'responded', 'converted') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Shipment Tracking Data
CREATE TABLE IF NOT EXISTS shipments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tracking_number VARCHAR(20) UNIQUE NOT NULL, -- e.g., ZH123456
    user_id INT,
    description VARCHAR(255),
    current_status VARCHAR(100), -- e.g., 'At Departure Port'
    tracking_stage INT DEFAULT 1, -- 1: Booking, 2: Port, 3: Transit, 4: Delivered
    origin VARCHAR(100),
    destination VARCHAR(100),
    estimated_arrival DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Newsletter Subscriptions
CREATE TABLE IF NOT EXISTS newsletter_subs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Initial Categories
INSERT IGNORE INTO categories (name, slug) VALUES
('Cars & Vehicles', 'vehicles'),
('Mechanics & Parts', 'mechanics'),
('Heavy Machinery', 'machinery'),
('Electronics', 'electronics');

-- Demo catalog records for local development and search testing
INSERT INTO services (category_id, title, description, price_indicator, image_url, tag)
SELECT c.id, 'Luxury Sedan Enclosed Container (FCL)', 'White-glove vehicle shipping with secure enclosed handling.', 'Request a quote', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80', 'SECURE LOAD'
FROM categories c WHERE c.slug = 'vehicles'
    AND NOT EXISTS (SELECT 1 FROM services WHERE title = 'Luxury Sedan Enclosed Container (FCL)');

INSERT INTO services (category_id, title, description, price_indicator, image_url, tag)
SELECT c.id, 'Industrial Grade Crated Engine Freight', 'Protected freight handling for engines, gearboxes, and critical spares.', 'Request a quote', 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=400&q=80', 'CRITICAL'
FROM categories c WHERE c.slug = 'mechanics'
    AND NOT EXISTS (SELECT 1 FROM services WHERE title = 'Industrial Grade Crated Engine Freight');

INSERT INTO services (category_id, title, description, price_indicator, image_url, tag)
SELECT c.id, 'Oversize Construction Machinery (Flat-Rack)', 'Out-of-gauge planning and flat-rack transport for heavy equipment.', 'Request a quote', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80', 'OUT-OF-GAUGE'
FROM categories c WHERE c.slug = 'machinery'
    AND NOT EXISTS (SELECT 1 FROM services WHERE title = 'Oversize Construction Machinery (Flat-Rack)');

INSERT INTO services (category_id, title, description, price_indicator, image_url, tag)
SELECT c.id, 'Sensitive IT & Medical Tech Logistics', 'Climate-conscious logistics for sensitive electronics and medical equipment.', 'Request a quote', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80', 'PRECISION'
FROM categories c WHERE c.slug = 'electronics'
    AND NOT EXISTS (SELECT 1 FROM services WHERE title = 'Sensitive IT & Medical Tech Logistics');

-- Demo shipments for the portal and tracking modal
INSERT IGNORE INTO shipments (tracking_number, description, current_status, tracking_stage, origin, destination, estimated_arrival)
VALUES
('ZH99887766', 'Luxury vehicle shipment', 'In transit', 3, 'Shanghai, China', 'Mombasa, Kenya', '2026-10-14'),
('ZH22114455', 'Toyota Land Cruiser V8', 'Delivered', 4, 'Dubai, UAE', 'Lagos, Nigeria', '2026-01-12');
