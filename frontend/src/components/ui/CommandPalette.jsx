import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, GraduationCap, FileText, Folder, Building2, 
  PlusCircle, Mail, Settings, Activity, ArrowRight, CornerDownLeft
} from 'lucide-react';
import useOrg from '../../hooks/useOrg';
import useWorkspace from '../../hooks/useWorkspace';
import { listCredentials } from '../../services/credentialServices';
import { listTemplates } from '../../services/templateServices';
import './CommandPalette.css';

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { selectedOrg, selectOrganization, org: orgList } = useOrg();
  const { selectedWorkspace, selectWorkspace, workspaces } = useWorkspace();
  
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  /* ── Quick static actions ── */
  const quickActions = [
    { id: 'act-1', type: 'Action', title: 'Issue New Credential', subtitle: 'Create a single certificate', icon: PlusCircle, path: '/credentials/create' },
    { id: 'act-2', type: 'Action', title: 'Batch Import Credentials', subtitle: 'Upload CSV spreadsheet', icon: Activity, path: '/credentials/batch' },
    { id: 'act-3', type: 'Action', title: 'Create Template', subtitle: 'Design new certificate template', icon: FileText, path: '/templates/create' },
    { id: 'act-4', type: 'Action', title: 'Email Delivery Settings', subtitle: 'Configure custom SMTP', icon: Mail, path: '/settings?tab=workspace' },
    { id: 'act-5', type: 'Action', title: 'Domain Verification', subtitle: 'Verify DNS records', icon: Building2, path: '/settings?tab=organization' },
  ];

  /* ── Fetch search entities ── */
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    const fetchEntities = async () => {
      if (!selectedOrg?.id || !selectedWorkspace?.id) {
        setResults(quickActions);
        return;
      }

      setLoading(true);
      try {
        const [credRes, tempRes] = await Promise.all([
          listCredentials(selectedOrg.id, selectedWorkspace.id, 1, 10, query || undefined),
          listTemplates(selectedOrg.id, selectedWorkspace.id, 1, 10, query || undefined)
        ]);

        if (!active) return;

        const creds = (credRes.credentials || []).map(c => ({
          id: `cred-${c.id}`,
          type: 'Credential',
          title: c.recipientName,
          subtitle: `${c.template?.name || 'Certificate'} • ${c.recipientEmail || c.id}`,
          icon: GraduationCap,
          path: `/credentials/${c.id}`
        }));

        const temps = (tempRes.templates || []).map(t => ({
          id: `temp-${t.id}`,
          type: 'Template',
          title: t.name,
          subtitle: t.description || 'Certificate template',
          icon: FileText,
          path: `/templates/${t.id}`
        }));

        const wsItems = (workspaces || []).map(w => ({
          id: `ws-${w.id}`,
          type: 'Workspace',
          title: `Switch to ${w.name}`,
          subtitle: 'Change active workspace',
          icon: Folder,
          action: () => { selectWorkspace(w); onClose(); }
        }));

        const filteredActions = quickActions.filter(a => 
          a.title.toLowerCase().includes(query.toLowerCase()) || 
          a.subtitle.toLowerCase().includes(query.toLowerCase())
        );

        setResults([...filteredActions, ...creds, ...temps, ...wsItems]);
      } catch (err) {
        console.error("Command palette fetch error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const delay = setTimeout(fetchEntities, 150);
    return () => { active = false; clearTimeout(delay); };
  }, [query, isOpen, selectedOrg, selectedWorkspace]);

  /* ── Keyboard navigation ── */
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[selectedIndex];
      if (item) {
        if (item.action) item.action();
        else if (item.path) {
          navigate(item.path);
          onClose();
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [isOpen, results, selectedIndex, navigate, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="cmd-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Command Palette">
      <div className="cmd-panel" onClick={e => e.stopPropagation()}>
        <div className="cmd-search-bar">
          <Search size={18} className="cmd-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Type a command or search credentials, templates... (ESC to exit)"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            aria-label="Command search input"
          />
          <kbd className="cmd-kbd">ESC</kbd>
        </div>

        <div className="cmd-results">
          {loading && results.length === 0 ? (
            <div className="cmd-empty">Searching repository...</div>
          ) : results.length === 0 ? (
            <div className="cmd-empty">No results found for "{query}"</div>
          ) : (
            results.map((item, idx) => {
              const Icon = item.icon || ArrowRight;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`cmd-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    if (item.action) item.action();
                    else if (item.path) { navigate(item.path); onClose(); }
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="cmd-item-icon">
                    <Icon size={16} />
                  </div>
                  <div className="cmd-item-body">
                    <div className="cmd-item-title">{item.title}</div>
                    {item.subtitle && <div className="cmd-item-subtitle">{item.subtitle}</div>}
                  </div>
                  <span className="cmd-item-badge">{item.type}</span>
                  {isSelected && <CornerDownLeft size={14} className="cmd-enter-icon" />}
                </div>
              );
            })
          )}
        </div>

        <div className="cmd-footer">
          <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
          <span><kbd>↵</kbd> to select</span>
          <span><kbd>ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
