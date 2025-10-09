import { GOOGLE_OAUTH_URL } from '../config';

const featureBullets = [
  'Centralize leads, listings, and transactions in seconds',
  'Automate follow-ups with AI-generated email, SMS, and social copy',
  'Trust Akamai-backed storage for every document, photo, and contract'
];

function Login() {
  const handleGoogleSignIn = () => {
    window.location.href = `${GOOGLE_OAUTH_URL}`;
  };

  return (
    <div className="app-shell login-shell">
      <div className="card login-card">
        <img src="/majicagent-logo.svg" alt="MajicAgent" className="brand-logo" />
        <h1 className="brand">MajicAgent</h1>
        <p className="subtitle">All-in-one assistant for high-performing real estate teams.</p>

        <button type="button" className="primary-button" onClick={handleGoogleSignIn}>
          Continue with Google
        </button>

        <div className="feature-list">
          {featureBullets.map((item) => (
            <p key={item}>• {item}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Login;
