const CATEGORIES = ['MCU', 'Sensor', 'Passive', 'Power', 'Actuator', 'Connector', 'Display'];

// Subkomponen sekumpulan input field form data komponen inventaris
export default function ComponentFormFields({ form, onChange }) {
  return (
    <>
      <div className="form-group">
        <label className="form-label" htmlFor="comp-name">
          Nama Komponen
        </label>
        <input
          id="comp-name"
          type="text"
          className="form-input"
          value={form.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Contoh: ESP32-WROOM-32D"
          required
        />
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="comp-category">
            Kategori
          </label>
          <select
            id="comp-category"
            className="form-select"
            value={form.category}
            onChange={(e) => onChange('category', e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="comp-bin">
            Lokasi Laci (Bin)
          </label>
          <input
            id="comp-bin"
            type="text"
            className="form-input"
            value={form.bin_location}
            onChange={(e) => onChange('bin_location', e.target.value)}
            placeholder="Contoh: A-01, B-12"
            required
          />
        </div>
      </div>

      <div className="form-grid-3">
        <div className="form-group">
          <label className="form-label" htmlFor="comp-stock">
            Stok Tersedia
          </label>
          <input
            id="comp-stock"
            type="number"
            min="0"
            step="1"
            className="form-input num"
            value={form.stock}
            onChange={(e) => onChange('stock', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="comp-min-stock">
            Stok Minimum
          </label>
          <input
            id="comp-min-stock"
            type="number"
            min="0"
            step="1"
            className="form-input num"
            value={form.min_stock}
            onChange={(e) => onChange('min_stock', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="comp-price">
            Harga Satuan (Rp)
          </label>
          <input
            id="comp-price"
            type="number"
            min="0"
            step="1"
            className="form-input num"
            value={form.unit_price}
            onChange={(e) => onChange('unit_price', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="comp-specs">
          Spesifikasi Teknis
        </label>
        <textarea
          id="comp-specs"
          className="form-textarea"
          value={form.specs}
          onChange={(e) => onChange('specs', e.target.value)}
          placeholder="Tegangan kerja, paket SMD/THT, catatan pinout..."
        />
      </div>
    </>
  );
}
