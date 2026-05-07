import { Menu, Search, Bell, Moon, Sun } from 'lucide-react';
import { Page } from '../types';

interface Props {
  onOpenSidebar: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  userInitial: string;
  onNavigate: (page: Page) => void;
  searchQuery: string;
  onSearch: (q: string) => void;
}

export default function Header({ onOpenSidebar, darkMode, onToggleTheme, userInitial, onNavigate, searchQuery, onSearch }: Props) {
  return (
    <header className="top-header">
      <button className="menu-toggle" onClick={onOpenSidebar} aria-label="Open menu">
        <Menu size={24} />
      </button>
      <div className="search-box">
        <input
          type="text"
          placeholder="Search patients, doctors..."
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
        />
        <Search className="search-icon" size={18} />
      </div>
      <div className="header-actions">
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="notif-badge">3</span>
        </button>
        <button className="icon-btn" onClick={onToggleTheme} aria-label="Toggle dark mode">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div style={{ cursor: 'pointer' }} onClick={() => onNavigate('profile')} title="View Profile">
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '1rem', border: '2px solid var(--border-color)',
          }}>
            {userInitial}
          </div>
        </div>
      </div>
    </header>
  );
}
