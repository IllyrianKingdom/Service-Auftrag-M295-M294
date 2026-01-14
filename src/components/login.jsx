import './login.css'
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
        }
    }

    return (
        <>
      <div className="login-container">
        <div className="login-card">
            <div className="login-header">
                <h2>Willkommen zurück</h2>
                <p>Melde dich bei deinem Konto an</p>
            </div>
            
            {error && <div style={{color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px', fontSize: '14px'}}>{error}</div>}
            
            <form className="login-form" id="loginForm" noValidate onSubmit={handleSubmit}>
                <div className="form-group">
                    <div className="input-wrapper">
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
                        <span className="focus-border"></span>
                    </div>
                </div>

                <div className="form-group">
                    <div className="input-wrapper password-wrapper">
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
                        <span className="focus-border"></span>
                    </div>
                </div>

                <button type="submit" className="login-btn btn" disabled={loading}>
                    <span className="btn-text">{loading ? 'Wird geladen...' : 'Anmelden'}</span>
                    <span className="btn-loader"></span>
                </button>
            </form>

            <div className="signup-link">
                <p><strong>Demo-Benutzerdaten:</strong><br/>
                Email: benutzer1@example.com<br/>
                Passwort: password123</p>
            </div>
        </div>
    </div>
        </>

    )
}
export default Login;