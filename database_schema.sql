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
INSERT INTO categories (name, slug) VALUES
('Cars & Vehicles', 'vehicles'),
('Mechanics & Parts', 'mechanics'),
('Heavy Machinery', 'machinery'),
('Electronics', 'electronics');
