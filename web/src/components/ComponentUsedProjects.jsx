import { Link } from 'react-router-dom';
import { FolderKanban, ChevronRight } from 'lucide-react';

// Subkomponen daftar proyek yang menggunakan komponen ini di BOM (ON DELETE RESTRICT info)
export default function ComponentUsedProjects({ usedInProjects = [] }) {
  return (
    <div className="detail-sidebar">
      <div className="list-head" style={{ paddingTop: 0 }}>
        <h2>Dipakai di Proyek BOM</h2>
        <span className="count">{usedInProjects.length} proyek</span>
      </div>

      {usedInProjects.length === 0 ? (
        <div className="card empty-state">
          <FolderKanban size={20} strokeWidth={1.75} aria-hidden="true" />
          <p>Komponen ini belum terdaftar di BOM proyek mana pun.</p>
        </div>
      ) : (
        <ul className="stock">
          {usedInProjects.map((proj) => (
            <li key={proj.item_id} className="card card--interactive">
              <Link to={`/projects/${proj.project_id}`} className="link-row">
                <div className="stack-sm" style={{ minWidth: 0 }}>
                  <div className="card-title">{proj.project_name}</div>
                  <div className="count">Kebutuhan BOM: {proj.quantity_needed} pcs</div>
                </div>
                <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
