import { Clock, Hammer, CheckCircle } from 'lucide-react';

const STATUS_MAP = {
  planned: {
    label: 'Direncanakan',
    icon: Clock,
    className: 'status-planned',
  },
  in_progress: {
    label: 'Dikerjakan',
    icon: Hammer,
    className: 'status-progress',
  },
  done: {
    label: 'Selesai',
    icon: CheckCircle,
    className: 'status-done',
  },
};

// Komponen penampil status progres fisik proyek (planned | in_progress | done)
export default function StatusChip({ status }) {
  // Fallback aman jika status tidak dikenali agar UI tidak crash
  const config = STATUS_MAP[status] || STATUS_MAP.planned;
  const Icon = config.icon;

  return (
    <span className={`status-chip ${config.className}`}>
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}
