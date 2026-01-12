import './login.css'
import {useNavigate} from 'react-router-dom';

function Login() {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        navigate('/dashboard');
    }

    return (
        <>

      <div className="login-container">
        <div className="login-card">
            <div className="login-header">
                <h2>Welcome Back</h2>
                <p>Sign in to your account</p>
            </div>
            
            <form className="login-form" id="loginForm" noValidate onSubmit={handleSubmit}>
                <div className="form-group">
                    <div className="input-wrapper">
                        <input type="email" id="email" name="email" required autoComplete="email" />
                        <label htmlFor="email">Email Address</label>
                        <span className="focus-border"></span>
                    </div>
                  
                </div>

                <div className="form-group">
                    <div className="input-wrapper password-wrapper">
                        <input type="password" id="password" name="password" required autoComplete="current-password" />
                        <label htmlFor="password">Password</label>
                        <button type="button" className="password-toggle" id="passwordToggle" aria-label="Toggle password visibility">
                            <span className="eye-icon"></span>
                        </button>
                        <span className="focus-border"></span>
                    </div>
                   
                </div>

                <button type="submit" className="login-btn btn">
                    <span className="btn-text">Sign In</span>
                    <span className="btn-loader"></span>
                </button>
            </form>



            <div className="signup-link">
                <p>Don't have an account? <a href="#">Sign up</a></p>
            </div>

            <div className="success-message hidden" id="successMessage">
                <div className="success-icon">✓</div>
                <h3>Login Successful!</h3>
                <p>Redirecting to your dashboard...</p>
            </div>
        </div>
    </div>
        </>

    )
}
export default Login;