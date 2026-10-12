import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock } from 'lucide-react';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async (credentials) => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      if (!data.token) throw Error('The login service returned an invalid session.');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user || {}));
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = event => { event.preventDefault(); signIn({email,password}); };
  const handleQuickLogin = async () => {
    setError(''); setLoading(true);
    try {
      const response = await fetch('/api/auth/demo-credentials');
      const data = await response.json();
      if (!response.ok || !data.email || !data.password) throw Error(data.error || 'Local Demo login is unavailable.');
      setEmail(data.email); setPassword(data.password); await signIn(data);
    } catch (failure) { setError(failure.message); setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <Sparkles size={28} />
          </div>
          <h1>Sacred Grounds Management</h1>
          <p>AI-Powered Religious Organization Management</p>
        </div>

        {error && <div role="alert" className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6c6c80' }} />
              <input
                className="form-input"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6c6c80' }} />
              <input
                className="form-input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          <div className="login-actions">
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '12px' }}>
              {loading ? (
                <>
                  <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
            <button type="button" className="quick-login-btn" disabled={loading} onClick={handleQuickLogin}>
              Log In as Demo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
