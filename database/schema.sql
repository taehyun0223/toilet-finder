-- Toilet Finder Database Schema
-- PostgreSQL Database for storing toilet information

-- Create database (run this separately)
-- CREATE DATABASE toilet_finder;

-- Connect to the database and run the following:

-- Enable PostGIS extension for geographic functions (optional, but recommended)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Create enum for toilet types
CREATE TYPE toilet_type_enum AS ENUM ('PUBLIC', 'PRIVATE', 'COMMERCIAL');

-- Create toilets table
CREATE TABLE toilets (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT NOT NULL,
    type toilet_type_enum NOT NULL DEFAULT 'PUBLIC',
    accessibility BOOLEAN NOT NULL DEFAULT false,
    operating_hours VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_toilets_location ON toilets (latitude, longitude);
CREATE INDEX idx_toilets_type ON toilets (type);
CREATE INDEX idx_toilets_accessibility ON toilets (accessibility);
CREATE INDEX idx_toilets_created_at ON toilets (created_at);

-- Create a spatial index if PostGIS is available
-- CREATE INDEX idx_toilets_geom ON toilets USING GIST(ST_Point(longitude, latitude));

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on row updates
CREATE TRIGGER update_toilets_updated_at
    BEFORE UPDATE ON toilets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO toilets (id, name, latitude, longitude, address, type, accessibility, operating_hours) VALUES
('sample_1', '시청역 공공화장실', 37.5641, 126.9769, '서울특별시 중구 세종대로 110', 'PUBLIC', true, '24시간'),
('sample_2', '명동역 화장실', 37.5636, 126.9827, '서울특별시 중구 명동2가 25-36', 'PUBLIC', false, '05:30-24:00'),
('sample_3', '롯데백화점 화장실', 37.5651, 126.9815, '서울특별시 중구 남대문로 81', 'COMMERCIAL', true, '10:30-20:00'),
('sample_4', '남산타워 화장실', 37.5512, 126.9882, '서울특별시 용산구 남산공원길 105', 'PUBLIC', true, '09:00-23:00'),
('sample_5', '동대문디자인플라자 화장실', 37.5676, 127.0095, '서울특별시 중구 을지로 281', 'PUBLIC', true, '24시간');

-- Create a view for toilets with distance calculation (example usage)
-- This view can be used for finding nearby toilets
CREATE OR REPLACE VIEW toilets_with_sample_distance AS
SELECT 
    *,
    (
        6371000 * acos(
            cos(radians(37.5665)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(126.9780)) +
            sin(radians(37.5665)) * sin(radians(latitude))
        )
    ) as distance_from_city_hall
FROM toilets
ORDER BY distance_from_city_hall; 