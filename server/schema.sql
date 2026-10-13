-- NyumbaHub schema + sample data
-- Run from the server/ folder:  mysql -u root -p -e "source schema.sql"
-- Safe to re-run: it drops and recreates the tables, resetting the sample data.
-- Works on MySQL 8 and MariaDB.

CREATE DATABASE IF NOT EXISTS students_db
  CHARACTER SET utf8mb4;

USE students_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS landlords;
DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS students;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------
-- listings
-- ---------------------------------------------------------------
CREATE TABLE listings (
  id              INT NOT NULL AUTO_INCREMENT,
  status          VARCHAR(20) NOT NULL,          -- e.g. available, rented
  previous_status VARCHAR(20) DEFAULT NULL,      -- 'rented' => reported as "vacated"
  area            VARCHAR(100) DEFAULT NULL,
  city            VARCHAR(100) DEFAULT NULL,
  bedrooms        INT DEFAULT NULL,
  bathrooms       INT DEFAULT NULL,
  updated_at      DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_listings_status_updated (status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------
CREATE TABLE bookings (
  id              INT NOT NULL AUTO_INCREMENT,
  listing_id      INT NOT NULL,
  status          VARCHAR(20) NOT NULL,          -- e.g. confirmed, refunded
  reason_category VARCHAR(30) DEFAULT NULL,      -- refund reason; NULL => reported as "other"
  escrow_status   VARCHAR(20) DEFAULT NULL,      -- e.g. held, released
  updated_at      DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_bookings_status_updated (status, updated_at),
  KEY listing_id (listing_id),
  CONSTRAINT bookings_ibfk_1 FOREIGN KEY (listing_id) REFERENCES listings (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------
-- landlords
-- ---------------------------------------------------------------
CREATE TABLE landlords (
  id         INT NOT NULL AUTO_INCREMENT,
  listing_id INT NOT NULL,
  name       VARCHAR(100) DEFAULT NULL,
  phone      VARCHAR(20) DEFAULT NULL,
  email      VARCHAR(100) DEFAULT NULL,
  opted_in   TINYINT(1) DEFAULT 0,               -- contact shared only when 1
  PRIMARY KEY (id),
  KEY listing_id (listing_id),
  CONSTRAINT landlords_ibfk_1 FOREIGN KEY (listing_id) REFERENCES listings (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------
-- students
-- ---------------------------------------------------------------
CREATE TABLE students (
  id     INT NOT NULL AUTO_INCREMENT,
  name   VARCHAR(100) DEFAULT NULL,
  email  VARCHAR(100) DEFAULT NULL,
  course VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=10;

-- ---------------------------------------------------------------
-- Sample data (the README examples are built from these rows)
-- ---------------------------------------------------------------
INSERT INTO listings (id, status, previous_status, area, city, bedrooms, bathrooms, updated_at) VALUES
  (1, 'available', 'rented', 'Kilimani',  'Nairobi', 2, 1, '2026-09-21 22:54:06'),
  (2, 'available', NULL,     'Westlands', 'Nairobi', 3, 2, '2026-09-21 22:54:06'),
  (3, 'rented',    NULL,     'Lavington', 'Nairobi', 1, 1, '2026-08-01 10:00:00');

INSERT INTO bookings (id, listing_id, status, reason_category, escrow_status, updated_at) VALUES
  (1, 3, 'refunded',  'property_mismatch', 'released', '2026-09-21 22:54:07'),
  (2, 1, 'confirmed', NULL,                'held',     '2026-09-21 22:54:07');

INSERT INTO landlords (id, listing_id, name, phone, email, opted_in) VALUES
  (1, 1, 'Jane Wanjiru', '0722000001', 'jane@example.com',  1),
  (2, 2, 'Peter Otieno', '0733000002', 'peter@example.com', 0),
  (3, 3, 'Grace Mumbi',  '0711000003', 'grace@example.com', 1);

INSERT INTO students (id, name, email, course) VALUES
  (1, 'David Kariuki',  'david.kariuki@strathmore.edu',  'Business Information Technology'),
  (2, 'Faith Mumbi',    'faith.mumbi@strathmore.edu',    'Computer Science'),
  (3, 'Brian Ochieng',  'brian.ochieng@strathmore.edu',  'Software Engineering'),
  (4, 'Mercy Achieng',  'mercy.achieng@strathmore.edu',  'Information Technology'),
  (5, 'Kevin Mwangi',   'kevin.mwangi@strathmore.edu',   'Actuarial Science'),
  (6, 'Sarah Nekesa',   'sarah.nekesa@strathmore.edu',   'Business Information Technology'),
  (7, 'Peter Kamau',    'peter.kamau@strathmore.edu',    'Computer Science'),
  (8, 'Linda Chebet',   'linda.chebet@strathmore.edu',   'Software Engineering');
