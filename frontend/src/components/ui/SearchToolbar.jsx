import { useState } from 'react';
import { Search, Filter, ArrowUpDown, Download, Trash2, CheckSquare, Calendar } from 'lucide-react';
import './SearchToolbar.css';

export default function SearchToolbar({
  searchQuery = "",
  onSearchChange,
  placeholder = "Search items...",
  totalCount = 0,
  selectedCount = 0,
  onBulkDelete,
  onExportCsv,
  sortOptions = [],
  currentSort = "",
  onSortChange,
  filterOptions = [],
  currentFilter = "",
  onFilterChange,
  children
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="st-container">
      <div className="st-main-row">
        {/* Search Input */}
        <div className="st-search-box">
          <Search size={16} className="st-search-icon" />
          <input
            type="text"
            className="st-input"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            aria-label="Filter records"
          />
          {searchQuery && (
            <button className="st-clear" onClick={() => onSearchChange?.("")}>×</button>
          )}
        </div>

        {/* Controls */}
        <div className="st-controls-group">
          {filterOptions.length > 0 && (
            <select
              className="st-select"
              value={currentFilter}
              onChange={(e) => onFilterChange?.(e.target.value)}
              aria-label="Filter status"
            >
              <option value="">All Filters</option>
              {filterOptions.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          )}

          {sortOptions.length > 0 && (
            <div className="st-sort-wrap">
              <ArrowUpDown size={14} className="st-sort-icon" />
              <select
                className="st-select st-sort-select"
                value={currentSort}
                onChange={(e) => onSortChange?.(e.target.value)}
                aria-label="Sort order"
              >
                <option value="">Sort by: Default</option>
                {sortOptions.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          )}

          {onExportCsv && (
            <button className="btn btn-secondary btn-sm st-action-btn" onClick={onExportCsv} title="Export spreadsheet">
              <Download size={14} />
              <span>Export</span>
            </button>
          )}

          {children}
        </div>
      </div>

      {/* Bulk action selection bar */}
      {selectedCount > 0 && (
        <div className="st-bulk-bar">
          <div className="st-bulk-info">
            <CheckSquare size={16} className="text-brand" />
            <span style={{ fontWeight: 600 }}>{selectedCount} item{selectedCount > 1 ? 's' : ''} selected</span>
            <span style={{ color: "var(--text-tertiary)" }}>of {totalCount} total</span>
          </div>

          <div className="st-bulk-actions">
            {onBulkDelete && (
              <button className="btn btn-danger btn-sm" onClick={onBulkDelete}>
                <Trash2 size={13} />
                <span>Delete selected ({selectedCount})</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
