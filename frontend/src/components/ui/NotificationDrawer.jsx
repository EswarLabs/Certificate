import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, X, ExternalLink, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useOrg from '../../hooks/useOrg';
import useWorkspace from '../../hooks/useWorkspace';
import { listJobs } from '../../services/jobServices';
import useSWR from 'swr';
import './NotificationDrawer.css';

export default function NotificationDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef(null);

  /* Persist dismissed notification IDs in localStorage so browser refresh doesn't bring them back */
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('cert_dismissed_notifs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();

  /* Fetch recent job completions/failures dynamically */
  const { data: jobData } = useSWR(
    selectedOrg?.id && selectedWorkspace?.id ? ['drawer-jobs', selectedOrg.id, selectedWorkspace.id] : null,
    ([_, orgId, wsId]) => listJobs(orgId, wsId, 1, 5),
    { refreshInterval: 4000 }
  );

  const recentJobs = jobData?.jobs || [];

  /* Construct dynamic live notifications array */
  const items = [];

  // 1. Check SMTP status
  if (selectedWorkspace && !selectedWorkspace.smtpEnabled && !selectedWorkspace?.smtpConfig?.host) {
    items.push({
      id: `notif-smtp-${selectedWorkspace.id}`,
      title: 'SMTP Email Provider Not Set',
      desc: 'Configure custom email settings to deliver certificate verification emails.',
      type: 'warning',
      link: '/settings?tab=workspace',
      actionLabel: 'Configure SMTP'
    });
  }

  // 2. Check Domain Verification status
  if (selectedOrg && !selectedOrg.isVerified && !selectedOrg.customDomainVerified) {
    items.push({
      id: `notif-dns-${selectedOrg.id}`,
      title: 'Domain Unverified',
      desc: 'Verify company DNS domain records to issue trusted certificates.',
      type: 'warning',
      link: '/settings?tab=organization',
      actionLabel: 'Verify Domain'
    });
  }

  // 3. Dynamic Job Completions & Failures
  recentJobs.forEach(job => {
    if (job.status === 'COMPLETED') {
      items.push({
        id: `job-${job.id}`,
        title: 'Batch Job Completed',
        desc: job.description || job.type || 'Bulk certificate operation finished.',
        type: 'success',
        time: new Date(job.updatedAt || job.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        link: '/jobs'
      });
    } else if (job.status === 'FAILED') {
      items.push({
        id: `job-${job.id}`,
        title: 'Batch Job Failed',
        desc: job.errorMessage || 'Background worker encountered an execution error.',
        type: 'danger',
        time: new Date(job.updatedAt || job.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        link: '/jobs'
      });
    }
  });

  const activeNotifs = items.filter(item => !dismissedIds.includes(item.id));
  const unreadCount = activeNotifs.length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const dismissItem = (id) => {
    setDismissedIds(prev => {
      const updated = Array.from(new Set([...prev, id]));
      localStorage.setItem('cert_dismissed_notifs', JSON.stringify(updated));
      return updated;
    });
  };

  const clearAll = () => {
    const allCurrentIds = items.map(i => i.id);
    setDismissedIds(prev => {
      const updated = Array.from(new Set([...prev, ...allCurrentIds]));
      localStorage.setItem('cert_dismissed_notifs', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="notif-wrapper" ref={drawerRef}>
      <button 
        className="btn-icon notif-trigger" 
        onClick={() => setIsOpen(!isOpen)} 
        title="Notifications & System Health"
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        <Bell size={16} />
        {unreadCount > 0 && <span className="notif-badge-dot" />}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-title">System Attention & Events</span>
            {unreadCount > 0 && (
              <button className="notif-clear-btn" onClick={clearAll}>
                Dismiss all
              </button>
            )}
          </div>

          <div className="notif-list">
            {activeNotifs.length === 0 ? (
              <div className="notif-empty">
                <CheckCircle size={28} className="notif-empty-icon text-success" />
                <p className="font-semibold text-primary mt-2">All systems operating cleanly</p>
                <span className="text-xs text-tertiary">No pending setup warnings or unread job events.</span>
              </div>
            ) : (
              activeNotifs.map(n => (
                <div key={n.id} className={`notif-item ${n.type}`}>
                  <div className="notif-icon-wrap">
                    {n.type === 'warning' ? <AlertTriangle size={16} className="text-warning" /> :
                     n.type === 'danger' ? <AlertTriangle size={16} className="text-danger" /> :
                     n.type === 'success' ? <CheckCircle size={16} className="text-success" /> :
                     <Info size={16} className="text-info" />}
                  </div>
                  <div className="notif-body">
                    <div className="notif-item-title font-bold text-primary">{n.title}</div>
                    <div className="notif-item-desc text-xs text-secondary mt-0.5">{n.desc}</div>
                    
                    <div className="notif-item-meta mt-2 flex items-center justify-between">
                      {n.time && <span className="text-xs text-tertiary font-mono">{n.time}</span>}
                      {n.link && (
                        <Link to={n.link} onClick={() => setIsOpen(false)} className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 ml-auto">
                          <span>{n.actionLabel || "View Details"}</span>
                          <ArrowRight size={11} />
                        </Link>
                      )}
                    </div>
                  </div>
                  <button className="notif-close-item self-start" onClick={() => dismissItem(n.id)} aria-label="Dismiss">
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
