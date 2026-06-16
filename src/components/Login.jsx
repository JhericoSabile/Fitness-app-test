import React, { useState } from 'react'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle login/signup here
    console.log('Email:', email, 'Password:', password)
  }

  return (
    <div style={styles.container}>
      <div style={styles.splitContainer}>
        {/* Left Side - Hero Section */}
        <div style={styles.leftSide}>
          <div style={styles.leftContent}>
            <div style={styles.logo}>
              <span style={styles.logoIcon}>💪</span>
              <span style={styles.logoText}>FitnessTracker</span>
            </div>
            <h1 style={styles.title}>
              Track Your <span style={styles.highlight}>Fitness Journey</span>
            </h1>
            <p style={styles.subtitle}>
              Log workouts, track calories, and achieve your fitness goals all in one place.
            </p>
            <div style={styles.features}>
              <div style={styles.feature}>
                <span style={styles.featureIcon}>✓</span>
                <span>Workout tracking calendar</span>
              </div>
              <div style={styles.feature}>
                <span style={styles.featureIcon}>✓</span>
                <span>Calorie and protein counter</span>
              </div>
              <div style={styles.feature}>
                <span style={styles.featureIcon}>✓</span>
                <span>Progress analytics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div style={styles.rightSide}>
          <div style={styles.formContainer}>
            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </h2>
              <p style={styles.formSubtitle}>
                {isLogin 
                  ? 'Welcome back! Please enter your details' 
                  : 'Join us and start your fitness journey'}
              </p>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={styles.input}
                  required
                />
              </div>

              {isLogin && (
                <div style={styles.optionsRow}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={styles.checkbox}
                    />
                    Remember me
                  </label>
                  <a href="#" style={styles.forgotLink}>Forgot password?</a>
                </div>
              )}

              <button type="submit" style={styles.primaryButton}>
                {isLogin ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div style={styles.divider}>
              <span style={styles.dividerLine}></span>
              <span style={styles.dividerText}>Or continue with</span>
              <span style={styles.dividerLine}></span>
            </div>

            <div style={styles.socialButtons}>
              <button style={styles.socialButton}>
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '10px' }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              <button style={styles.socialButton}>
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '10px' }}>
                  <path fill="#1877F2" d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/>
                </svg>
                Facebook
              </button>
            </div>

            <div style={styles.switchContainer}>
              <span style={styles.switchText}>
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </span>
              <button
                onClick={() => setIsLogin(!isLogin)}
                style={styles.switchButton}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#ffffff',
  },
  splitContainer: {
    display: 'flex',
    minHeight: '100vh',
    flexDirection: 'row',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
    },
  },
  leftSide: {
    flex: 1,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    position: 'relative',
    overflow: 'hidden',
  },
  leftContent: {
    maxWidth: '500px',
    color: 'white',
    zIndex: 2,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '3rem',
  },
  logoIcon: {
    fontSize: '2rem',
    marginRight: '0.5rem',
  },
  logoText: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    lineHeight: 1.2,
  },
  highlight: {
    color: '#fbbf24',
  },
  subtitle: {
    fontSize: '1.125rem',
    marginBottom: '2rem',
    opacity: 0.9,
    lineHeight: 1.6,
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '1rem',
  },
  featureIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    marginRight: '0.75rem',
    fontSize: '0.875rem',
  },
  rightSide: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    backgroundColor: '#ffffff',
  },
  formContainer: {
    width: '100%',
    maxWidth: '450px',
  },
  formHeader: {
    marginBottom: '2rem',
    textAlign: 'center',
  },
  formTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '0.5rem',
  },
  formSubtitle: {
    color: '#6b7280',
    fontSize: '0.875rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontWeight: '500',
    color: '#374151',
    fontSize: '0.875rem',
  },
  input: {
    padding: '0.75rem 1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    outline: 'none',
    backgroundColor: '#f9fafb',
  },
  optionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '-0.5rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#6b7280',
    cursor: 'pointer',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  forgotLink: {
    fontSize: '0.875rem',
    color: '#667eea',
    textDecoration: 'none',
  },
  primaryButton: {
    padding: '0.75rem',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '0.5rem',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    margin: '1.5rem 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    color: '#9ca3af',
    fontSize: '0.875rem',
  },
  socialButtons: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  socialButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.75rem',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    color: '#374151',
  },
  switchContainer: {
    textAlign: 'center',
  },
  switchText: {
    color: '#6b7280',
    fontSize: '0.875rem',
  },
  switchButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.875rem',
    marginLeft: '0.5rem',
  },
}

// Add hover effects with JavaScript (since inline styles don't support :hover)
// We'll add these styles to a style tag
const styleSheet = document.createElement("style")
styleSheet.textContent = `
  input:hover {
    border-color: #667eea !important;
  }
  input:focus {
    border-color: #667eea !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
    background-color: white !important;
  }
  button.primary-btn:hover {
    background-color: #5a67d8 !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3) !important;
  }
  .social-btn:hover {
    background-color: #f9fafb !important;
    border-color: #667eea !important;
    transform: translateY(-1px) !important;
  }
  .forgot-link:hover {
    text-decoration: underline !important;
  }
  .switch-btn:hover {
    text-decoration: underline !important;
  }
`
document.head.appendChild(styleSheet)

export default App