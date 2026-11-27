import { useState } from 'react';
import { getAvailableCategories, saveCustomCategory } from '../utils/categories';

const ADD_NEW_VALUE = '__ADD_NEW_CATEGORY__';

// Subkomponen sekumpulan input field form data komponen inventaris
export default function ComponentFormFields({ form, onChange, categories: propCategories }) {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customAdded, setCustomAdded] = useState([]);

  const categoryOptions = getAvailableCategories(
    [],
    [...(propCategories || []), ...customAdded, form.category]
  );

  const handleSelectChange = (value) => {
    if (value === ADD_NEW_VALUE) {
      setIsAddingCategory(true);
      setNewCategoryName('');
      return;
    }
    onChange('category', value);
  };

  const handleConfirmNewCategory = () => {
    const saved = saveCustomCategory(newCategoryName);
    if (!saved) return;
    setCustomAdded((prev) => (prev.includes(saved) ? prev : [...prev, saved]));
    onChange('category', saved);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

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
          {isAddingCategory ? (
            <div className="stack-sm">
              <input
                id="comp-category"
                type="text"
                className="form-input"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleConfirmNewCategory();
                  } else if (e.key === 'Escape') {
                    setIsAddingCategory(false);
                    setNewCategoryName('');
                  }
                }}
                placeholder="Nama kategori baru (mis. RF)"
                maxLength={50}
                autoFocus
              />
              <div className="row-wrap">
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={handleConfirmNewCategory}
                  disabled={!newCategoryName.trim()}
                >
                  Pakai Kategori
                </button>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategoryName('');
                  }}
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <select
              id="comp-category"
              className="form-select"
              value={form.category}
              onChange={(e) => handleSelectChange(e.target.value)}
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={ADD_NEW_VALUE}>+ Tambah Kategori Baru...</option>
            </select>
          )}
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
