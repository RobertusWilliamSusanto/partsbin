import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  Plus,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FolderKanban,
  PackagePlus,
} from 'lucide-react';
import { useComponents, invalidateComponentsCache } from '../hooks/useComponents';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { invalidateProjectsCache } from '../hooks/useProjects';
import projectService from '../services/projectService';
import { formatRupiah } from '../utils/format';

function getReadinessFillClass(percent, totalItems) {
  if (totalItems === 0 || percent < 50) return 'readiness-fill--warn';
  if (percent === 100) return 'readiness-fill--ok';
  return 'readiness-fill--accent';
}

export default function ProjectCreatePage() {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const { components } = useComponents();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bomItems, setBomItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const selectedComponentIds = useMemo(
    () => new Set(bomItems.map((item) => item.component_id).filter(Boolean)),
    [bomItems]
  );

  const handleAddBomRow = () => {
    const nextAvailable = components.find((c) => !selectedComponentIds.has(c.id));
    setBomItems((prev) => [
      ...prev,
      {
        tempId: `${Date.now()}-${Math.random()}`,
        component_id: nextAvailable ? nextAvailable.id : '',
        quantity_needed: 1,
      },
    ]);
  };

  const handleUpdateBomRow = (tempId, field, value) => {
    setBomItems((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveBomRow = (tempId) => {
    setBomItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  // Live preview kesiapan rakit, total biaya BOM, dan estimasi biaya kekurangan sebelum disimpan
  const preview = useMemo(() => {
    let totalItems = 0;
    let readyCount = 0;
    let totalCost = 0;
    let missingCost = 0;

    for (const row of bomItems) {
      const comp = components.find((c) => c.id === row.component_id);
      const qty = Math.max(0, Number(row.quantity_needed) || 0);
      if (!comp || qty <= 0) continue;

      totalItems += 1;
      const shortage = Math.max(0, qty - comp.stock);
      if (shortage === 0) readyCount += 1;
      totalCost += qty * comp.unit_price;
      missingCost += shortage * comp.unit_price;
    }

    const readinessPercent =
      totalItems === 0 ? 0 : Math.round((readyCount / totalItems) * 100);

    return { totalItems, readyCount, readinessPercent, totalCost, missingCost };
  }, [bomItems, components]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Nama proyek wajib diisi.');
      return;
    }

    for (const item of bomItems) {
      if (!item.component_id) {
        setError('Setiap baris BOM wajib memilih komponen.');
        return;
      }
      const qty = Number(item.quantity_needed);
      if (!Number.isInteger(qty) || qty <= 0) {
        setError('Jumlah kebutuhan komponen pada BOM wajib bilangan bulat > 0.');
        return;
      }
    }

    const compIds = bomItems.map((i) => i.component_id);
    if (new Set(compIds).size !== compIds.length) {
      setError('Terdapat komponen duplikat di dalam daftar BOM.');
      return;
    }

    setSubmitting(true);
    let createdProjectId = null;
    try {
      // 1. Buat proyek baru via POST /api/projects
      const projRes = await projectService.create({
        name: trimmedName,
        description: description.trim(),
      });
      createdProjectId = projRes.data.id;

      // 2. Tambahkan seluruh item BOM secara paralel via Promise.allSettled (aman terhadap error parsial)
      let failedCount = 0;
      if (bomItems.length > 0) {
        const results = await Promise.allSettled(
          bomItems.map((item) =>
            projectService.addItem(createdProjectId, {
              component_id: item.component_id,
              quantity_needed: Number(item.quantity_needed),
            })
          )
        );
        failedCount = results.filter((r) => r.status === 'rejected').length;
      }

      invalidateProjectsCache();
      invalidateComponentsCache();

      if (failedCount > 0) {
        navigate(`/projects/${createdProjectId}`, {
          replace: true,
          state: {
            warning: `Proyek tersimpan, tetapi ${failedCount} item BOM gagal ditambahkan. Anda dapat menambahkannya ulang di bawah.`,
          },
        });
      } else {
        navigate(`/projects/${createdProjectId}`, { replace: true });
      }
    } catch (err) {
      setError(err?.message || 'Gagal membuat proyek baru.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page stack-md">
      <div className="masthead">
        <h1 className="display">Buat Proyek Baru</h1>
        <p className="lede">
          Isi detail proyek dan susun daftar komponen BOM sekaligus dalam satu halaman.
        </p>
      </div>

      {error && (
        <div className="alert alert--danger" role="alert">
          <AlertCircle size={20} strokeWidth={1.75} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form className="detail-layout" onSubmit={handleSubmit}>
        <div className="stack-md">
          {/* Seksi 1: Data Dasar Proyek */}
          <div className="card stack-md">
            <div className="row-wrap">
              <FolderKanban size={20} strokeWidth={1.75} aria-hidden="true" />
              <h2 className="card-title">Informasi Proyek</h2>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-proj-name">Nama Proyek</label>
              <input
                id="new-proj-name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Smart Hydroponics Nutrient Controller"
                maxLength={120}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-proj-desc">Deskripsi Proyek</label>
              <textarea
                id="new-proj-desc"
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tujuan rangkaian, target mikrokontroler, atau catatan perakitan..."
              />
            </div>
          </div>

          {/* Seksi 2: Penyusunan BOM Sekaligus */}
          <div className="card stack-md">
            <div className="row-between">
              <div className="row-wrap">
                <PackagePlus size={20} strokeWidth={1.75} aria-hidden="true" />
                <h2 className="card-title">Komponen BOM Awal</h2>
              </div>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={handleAddBomRow}
                disabled={submitting || !isOnline || selectedComponentIds.size >= components.length}
              >
                <Plus size={20} strokeWidth={1.75} aria-hidden="true" />
                <span>Tambah Item</span>
              </button>
            </div>

            {bomItems.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 12px' }}>
                <p>Opsional: tambahkan komponen langsung agar kesiapan rakit langsung terhitung.</p>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={handleAddBomRow}
                  disabled={!isOnline || components.length === 0}
                >
                  <Plus size={20} strokeWidth={1.75} aria-hidden="true" />
                  <span>Pilih Komponen Pertama</span>
                </button>
              </div>
            ) : (
              <div className="stack-sm">
                {bomItems.map((item, index) => {
                  const selectedComp = components.find((c) => c.id === item.component_id);
                  const qty = Number(item.quantity_needed) || 0;
                  const shortage = selectedComp ? Math.max(0, qty - selectedComp.stock) : 0;

                  return (
                    <div key={item.tempId} className="bom-builder-card">
                      <div className="bom-builder-row">
                        <div className="bom-builder-row__select">
                          <select
                            className="form-select"
                            value={item.component_id}
                            onChange={(e) =>
                              handleUpdateBomRow(item.tempId, 'component_id', e.target.value)
                            }
                            required
                            aria-label={`Pilih komponen baris ${index + 1}`}
                          >
                            <option value="">-- Pilih komponen dari katalog --</option>
                            {components.map((comp) => {
                              const isTaken =
                                comp.id !== item.component_id && selectedComponentIds.has(comp.id);
                              return (
                                <option key={comp.id} value={comp.id} disabled={isTaken}>
                                  {comp.name} [{comp.bin_location}] (Stok: {comp.stock})
                                  {isTaken ? ' — sudah dipilih' : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="bom-builder-row__qty">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            className="form-input num"
                            value={item.quantity_needed}
                            onChange={(e) =>
                              handleUpdateBomRow(item.tempId, 'quantity_needed', e.target.value)
                            }
                            aria-label={`Jumlah kebutuhan baris ${index + 1}`}
                            required
                          />
                        </div>

                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => handleRemoveBomRow(item.tempId)}
                          aria-label={`Hapus baris ${index + 1}`}
                        >
                          <Trash2 size={20} strokeWidth={1.75} aria-hidden="true" />
                        </button>
                      </div>

                      {selectedComp && (
                        <div className="row-between">
                          <div className="row-wrap">
                            <span className="mono-badge">{selectedComp.bin_location}</span>
                            {shortage === 0 ? (
                              <span className="chip chip--ok">
                                <CheckCircle2 size={20} strokeWidth={1.75} aria-hidden="true" />
                                <span>Cukup</span>
                              </span>
                            ) : (
                              <span className="chip chip--danger">
                                <AlertCircle size={20} strokeWidth={1.75} aria-hidden="true" />
                                <span>Kurang {shortage}</span>
                              </span>
                            )}
                          </div>
                          <span className="price">
                            {formatRupiah(selectedComp.unit_price * qty)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan (Sticky di Desktop): Live Preview Kesiapan Rakit & Simpan */}
        <div className="detail-sidebar stack-md">
          <div className="card stack-md">
            <div className="card-head">
              <h2 className="card-title">Pratinjau Kesiapan BOM</h2>
              {preview.totalItems === 0 ? (
                <span className="chip chip--neutral">BOM Kosong</span>
              ) : preview.readinessPercent === 100 ? (
                <span className="chip chip--ok">
                  <CheckCircle2 size={20} strokeWidth={1.75} aria-hidden="true" />
                  <span>Siap Rakit</span>
                </span>
              ) : (
                <span className="chip chip--warn">
                  <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" />
                  <span>Belum Lengkap</span>
                </span>
              )}
            </div>

            <div className="readiness-row">
              <div className="readiness-track" aria-hidden="true">
                <div
                  className={`readiness-fill ${getReadinessFillClass(
                    preview.readinessPercent,
                    preview.totalItems
                  )}`}
                  style={{ width: `${preview.readinessPercent}%` }}
                />
              </div>
              <span className="readiness-pct">{preview.readinessPercent}%</span>
            </div>

            <div className="spec-grid">
              <div className="spec-cell">
                <span className="spec-cell__label">Item Cukup</span>
                <span className="spec-cell__value num">
                  {preview.readyCount} / {preview.totalItems}
                </span>
              </div>
              <div className="spec-cell">
                <span className="spec-cell__label">Estimasi BOM</span>
                <span className="spec-cell__value num">{formatRupiah(preview.totalCost)}</span>
              </div>
            </div>

            <div className="spec-cell">
              <span className="spec-cell__label">Estimasi Kekurangan Belanja</span>
              <span className="spec-cell__value num">{formatRupiah(preview.missingCost)}</span>
            </div>

            <div className="row-wrap">
              <button
                type="button"
                className="btn btn--outline"
                style={{ flex: 1 }}
                onClick={() => navigate('/projects')}
                disabled={submitting}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                style={{ flex: 1 }}
                disabled={submitting || !isOnline}
              >
                <Save size={20} strokeWidth={1.75} aria-hidden="true" />
                <span>{submitting ? 'Menyimpan...' : 'Simpan Proyek'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
