import { useState, useEffect } from 'react';
import { Eye, EyeOff, Wifi, WifiOff, Loader } from 'lucide-react';
import { User } from '../types';
import { setCurrentUser } from '../store';
import { apiLogin, apiRegister, healthCheck, demo } from '../api';

interface Props {
  onLogin: (user: User, mode: 'live' | 'demo') => void;
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
  const [serverStatus, setServerStatus] = useState<'checking' | 'live' | 'demo'>('checking');

  // Check server health on mount
  useEffect(() => {
    healthCheck().then(mode => setServerStatus(mode));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    if (serverStatus === 'live') {
      // LIVE — call real API
      try {
        const user = await apiLogin(loginEmail, loginPassword);
        user.email = user.email || loginEmail;
        setCurrentUser(user);
        onLogin(user, 'live');
      } catch (err: any) {
        // If auth endpoint doesn't exist, fall back to demo
        if (err.message?.includes('not available') || err.message?.includes('404')) {
          const demoUser = demo.login(loginEmail, loginPassword);
          if (demoUser) {
            setCurrentUser(demoUser);
            onLogin(demoUser, 'live'); // server is live but no auth — use live data
          } else {
            setLoginError('Invalid email or password');
          }
        } else {
          setLoginError(err.message || 'Login failed');
        }
      }
    } else {
      // DEMO MODE — use local data
      setTimeout(() => {
        const user = demo.login(loginEmail, loginPassword);
        if (user) {
          setCurrentUser(user);
          onLogin(user, 'demo');
        } else {
          setLoginError('Invalid credentials. Try: admin@clinic.com / admin123');
        }
        setLoading(false);
      }, 400);
      return;
    }
    setLoading(false);
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

    const properName = trimmedName.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    setLoading(true);

    if (serverStatus === 'live') {
      try {
        const user = await apiRegister({ name: properName, email: regEmail, password: regPassword, role: regRole, phone: regPhone });
        user.name = user.name || properName;
        user.email = user.email || regEmail;
        user.role = user.role || regRole;
        setCurrentUser(user);
        onLogin(user, 'live');
      } catch (err: any) {
        if (err.message?.includes('not available')) {
          const user = demo.register({ name: properName, email: regEmail, password: regPassword, role: regRole, phone: regPhone });
          setCurrentUser(user);
          onLogin(user, serverStatus === 'live' ? 'live' : 'demo');
        } else {
          setRegError(err.message || 'Registration failed');
        }
      }
    } else {
      const user = demo.register({ name: properName, email: regEmail, password: regPassword, role: regRole, phone: regPhone });
      setCurrentUser(user);
      onLogin(user, 'demo');
    }
    setLoading(false);
  };

  const quickLogin = (email: string, password: string) => {
    setLoginEmail(email);
    setLoginPassword(password);
    setTab('login');
    setLoginError('');
  };

  const retryConnection = () => {
    setServerStatus('checking');
    healthCheck().then(mode => setServerStatus(mode));
  };

  const isLive = serverStatus === 'live';
  const isDemo = serverStatus === 'demo';

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center overflow-y-auto"
         style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 30%, #2563eb 70%, #1d4ed8 100%)' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(37,99,235,.15)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(59,130,246,.1)', filter: 'blur(100px)' }} />
      </div>

      <div className="w-full max-w-[550px] mx-auto p-4 relative z-10">
        <div className="login-card">
          {/* Server status banner */}
          <div style={{
            // display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
            // marginBottom: '1rem', padding: '.5rem .75rem', borderRadius: '.5rem', fontSize: '.8rem', fontWeight: 600,
            // background: serverStatus === 'checking' ? '#f3f4f6' : isLive ? '#d1fae5' : '#fef3c7',
            // color: serverStatus === 'checking' ? '#6b7280' : isLive ? '#065f46' : '#92400e',
            // border: `1px solid ${serverStatus === 'checking' ? '#e5e7eb' : isLive ? '#a7f3d0' : '#fde68a'}`,
          }}>
            {/* {serverStatus === 'checking' ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> :
             isLive ? <Wifi size={14} /> : <WifiOff size={14} />}
            {serverStatus === 'checking' ? 'Checking backend connection…' :
             isLive ? '🟢 Connected to SQL Server (port 5001)' :
             '🟡 Demo Mode — Backend offline'}
            {isDemo && (
              <button onClick={retryConnection} style={{
                marginLeft: '.5rem', fontSize: '.7rem', color: '#92400e', background: 'none',
                border: '1px solid #fde68a', padding: '.1rem .4rem', borderRadius: '.25rem', cursor: 'pointer', fontFamily: 'inherit',
              }}>Retry</button>
            )} */}
          </div>

          <div className="text-center mb-7">
            <div style={{ fontSize: '3.5rem', marginBottom: '.5rem' }}>🦷</div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>Dental Clinic System</h1><br />
            {/* <p className="text-sm" style={{ color: 'var(--gray-500)' }}>
              {isLive ? 'Connected to DentalClinicSystem1' : 'Management System'}
            </p> */}
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
              <button type="submit" className="login-btn" disabled={loading || serverStatus === 'checking'}>
                {loading ? '⏳ Signing in…' : 'Sign In'}
              </button>

              {/* Demo quick-login */}
              {/* <div style={{
                marginTop: '1.25rem', padding: '1rem', borderRadius: '.5rem',
                background: 'var(--gray-50)', border: '1px solid var(--border-color)',
              }}>
                <p style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.5rem' }}>
                  {isLive ? '📡 Database accounts' : '🧪 Demo Accounts'}
                </p>
                {isLive ? (
                  <p style={{ fontSize: '.75rem', color: 'var(--gray-500)', lineHeight: 1.6 }}>
                    Sign in with your credentials from the <strong>Users</strong> table in <strong>DentalClinicSystem1</strong>.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                    {[
                      { label: '👤 Receptionist', email: 'admin@clinic.com', pwd: 'admin123' },
                      { label: '🩺 Doctor', email: 'sarah@clinic.com', pwd: 'doctor123' },
                      { label: '🦷 Patient', email: 'john@email.com', pwd: 'patient123' },
                    ].map(d => (
                      <button key={d.email} type="button" onClick={() => quickLogin(d.email, d.pwd)}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '.4rem .6rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                          borderRadius: '.375rem', cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
                          fontSize: '.8rem', color: 'var(--text-primary)',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{d.label}</span>
                        <span style={{ color: 'var(--gray-400)', fontSize: '.75rem' }}>{d.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div> */}

              {/* How to connect info */}
              {isDemo && (
                <div style={{
                  marginTop: '.75rem', padding: '.75rem', borderRadius: '.5rem',
                  background: '#fef3c7', border: '1px solid #fde68a', fontSize: '.75rem', color: '#92400e', lineHeight: 1.6,
                }}>
                  <strong>To connect to SQL Server:</strong><br />
                  1. Start your Express backend: <code style={{ background: '#fde68a', padding: '0 .25rem', borderRadius: '.2rem' }}>npm start</code><br />
                  2. Ensure CORS is enabled: <code style={{ background: '#fde68a', padding: '0 .25rem', borderRadius: '.2rem' }}>app.use(cors())</code><br />
                  3. Server must run on <strong>port 5001</strong>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="input-box">
                <label>Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="text" placeholder="e.g. John Smith" required value={regName}
                  onChange={e => setRegName(e.target.value)} autoComplete="name"
                  pattern="^[^@]+$" title="Enter your real name" />
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
              <button type="submit" className="login-btn" disabled={loading || serverStatus === 'checking'}>
                {loading ? '⏳ Creating account…' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
