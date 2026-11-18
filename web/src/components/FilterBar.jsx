import { Search, X } from 'lucide-react';

export default function FilterBar({
  search = '',
  onSearchChange,
  placeholder = 'Cari...',
  pills = [],
  activePill = 'ALL',
  onPillChange,
  extraToggle = null,
}) {
  return (
    <div className="filter-bar">
      <div className="search-wrap">
        <Search
          size={20}
          strokeWidth={1.75}
          className="search-wrap__icon"
          aria-hidden="true"
        />
        <input
          type="search"
          className="form-input search-input"
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
        {search && (
          <button
            type="button"
            className="search-clear"
            onClick={() => onSearchChange?.('')}
            aria-label="Bersihkan pencarian"
          >
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
      </div>

      {(pills.length > 0 || extraToggle) && (
        <div className="filter-pills" role="group" aria-label="Filter daftar">
          {pills.map((pill) => {
            const isActive = activePill === pill.value;
            return (
              <button
                key={pill.value}
                type="button"
                className={`filter-pill${isActive ? ' filter-pill--active' : ''}`}
                onClick={() => onPillChange?.(pill.value)}
                aria-pressed={isActive}
              >
                {pill.label}
              </button>
            );
          })}

          {extraToggle && (
            <button
              type="button"
              className={`filter-pill${extraToggle.active ? ' filter-pill--active' : ''}`}
              onClick={extraToggle.onToggle}
              aria-pressed={extraToggle.active}
            >
              {extraToggle.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
