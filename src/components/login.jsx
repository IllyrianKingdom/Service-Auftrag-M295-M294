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
        }
    }

    return (
        <>

      <div className="login-container">
        <div className="login-card">
            <div className="login-header">
                <h2>Wilkommen Zurück</h2>
                <p>Melden sie sich an</p>
            </div>
            
            <form className="login-form" id="loginForm" noValidate onSubmit={handleSubmit}>
                <div className="form-group">
                    <div className="input-wrapper">
                        <input value={email} onChange={e => setEmail(e.target.value)} type="email" id="email" name="email" required autoComplete="email" />
                        <label htmlFor="email">Email Addresse</label>
                        <span className="focus-border"></span>
                    </div>
                  
                </div>

                <div className="form-group">
                    <div className="input-wrapper password-wrapper">
                        <input value={password} onChange={e => setPassword(e.target.value)} type="password" id="password" name="password" required autoComplete="current-password" />
                        <label htmlFor="password">Passwort</label>
                        <button type="button" className="password-toggle" id="passwordToggle" aria-label="Toggle password visibility">
                            <span className="eye-icon"></span>
                        </button>
                        <span className="focus-border"></span>
                    </div>
                   
                </div>

                {error && <div className="form-error">{error}</div>}

                <button type="submit" className="login-btn btn">
                    <span className="btn-text">Anmelden</span>
                    <span className="btn-loader"></span>
                </button>
            </form>

            <div className="signup-link">
                <p>Du hast noch kein Konto <a href="#">Registrieren</a></p>
            </div>

        </div>
    </div>
        </>

    )
}
export default Login;