import { useState, useRef, useEffect } from 'react';
import { Plus, GraduationCap, FileText, Folder, UserPlus, Upload, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import './QuickCreateDropdown.css';

export default function QuickCreateDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const createActions = [
    { label: 'Issue Credential', icon: GraduationCap, path: '/credentials/create', shortcut: 'C' },
    { label: 'New Template', icon: FileText, path: '/templates/create', shortcut: 'T' },
    { label: 'Create Workspace', icon: Folder, path: '/workspaces', shortcut: 'W' },
    { label: 'Invite Member', icon: UserPlus, path: '/workspaces', shortcut: 'M' },
    { label: 'Upload Asset', icon: Upload, path: '/files', shortcut: 'A' },
  ];

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  return (
    <div className="qc-wrapper" ref={dropdownRef}>
      <button 
        className="btn btn-primary qc-trigger btn-sm" 
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Plus size={14} />
        <span>Create</span>
        <ChevronDown size={13} className={`qc-arrow ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="qc-dropdown" role="menu">
          <div className="qc-menu-label">Quick Creation</div>
          {createActions.map(act => {
            const Icon = act.icon;
            return (
              <Link
                key={act.label}
                to={act.path}
                onClick={() => setIsOpen(false)}
                className="qc-item"
                role="menuitem"
              >
                <Icon size={15} className="qc-item-icon" />
                <span className="qc-item-label">{act.label}</span>
                <kbd className="qc-item-kbd">{act.shortcut}</kbd>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
