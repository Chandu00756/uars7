import React, { useEffect, useState, KeyboardEvent } from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import {
  Search,
  AlertTriangle,
  Download,
  Wifi,
  Eye,
  X,
} from 'lucide-react';

/* ---------- 1. TYPE DEFINITIONS ---------- */

interface Command {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;               // ✅ accepts any Lucide icon component
}

/* ---------- 2. STATIC COMMAND LIST ---------- */

const COMMANDS: Command[] = [
  { id: 'search-logs',   title: 'Search Security Logs',  description: 'Find specific events in system logs', icon: Search },
  { id: 'create-alert',  title: 'Create Alert Rule',     description: 'Set up new monitoring alerts',       icon: AlertTriangle },
  { id: 'export-report', title: 'Export Security Report',description: 'Generate compliance reports',        icon: Download },
  { id: 'scan-network',  title: 'Run Network Scan',      description: 'Perform comprehensive network scan', icon: Wifi },
  { id: 'view-incidents',title: 'View Active Incidents', description: 'Show all ongoing security incidents', icon: Eye },
];

/* ---------- 3. COMPONENT ---------- */

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const CommandPalette: React.FC<Props> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);

  /* --- Memo-friendly filtered list --- */
  const filtered = COMMANDS.filter(
    c =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.description.toLowerCase().includes(query.toLowerCase()),
  );

  /* --- Reset state whenever palette opens --- */
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelected(0);
    }
  }, [isOpen]);

  /* --- Global key-handlers while palette is open --- */
  useEffect(() => {
    if (!isOpen) return;                 // nothing to wire if closed

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose();

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected(i => (i + 1) % (filtered.length || 1));
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected(i => (i - 1 + (filtered.length || 1)) % (filtered.length || 1));
      }

      if (e.key === 'Enter' && filtered[selected]) {
        e.preventDefault();
        /* TODO: hook real command execution here */
        console.log('Execute:', filtered[selected].id);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKey as any);
    return () => window.removeEventListener('keydown', handleKey as any);
  }, [isOpen, filtered, selected, onClose]);

  /* ---------- 4. RENDER ---------- */

  if (!isOpen) return null;

  return (
    <div
      className="portal-fixed portal-inset-0 portal-bg-black/40 portal-backdrop-blur-sm portal-z-50"
      onClick={onClose}
    >
      <div
        className="portal-w-full portal-max-w-lg portal-bg-surface portal-rounded-xl portal-p-4 portal-mx-auto portal-mt-24 portal-shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header / Search box */}
        <div className="portal-flex portal-items-center portal-gap-2 portal-mb-3">
          <Search size={18} className="portal-text-secondary" />
          <input
            autoFocus
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="portal-flex-1 portal-bg-transparent focus:portal-outline-none portal-text-sm"
          />
          <button
            onClick={onClose}
            className="portal-p-1 portal-rounded hover:portal-bg-secondary/20"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results list */}
        <div className="portal-max-h-72 portal-overflow-y-auto">
          {filtered.length === 0 && (
            <div className="portal-text-center portal-text-secondary portal-py-6">
              No commands match &quot;{query}&quot;
            </div>
          )}

          {filtered.map((cmd, idx) => (
            <button
              key={cmd.id}
              onClick={() => {
                console.log('Execute:', cmd.id);
                onClose();
              }}
              className={`portal-w-full portal-flex portal-items-start portal-gap-3 portal-p-3 portal-rounded-lg portal-text-left hover:portal-bg-secondary/10 ${
                idx === selected ? 'portal-bg-secondary/20' : ''
              }`}
            >
              <cmd.icon size={20} />
              <div className="portal-flex-1">
                <div className="portal-font-medium portal-text-sm">{cmd.title}</div>
                <div className="portal-text-xs portal-text-secondary">
                  {cmd.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
