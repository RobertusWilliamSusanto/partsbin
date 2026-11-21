import { Clock, Hammer, CheckCircle } from 'lucide-react';

// Kontrol pemilih status proyek fisik (planned | in_progress | done) dengan 3 tombol aksesibel
export default function ProjectStatusChanger({ currentStatus, onStatusChange, disabled }) {
  return (
    <div className="form-group" style={{ margin: '8px 0' }}>
      <label className="form-label">Status Pengerjaan Fisik</label>
      <div className="status-selector" role="group" aria-label="Ubah status pengerjaan proyek">
        <button
          type="button"
          className="status-btn status-btn--planned"
          aria-pressed={currentStatus === 'planned'}
          onClick={() => onStatusChange('planned')}
          disabled={disabled}
        >
          <Clock size={16} strokeWidth={2} aria-hidden="true" />
          <span>Direncanakan</span>
        </button>
        <button
          type="button"
          className="status-btn status-btn--progress"
          aria-pressed={currentStatus === 'in_progress'}
          onClick={() => onStatusChange('in_progress')}
          disabled={disabled}
        >
          <Hammer size={16} strokeWidth={2} aria-hidden="true" />
          <span>Dikerjakan</span>
        </button>
        <button
          type="button"
          className="status-btn status-btn--done"
          aria-pressed={currentStatus === 'done'}
          onClick={() => onStatusChange('done')}
          disabled={disabled}
        >
          <CheckCircle size={16} strokeWidth={2} aria-hidden="true" />
          <span>Selesai</span>
        </button>
      </div>
    </div>
  );
}
