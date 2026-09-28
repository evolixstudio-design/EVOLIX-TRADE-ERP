import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api';
import { LogIn, User, Lock, Command } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await api.post('/auth/login', { username, password });
      login(res.data.session_id, res.data.user);
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
            <label>Username</label>
            <div className="input-wrapper">
              <User className="input-icon" size={20} />
              <input 
                type="text" 
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input 
                type="password" 
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
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
