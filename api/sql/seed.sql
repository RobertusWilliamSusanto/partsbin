-- =============================================================================
-- PERINGATAN KERAS: SKRIP INI MENJALANKAN TRUNCATE!
-- Menjalankan file ini akan MENGHAPUS SELURUH DATA pada tabel project_items,
-- projects, dan components secara permanen lalu menggantinya dengan data contoh.
-- Jangan jalankan di database produksi jika sudah ada data penting milikmu.
-- =============================================================================

TRUNCATE TABLE project_items, projects, components RESTART IDENTITY CASCADE;

-- 1. Seed 6 komponen elektronika contoh (mencakup status stok cukup, menipis, dan habis)
INSERT INTO components (id, name, category, stock, min_stock, unit_price, bin_location, specs) VALUES
  (
    '11111111-1111-4111-8111-111111111101',
    'ESP32-WROOM-32 DevKit v1',
    'MCU',
    5,
    2,
    68000,
    'A-01',
    'Dual-core 240MHz, WiFi 2.4GHz + BLE, 30 Pin, 3.3V logic'
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'DHT22 Sensor Suhu & Kelembaban',
    'Sensor',
    3,
    2,
    42000,
    'B-03',
    'Tegangan 3.3V-5V, rentang -40 s.d. 80 C, antarmuka 1-Wire'
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'Resistor SMD 10k Ohm 1% 0805',
    'Passive',
    50,
    10,
    500,
    'C-12',
    '0.125W, thick film chip resistor, toleransi 1%'
  ),
  (
    '11111111-1111-4111-8111-111111111104',
    'AMS1117-3.3 Voltage Regulator',
    'Power',
    1,
    3,
    3500,
    'D-02',
    'Paket SOT-223, LDO 1A, output tetap 3.3V'
  ),
  (
    '11111111-1111-4111-8111-111111111105',
    'OLED SSD1306 0.96 inch I2C',
    'Display',
    2,
    2,
    38000,
    'E-01',
    'Resolusi 128x64 piksel, 3.3V-5V, alamat I2C 0x3C'
  ),
  (
    '11111111-1111-4111-8111-111111111106',
    'Servo Micro SG90 9g',
    'Actuator',
    0,
    2,
    22000,
    'F-04',
    'Tegangan 4.8V-6V, torsi 1.8 kg-cm, rotasi 180 derajat'
  );

-- 2. Seed 2 proyek contoh (1 proyek siap rakit 100%, 1 proyek dengan kekurangan stok)
INSERT INTO projects (id, name, description) VALUES
  (
    '22222222-2222-4222-8222-222222222201',
    'Monitoring Suhu Ruang Lab IoT',
    'Node pemantau suhu dan kelembaban laboratorium berbasis ESP32 dan sensor DHT22.'
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    'Smart Plant Watering & Display',
    'Sistem penyiram tanaman otomatis dengan tampilan OLED dan aktuator katup berbasis servo.'
  );

-- 3. Seed item BOM proyek
-- Proyek 1 (Siap Rakit 100%: 3/3 item tercukupi)
INSERT INTO project_items (project_id, component_id, quantity_needed) VALUES
  ('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111101', 1),
  ('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111102', 1),
  ('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111103', 4);

-- Proyek 2 (Readiness 50%: 2 item cukup, 2 item kurang -> masuk Shopping Deficit)
INSERT INTO project_items (project_id, component_id, quantity_needed) VALUES
  ('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111101', 1),
  ('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111104', 3),
  ('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111105', 1),
  ('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111106', 2);
