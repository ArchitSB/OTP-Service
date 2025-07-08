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

  const handleSendOtp = async () => {
    setMsg('');
    try {
      const res = await fetch(`${API}/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
      });
      const data = await res.json();
      if (res.ok) setStep('verify');
      setMsg(data.msg);
    } catch (err) {
      setMsg('Network error');
    }
  };

  const handleVerifyOtp = async () => {
    setMsg('');
    try {
      const res = await fetch(`${API}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, otp }),
      });
      const data = await res.json();
      if (res.ok) setMsg('Success! Welcome.');
      else setMsg(data.msg);
    } catch (err) {
      setMsg('Network error');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h2>OTP {mode === 'signup' ? 'Signup' : 'Login'}</h2>
      {step === 'choose' && (
        <>
          <button onClick={() => { setMode('signup'); setStep('form'); }}>Signup</button>
          <button onClick={() => { setMode('login'); setStep('form'); }}>Login</button>
        </>
      )}
      {step === 'form' && (
        <div>
          <input
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ marginBottom: 8, width: '100%' }}
          /><br />
          <input
            type="text"
            placeholder="Phone (optional)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            style={{ marginBottom: 8, width: '100%' }}
          /><br />
          <button onClick={handleSendOtp}>Send OTP</button>
        </div>
      )}
      {step === 'verify' && (
        <div>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            style={{ marginBottom: 8, width: '100%' }}
          /><br />
          <button onClick={handleVerifyOtp}>Verify OTP</button>
        </div>
      )}
      <div style={{ color: 'red', marginTop: 10 }}>{msg}</div>
    </div>
  );
}

export default App;
