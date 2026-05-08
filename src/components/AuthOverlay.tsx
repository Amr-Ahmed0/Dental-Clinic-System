import { useState } from 'react';
import { Eye, EyeOff, Wifi, WifiOff } from 'lucide-react';
import { User } from '../types';
import { setCurrentUser } from '../store';
import { apiLogin, apiRegister, healthCheck } from '../api';

interface Props {
  onLogin: (user: User) => void;
}

export default function AuthOverlay({ onLogin }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<'patient' | 'doctor' | 'receptionist'>('patient');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regError, setRegError] = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  // Check server health on first render
  useState(() => {
    healthCheck().then(ok => setServerOnline(ok));
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const user = await apiLogin(loginEmail, loginPassword);
      // Make sure we got a valid user back
      if (!user.id && !user.email) {
        throw new Error('Invalid response from server');
      }
      user.email = user.email || loginEmail;
      setCurrentUser(user);
      onLogin(user);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed — check your credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const trimmedName = regName.trim();
    if (!trimmedName) { setRegError('Please enter your full name'); return; }
    if (trimmedName.includes('@')) { setRegError('Please enter your real name, not an email'); return; }
    if (trimmedName.length < 2) { setRegError('Name must be at least 2 characters'); return; }
    if (regPassword.length < 6) { setRegError('Password must be at least 6 characters'); return; }
    if (regPassword !== regConfirm) { setRegError('Passwords do not match'); return; }

    const properName = trimmedName
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    setLoading(true);
    try {
      const user = await apiRegister({
        name: properName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        phone: regPhone,
      });
      user.name = user.name || properName;
      user.email = user.email || regEmail;
      user.role = user.role || regRole;
      setCurrentUser(user);
      onLogin(user);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center overflow-y-auto"
         style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 30%, #2563eb 70%, #1d4ed8 100%)' }}>
      {/* Decorative blurs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(37,99,235,.15)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(59,130,246,.1)', filter: 'blur(100px)' }} />
      </div>

      <div className="w-full max-w-[460px] mx-auto p-4 relative z-10">
        <div className="login-card">
          {/* Server status */}
          {/* <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem',
            marginBottom: '.75rem', fontSize: '.75rem', fontWeight: 600,
            color: serverOnline === true ? '#10b981' : serverOnline === false ? '#ef4444' : '#9ca3af',
          }}>
            {serverOnline === true ? <Wifi size={14} /> : serverOnline === false ? <WifiOff size={14} /> : null}
            {serverOnline === true ? 'Backend connected (port 5001)' :
             serverOnline === false ? 'Backend offline — start your server' :
             'Checking server…'}
          </div> */}

          <div className="text-center mb-7">
            <div style={{ fontSize: '3.5rem', marginBottom: '.5rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,.1))' }}>🦷</div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>Dental Clinic</h1>
            <p className="text-sm" style={{ color: 'var(--gray-500)' }}>Management System</p>
          </div>

          <div className="auth-tabs">
            <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
            <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Register</button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="input-box">
                <label>Email Address</label>
                <input type="email" placeholder="Enter your email" required value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="input-box">
                <label>Password</label>
                <div className="relative">
                  <input type={showLoginPwd ? 'text' : 'password'} placeholder="Enter your password" required
                    value={loginPassword} onChange={e => setLoginPassword(e.target.value)} autoComplete="current-password" />
                  <button type="button" className="pwd-toggle" onClick={() => setShowLoginPwd(!showLoginPwd)}>
                    {showLoginPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {loginError && <p className="auth-error">{loginError}</p>}
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? '⏳ Signing in…' : 'Sign In'}
              </button>

              {/* Info box */}
              {/* <div style={{
                marginTop: '1.25rem', padding: '1rem', borderRadius: '.5rem',
                background: 'var(--gray-50)', border: '1px solid var(--border-color)',
              }}>
                <p style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.5rem' }}>
                  📡 Connected to SQL Server
                </p>
                <p style={{ fontSize: '.75rem', color: 'var(--gray-500)', lineHeight: 1.6, marginBottom: '.5rem' }}>
                  Sign in with credentials from the <strong>Users</strong> table in your <strong>DentalClinicSystem</strong> database.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                  <p style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Quick Demo (if seeded)</p>
                  {[
                    { label: '👤 Receptionist', email: 'admin@clinic.com', pwd: 'admin123' },
                    { label: '🩺 Doctor', email: 'doctor@clinic.com', pwd: 'doctor123' },
                    { label: '🦷 Patient', email: 'patient@clinic.com', pwd: 'patient123' },
                  ].map(demo => (
                    <button key={demo.email} type="button" onClick={() => quickLogin(demo.email, demo.pwd)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '.4rem .6rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                        borderRadius: '.375rem', cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
                        fontSize: '.8rem', color: 'var(--text-primary)',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{demo.label}</span>
                      <span style={{ color: 'var(--gray-400)', fontSize: '.75rem' }}>{demo.email}</span>
                    </button>
                  ))}
                </div>
              </div> */}
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="input-box">
                <label>Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="text" placeholder="e.g. John Smith" required value={regName}
                  onChange={e => setRegName(e.target.value)} autoComplete="name"
                  pattern="^[^@]+$" title="Please enter your real name, not an email" />
                <p style={{ fontSize: '.7rem', color: 'var(--gray-400)', marginTop: '.15rem' }}>Enter your first and last name</p>
              </div>
              <div className="input-box">
                <label>Email Address</label>
                <input type="email" placeholder="Enter your email" required value={regEmail}
                  onChange={e => setRegEmail(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div className="input-box">
                  <label>Role</label>
                  <select value={regRole} onChange={e => setRegRole(e.target.value as User['role'])}
                    style={{ width: '100%', padding: '.65rem .9rem', border: '1.5px solid var(--border-color)', borderRadius: '.5rem', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '.95rem', fontFamily: 'inherit' }}>
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="receptionist">Receptionist</option>
                  </select>
                </div>
                <div className="input-box">
                  <label>Phone</label>
                  <input type="tel" placeholder="Phone number" required value={regPhone}
                    onChange={e => setRegPhone(e.target.value)} />
                </div>
              </div>
              <div className="input-box">
                <label>Password</label>
                <div className="relative">
                  <input type={showRegPwd ? 'text' : 'password'} placeholder="Min 6 characters" required
                    value={regPassword} onChange={e => setRegPassword(e.target.value)} />
                  <button type="button" className="pwd-toggle" onClick={() => setShowRegPwd(!showRegPwd)}>
                    {showRegPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="input-box">
                <label>Confirm Password</label>
                <input type="password" placeholder="Repeat password" required value={regConfirm}
                  onChange={e => setRegConfirm(e.target.value)} />
              </div>
              {regError && <p className="auth-error">{regError}</p>}
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? '⏳ Creating account…' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
