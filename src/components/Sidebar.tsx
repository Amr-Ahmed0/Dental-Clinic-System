import { LayoutDashboard, Users, Stethoscope, Calendar, Pill, ClipboardList, DollarSign, User, LogOut, X } from 'lucide-react';
import { Page, User as UserType } from '../types';
import { getDisplayName, getInitials } from '../displayName';

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  user: UserType | null;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { page: 'patients', label: 'Patients', icon: <Users size={20} /> },
  { page: 'doctors', label: 'Doctors', icon: <Stethoscope size={20} /> },
  { page: 'appointments', label: 'Appointments', icon: <Calendar size={20} /> },
  { page: 'treatments', label: 'Treatments', icon: <Pill size={20} /> },
  { page: 'visits', label: 'Visits', icon: <ClipboardList size={20} /> },
  { page: 'payments', label: 'Payments', icon: <DollarSign size={20} /> },
  { page: 'profile', label: 'My Profile', icon: <User size={20} /> },
];

export default function Sidebar({ currentPage, onNavigate, user, onLogout, isOpen, onClose }: Props) {
  const initial = getInitials(user?.name);

  const handleNav = (page: Page) => {
    onNavigate(page);
    onClose();
  };

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
          <div style={{ padding: '0 .75rem', marginBottom: '.5rem' }}>
            <span style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#475569' }}>Main Menu</span>
          </div>
          {navItems.slice(0, 4).map(item => (
            <button
              key={item.page}
              className={`nav-item ${currentPage === item.page ? 'active' : ''}`}
              onClick={() => handleNav(item.page)}
            >
              {item.icon}
              <span className="nav-text">{item.label}</span>
            </button>
          ))}
          <div style={{ padding: '1rem .75rem .5rem', marginTop: '.25rem' }}>
            <span style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#475569' }}>Clinical</span>
          </div>
          {navItems.slice(4, 6).map(item => (
            <button
              key={item.page}
              className={`nav-item ${currentPage === item.page ? 'active' : ''}`}
              onClick={() => handleNav(item.page)}
            >
              {item.icon}
              <span className="nav-text">{item.label}</span>
            </button>
          ))}
          <div style={{ padding: '1rem .75rem .5rem', marginTop: '.25rem' }}>
            <span style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#475569' }}>Finance</span>
          </div>
          {navItems.slice(6, 7).map(item => (
            <button
              key={item.page}
              className={`nav-item ${currentPage === item.page ? 'active' : ''}`}
              onClick={() => handleNav(item.page)}
            >
              {item.icon}
              <span className="nav-text">{item.label}</span>
            </button>
          ))}
          <div style={{ padding: '1rem .75rem .5rem', marginTop: '.25rem' }}>
            <span style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#475569' }}>Account</span>
          </div>
          {navItems.slice(7).map(item => (
            <button
              key={item.page}
              className={`nav-item ${currentPage === item.page ? 'active' : ''}`}
              onClick={() => handleNav(item.page)}
            >
              {item.icon}
              <span className="nav-text">{item.label}</span>
            </button>
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
