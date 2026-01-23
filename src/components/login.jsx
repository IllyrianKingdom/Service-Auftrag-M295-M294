import './login.css'

import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        const ok = login(email.trim(), password);
        if (ok) {
            navigate('/dashboard');
        } else {
            setError('Ungültige Zugangsdaten');

import {useNavigate} from 'react-router-dom';
import { useState } from 'react';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const users = [
        { id: 1, email: 'benutzer1@example.com', password: 'password123', name: 'Benutzer 1' },
        { id: 2, email: 'benutzer2@example.com', password: 'password123', name: 'Benutzer 2' },
        { id: 3, email: 'benutzer3@example.com', password: 'password123', name: 'Benutzer 3' },
        { id: 4, email: 'benutzer4@example.com', password: 'password123', name: 'Benutzer 4' }
    ];
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

      
        await new Promise(resolve => setTimeout(resolve, 500));

        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem('user', JSON.stringify({
                user_id: user.id,
                email: user.email,
                name: user.name
            }));
            navigate('/dashboard');
        } else {
            setError('Email oder Passwort falsch');
            setLoading(false);
>>>>>>> ab89eb103c67d5eb398726b22debc547bcc3454a
        }
    }

    return (
        <>
      <div className="login-container">
        <div className="login-card">
            <div className="login-header">
<<<<<<< HEAD
                <h2>Wilkommen Zurück</h2>
                <p>Melden sie sich an</p>
=======
                <h2>Willkommen zurück</h2>
                <p>Melde dich bei deinem Konto an</p>
>>>>>>> ab89eb103c67d5eb398726b22debc547bcc3454a
            </div>
            
            {error && <div style={{color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px', fontSize: '14px'}}>{error}</div>}
            
            <form className="login-form" id="loginForm" noValidate onSubmit={handleSubmit}>
                <div className="form-group">
                    <div className="input-wrapper">
<<<<<<< HEAD
                        <input value={email} onChange={e => setEmail(e.target.value)} type="email" id="email" name="email" required autoComplete="email" />
                        <label htmlFor="email">Email Addresse</label>
=======
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            required 
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder=" "
                        />
                        <label htmlFor="email">E-Mail-Adresse</label>
>>>>>>> ab89eb103c67d5eb398726b22debc547bcc3454a
                        <span className="focus-border"></span>
                    </div>
                </div>

                <div className="form-group">
                    <div className="input-wrapper password-wrapper">
<<<<<<< HEAD
                        <input value={password} onChange={e => setPassword(e.target.value)} type="password" id="password" name="password" required autoComplete="current-password" />
                        <label htmlFor="password">Passwort</label>
                        <button type="button" className="password-toggle" id="passwordToggle" aria-label="Toggle password visibility">
                            <span className="eye-icon"></span>
                        </button>
=======
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            required 
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder=" "
                        />
                        <label htmlFor="password">Passwort</label>
>>>>>>> ab89eb103c67d5eb398726b22debc547bcc3454a
                        <span className="focus-border"></span>
                    </div>
                </div>

<<<<<<< HEAD
                {error && <div className="form-error">{error}</div>}

                <button type="submit" className="login-btn btn">
                    <span className="btn-text">Anmelden</span>
=======
                <button type="submit" className="login-btn btn" disabled={loading}>
                    <span className="btn-text">{loading ? 'Wird geladen...' : 'Anmelden'}</span>
>>>>>>> ab89eb103c67d5eb398726b22debc547bcc3454a
                    <span className="btn-loader"></span>
                </button>
            </form>

            <div className="signup-link">
<<<<<<< HEAD
                <p>Du hast noch kein Konto <a href="#">Registrieren</a></p>
            </div>

=======
                <p><strong>Demo-Benutzerdaten:</strong><br/>
                Email: benutzer1@example.com<br/>
                Passwort: password123</p>
            </div>
>>>>>>> ab89eb103c67d5eb398726b22debc547bcc3454a
        </div>
    </div>
        </>

    )
}
export default Login;