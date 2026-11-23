import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Trash2, AlertCircle } from 'lucide-react';
import { useComponents, invalidateComponentsCache } from '../hooks/useComponents';
import { invalidateProjectsCache } from '../hooks/useProjects';
import projectService from '../services/projectService';
import { calcBom } from '../utils/bom';
import {
  saveCalculatorDraft,
  loadCalculatorDraft,
  clearCalculatorDraft,
  formatDraftTime,
} from '../utils/draftStorage';
import CalculatorProjectInfo from '../components/CalculatorProjectInfo';
import CalculatorBomBuilder from '../components/CalculatorBomBuilder';
import CalculatorSummary from '../components/CalculatorSummary';

export default function CalculatorPage() {
  const navigate = useNavigate();
  const { components } = useComponents();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bomItems, setBomItems] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [savedDraft, setSavedDraft] = useState(() => loadCalculatorDraft());
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const draftTimerRef = useRef(null);

  // Map komponen berdasarkan ID untuk kalkulasi instan O(1)
  const componentsById = useMemo(() => {
    const map = {};
    for (const c of components) map[c.id] = c;
    return map;
  }, [components]);

  // Hitung live summary BOM secara reaktif
  const summary = useMemo(() => calcBom(bomItems, componentsById), [bomItems, componentsById]);

  // Auto-save draf ter-debounce 400ms (tidak menyimpan coverFile)
  useEffect(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    if (!name && !description && bomItems.length === 0) return;

    draftTimerRef.current = setTimeout(() => {
      const res = saveCalculatorDraft({ name, description, bomItems });
      if (res?.savedAt) setLastSavedAt(res.savedAt);
    }, 400);

    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [name, description, bomItems]);

  const handleLoadDraft = () => {
    if (!savedDraft?.data) return;
    const { data, savedAt } = savedDraft;
    setName(data.name || '');
    setDescription(data.description || '');
    setBomItems(Array.isArray(data.bomItems) ? data.bomItems : []);
    setLastSavedAt(savedAt);
    setSavedDraft(null);
  };

  const handleDiscardDraft = () => {
    clearCalculatorDraft();
    setSavedDraft(null);
    setLastSavedAt(null);
  };

  const handleAddItem = (compId, qty) => {
    setBomItems((prev) => [...prev, { component_id: compId, quantity_needed: qty }]);
  };

  const handleUpdateQty = (compId, nextQty) => {
    setBomItems((prev) =>
      prev.map((it) => (it.component_id === compId ? { ...it, quantity_needed: nextQty } : it))
    );
  };

  const handleRemoveItem = (compId) => {
    setBomItems((prev) => prev.filter((it) => it.component_id !== compId));
  };

  const handleFinalize = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Nama proyek wajib diisi.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: trimmed,
        description: description.trim(),
        status: 'planned',
        items: bomItems.map((it) => ({
          component_id: it.component_id,
          quantity_needed: it.quantity_needed || 1,
        })),
      };

      const res = await projectService.create(payload);
      const created = res.data;

      let uploadWarning = null;
      if (coverFile && created?.id) {
        try {
          await projectService.uploadImage(created.id, coverFile);
        } catch {
          uploadWarning = 'Proyek berhasil dibuat, tetapi foto sampul gagal diunggah.';
        }
      }

      clearCalculatorDraft();
      invalidateProjectsCache();
      invalidateComponentsCache();

      navigate(`/projects/${created.id}`, {
        replace: true,
        state: uploadWarning ? { warning: uploadWarning } : undefined,
      });
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan proyek.');
      setSubmitting(false);
    }
  };

  return (
    <section className="page stack-md">
      <div className="masthead">
        <h1 className="display">Kalkulator BOM</h1>
        <p className="lede">
          Rencanakan proyek elektronika dan hitung kesiapan rakit serta defisit komponen secara live.
        </p>
      </div>

      {savedDraft && (
        <div className="draft-banner">
          <span>
            Draf kalkulator ditemukan
            {savedDraft.savedAt ? ` (pukul ${formatDraftTime(savedDraft.savedAt)})` : ''}.
          </span>
          <div className="row-wrap">
            <button type="button" className="btn btn--outline btn--sm" onClick={handleLoadDraft}>
              <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>Muat Draf</span>
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={handleDiscardDraft}>
              <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>Hapus Draf</span>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert--danger" role="alert">
          <AlertCircle size={20} strokeWidth={1.75} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <CalculatorProjectInfo
        name={name}
        onNameChange={setName}
        description={description}
        onDescriptionChange={setDescription}
        coverFile={coverFile}
        onCoverChange={setCoverFile}
        onCoverRemove={() => setCoverFile(null)}
        disabled={submitting}
      />

      <CalculatorBomBuilder
        components={components}
        bomItems={summary.items || []}
        onAddItem={handleAddItem}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        disabled={submitting}
      />

      <CalculatorSummary
        summary={summary}
        submitting={submitting}
        onFinalize={handleFinalize}
      />

      {lastSavedAt && (
        <span className="count" style={{ textAlign: 'center', display: 'block' }}>
          Draf otomatis tersimpan pukul {formatDraftTime(lastSavedAt)}
        </span>
      )}
    </section>
  );
}
