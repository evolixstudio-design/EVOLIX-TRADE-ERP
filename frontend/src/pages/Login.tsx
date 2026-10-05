import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../shared/store/authStore';
import api from '../shared/api';
import { LogIn, User, Lock, Command, Eye, EyeOff } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // First try platform login
      try {
        const platformRes = await api.post('/platform/auth/login', { username, password });
        const token = platformRes.data.access_token || platformRes.data.session_id;
        login(token, platformRes.data.user);
        navigate('/platform/dashboard');
        return;
      } catch (err: any) {
        // If it's a 401 (Invalid credentials) for platform, fallback to tenant login
        if (err.response?.status !== 401) {
          throw err;
        }
      }

      // Fallback to tenant login
      const tenantRes = await api.post('/auth/login', { username, password });
      const token = tenantRes.data.access_token || tenantRes.data.session_id;
      login(token, tenantRes.data.user);
      navigate('/dashboard');

    } catch (err: any) {
      if (!navigator.onLine) {
        setError('Network error. Please check your connection.');
      } else {
        setError(err.response?.data?.message || 'Invalid username or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      
      <div className="login-glass-card">
        <div className="login-header">
          <div className="logo-container">
            <Command className="logo-icon" size={32} />
          </div>
          <h1 className="login-title">EVOLIX ERP</h1>
          <p className="login-subtitle">Sign in to your digital workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error slide-down">
              {error}
            </div>
          )}
          
          <div className="input-group">
            <label>Username or Email</label>
            <div className="input-wrapper">
              <User className="input-icon" size={20} />
              <input 
                type="text" 
                placeholder="Enter your username or email"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>
          
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '0.25rem', paddingRight: '0.25rem' }}>
              <label style={{ paddingLeft: 0 }}>Password</label>
              <a href="#" className="forgot-password" onClick={e => e.preventDefault()}>Forgot Password?</a>
            </div>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <span className="spinner"></span>
            ) : (
              <>
                <span>Sign In</span>
                <LogIn size={20} className="btn-icon-right" />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>&copy; {new Date().getFullYear()} Evolix Trade ERP. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

