import './login.css'
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { API_ENDPOINTS, apiCall } from '../services/api';

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validierung Frontend
        if (!email || !password) {
            setError('Bitte fülle alle Felder aus');
            setLoading(false);
            return;
        }

        try {
            // API Call zum PHP Backend
            const response = await apiCall(API_ENDPOINTS.login, 'POST', {
                email: email.trim(),
                password: password
            });

            if (response.success) {
                // WICHTIG: Token ZUERST speichern
                localStorage.setItem('authToken', response.token);
                
                // DANN Login über AuthContext
                login(response.user);
                
                // DANN navigate
                navigate('/dashboard');
            }
        } catch (err) {
            // Hier kommt jetzt die sprechende Fehlermeldung vom Server
            // oder die fallback-Meldung aus der apiCall-Funktion
            setError(err.message || 'Login fehlgeschlagen');
            console.error('Login error details:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <h2>Willkommen zurück</h2>
                        <p>Melde dich bei deinem Konto an</p>
                    </div>
                    
                    {error && (
                        <div style={{
                            color: '#d32f2f',
                            marginBottom: '15px',
                            padding: '12px',
                            backgroundColor: '#ffebee',
                            borderRadius: '4px',
                            fontSize: '14px',
                            border: '1px solid #ef5350',
                            fontWeight: '500'
                        }}>
                            {error}
                        </div>
                    )}
                    
                    <form className="login-form" onSubmit={handleSubmit} noValidate>
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
                                    disabled={loading}
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
                                    disabled={loading}
                                />
                                <label htmlFor="password">Passwort</label>
                                <span className="focus-border"></span>
                            </div>
                        </div>

                        <button type="submit" className="login-btn btn" disabled={loading}>
                            <span className="btn-text">
                                {loading ? 'Wird geladen...' : 'Anmelden'}
                            </span>
                            <span className="btn-loader"></span>
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

export default Login;
