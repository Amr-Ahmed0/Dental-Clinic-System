import { LayoutDashboard, Users, Stethoscope, Calendar, Pill, ClipboardList, DollarSign, User, LogOut, X } from 'lucide-react';
import { Page, User as UserType } from '../types';
import { getDisplayName, getInitials } from '../utils/displayName';
import { Permissions } from '../permissions';

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  user: UserType | null;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  perms: Permissions;
}

const allNavItems: { page: Page; label: string; icon: React.ReactNode; section: string }[] = [
  { page: 'dashboard',    label: 'Dashboard',    icon: <LayoutDashboard size={20} />, section: 'main' },
  { page: 'patients',     label: 'Patients',     icon: <Users size={20} />,           section: 'main' },
  { page: 'doctors',      label: 'Doctors',      icon: <Stethoscope size={20} />,     section: 'main' },
  { page: 'appointments', label: 'Appointments', icon: <Calendar size={20} />,        section: 'main' },
  { page: 'treatments',   label: 'Treatments',   icon: <Pill size={20} />,            section: 'clinical' },
  { page: 'visits',       label: 'Visits',       icon: <ClipboardList size={20} />,   section: 'clinical' },
  { page: 'payments',     label: 'Payments',     icon: <DollarSign size={20} />,      section: 'finance' },
  { page: 'profile',      label: 'My Profile',   icon: <User size={20} />,            section: 'account' },
];

const sectionLabels: Record<string, string> = {
  main: 'Main Menu',
  clinical: 'Clinical',
  finance: 'Finance',
  account: 'Account',
};

export default function Sidebar({ currentPage, onNavigate, user, onLogout, isOpen, onClose, perms }: Props) {
  const initial = getInitials(user?.name);
  const allowed = new Set(perms.pages);
  const visibleItems = allNavItems.filter(i => allowed.has(i.page));

  const handleNav = (page: Page) => { onNavigate(page); onClose(); };

  // Group by section
  const sections = ['main', 'clinical', 'finance', 'account'];
  const grouped = sections
    .map(s => ({ section: s, items: visibleItems.filter(i => i.section === s) }))
    .filter(g => g.items.length > 0);

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🦷</span>
            <span className="logo-text">Dental Clinic</span>
          </div>
          <button className="menu-toggle" onClick={onClose} aria-label="Close menu">
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {grouped.map((g, gi) => (
            <div key={g.section}>
              <div style={{ padding: gi === 0 ? '0 .75rem .5rem' : '1rem .75rem .5rem' }}>
                <span style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#475569' }}>
                  {sectionLabels[g.section]}
                </span>
              </div>
              {g.items.map(item => (
                <button
                  key={item.page}
                  className={`nav-item ${currentPage === item.page ? 'active' : ''}`}
                  onClick={() => handleNav(item.page)}
                >
                  {item.icon}
                  <span className="nav-text">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user" onClick={() => handleNav('profile')} style={{ cursor: 'pointer' }} title="View Profile">
              <div className="sidebar-user-avatar">{initial}</div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{getDisplayName(user.name)}</span>
                <span className="sidebar-user-role">{user.role}</span>
              </div>
            </div>
          )}
          <button className="nav-item" onClick={onLogout}>
            <LogOut size={20} />
            <span className="nav-text">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
