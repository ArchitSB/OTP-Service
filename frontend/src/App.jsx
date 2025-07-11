import { useState } from 'react'
import './App.css'

const API = 'http://localhost:5000/api/auth';

function App() {
  const [step, setStep] = useState('choose');
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info'); // 'info', 'error', 'success'
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const reset = () => {
    setEmail('');
    setPhone('');
    setOtp('');
    setMsg('');
    setMsgType('info');
    setUser(null);
    setStep('choose');
  };

  const handleSendOtp = async () => {
    setMsg('');
    setMsgType('info');
    setLoading(true);
    try {
      const res = await fetch(`${API}/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep('verify');
        setMsgType('success');
      } else {
        setMsgType('error');
      }
      setMsg(data.msg);
    } catch (err) {
      setMsgType('error');
      setMsg('Network error');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    setMsg('');
    setMsgType('info');
    setLoading(true);
    try {
      const res = await fetch(`${API}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsgType('success');
        setMsg('Success! Welcome.');
        setUser(data.user);
        setStep('success');
      } else {
        setMsgType('error');
        setMsg(data.msg);
      }
    } catch (err) {
      setMsgType('error');
      setMsg('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="otp-bg">
      <div className="otp-card">
        <h2 className="otp-title">
          {step === 'choose' && 'Welcome'}
          {step === 'form' && `OTP ${mode === 'signup' ? 'Signup' : 'Login'}`}
          {step === 'verify' && 'Verify OTP'}
          {step === 'success' && 'Welcome!'}
        </h2>
        
        {step === 'choose' && (
          <div className="otp-btn-group">
            <button className="otp-btn" onClick={() => { setMode('signup'); setStep('form'); }}>Signup</button>
            <button className="otp-btn" onClick={() => { setMode('login'); setStep('form'); }}>Login</button>
          </div>
        )}

        {step === 'form' && (
          <form
            className="otp-form"
            onSubmit={e => { e.preventDefault(); handleSendOtp(); }}
          >
            <input
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="otp-input"
              autoFocus
            />
            <input
              type="text"
              placeholder="Phone (optional)"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="otp-input"
            />
            <button className="otp-btn" type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            <button className="otp-btn otp-btn-secondary" type="button" onClick={reset} disabled={loading}>
              Back
            </button>
          </form>
        )}

        {step === 'verify' && (
          <form
            className="otp-form"
            onSubmit={e => { e.preventDefault(); handleVerifyOtp(); }}
          >
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              className="otp-input"
              autoFocus
            />
            <button className="otp-btn" type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button className="otp-btn otp-btn-secondary" type="button" onClick={reset} disabled={loading}>
              Back
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="otp-success">
            <div className="otp-success-icon">✅</div>
            <h3 className="otp-success-title">
              {mode === 'signup' ? 'Account Created Successfully!' : 'Login Successful!'}
            </h3>
            <p className="otp-success-text">
              Welcome {user?.email || user?.phone}!
            </p>
            <button className="otp-btn" onClick={reset}>
              Continue
            </button>
          </div>
        )}

        {msg && step !== 'success' && (
          <div className={`otp-msg otp-msg-${msgType}`}>
            {msg}
          </div>
        )}
      </div>
      <footer className="otp-footer">
        <span>OTP Auth Demo &copy; {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}

export default App;
