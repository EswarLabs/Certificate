import { useState, useId } from 'react';
import { ChevronUp, ChevronDown, MoreHorizontal } from 'lucide-react';
import './DataTable.css';

export default function DataTable({
  columns = [],
  data = [],
  keyField = "id",
  selectedKeys = [],
  onSelectionChange,
  sortField = "",
  sortOrder = "asc",
  onSort,
  isLoading = false,
  emptyState,
  rowActions
}) {
  const tableId = useId();
  const allSelected = data.length > 0 && data.every(row => selectedKeys.includes(row[keyField]));
  const someSelected = data.some(row => selectedKeys.includes(row[keyField])) && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(data.map(r => r[keyField]));
    }
  };

  const toggleSelectRow = (key) => {
    if (selectedKeys.includes(key)) {
      onSelectionChange?.(selectedKeys.filter(k => k !== key));
    } else {
      onSelectionChange?.([...selectedKeys, key]);
    }
  };

  return (
    <div className="dt-wrapper">
      <div className="dt-table-scroll" tabIndex={0} role="region" aria-label="Data Table">
        <table className="dt-table">
          <thead>
            <tr>
              {onSelectionChange && (
                <th className="dt-th dt-th-check">
                  <input
                    type="checkbox"
                    className="dt-checkbox"
                    checked={allSelected}
                    ref={el => el && (el.indeterminate = someSelected)}
                    onChange={toggleSelectAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}

              {columns.map(col => {
                const isSorted = sortField === col.field;
                return (
                  <th
                    key={col.field}
                    className={`dt-th ${col.sortable ? 'sortable' : ''}`}
                    style={{ width: col.width, textAlign: col.align || 'left' }}
                    onClick={() => col.sortable && onSort?.(col.field)}
                  >
                    <div className="dt-th-content" style={{ justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start' }}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="dt-sort-indicator">
                          {isSorted && sortOrder === 'asc' ? <ChevronUp size={14} /> :
                           isSorted && sortOrder === 'desc' ? <ChevronDown size={14} /> :
                           <ChevronDown size={14} className="dt-sort-idle" />}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}

              {rowActions && <th className="dt-th dt-th-actions" style={{ width: 60 }} />}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skel-${i}`} className="dt-tr-skeleton">
                  {onSelectionChange && <td className="dt-td"><div className="skeleton-shimmer dt-skel-box" /></td>}
                  {columns.map((c, cIdx) => (
                    <td key={`skel-${cIdx}`} className="dt-td">
                      <div className="skeleton-shimmer dt-skel-line" style={{ width: `${cIdx === 0 ? 60 : 40}%` }} />
                    </td>
                  ))}
                  {rowActions && <td className="dt-td" />}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onSelectionChange ? 1 : 0) + (rowActions ? 1 : 0)} className="dt-td-empty">
                  {emptyState || <div className="dt-default-empty">No records found.</div>}
                </td>
              </tr>
            ) : (
              data.map(row => {
                const rowKey = row[keyField];
                const isSelected = selectedKeys.includes(rowKey);
                return (
                  <tr key={rowKey} className={`dt-tr ${isSelected ? 'selected' : ''}`}>
                    {onSelectionChange && (
                      <td className="dt-td dt-td-check">
                        <input
                          type="checkbox"
                          className="dt-checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(rowKey)}
                          aria-label={`Select row ${rowKey}`}
                        />
                      </td>
                    )}

                    {columns.map(col => (
                      <td key={col.field} className="dt-td" style={{ textAlign: col.align || 'left' }}>
                        {col.render ? col.render(row) : row[col.field]}
                      </td>
                    ))}

                    {rowActions && (
                      <td className="dt-td dt-td-actions">
                        {rowActions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
