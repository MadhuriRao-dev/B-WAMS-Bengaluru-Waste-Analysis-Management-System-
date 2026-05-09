import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { googleSignIn, appleSignIn } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);

        try {
            const res = await createUserWithEmailAndPassword(auth, email, password);

            // Simple Admin/Worker Check for Prototype
            let role = 'citizen';
            if (email.endsWith('@bwams.admin')) role = 'admin';
            else if (email.endsWith('@bwams.worker')) role = 'worker';

            await setDoc(doc(db, "users", res.user.uid), {
                email: email,
                role: role,
                createdAt: new Date()
            });

            // Auth context will redirect based on role
        } catch (err) {
            console.error(err);
            setError("Failed to create an account: " + err.message);
        }
        setLoading(false);
    }

    async function handleSocialLogin(provider) {
        setLoading(true);
        setError('');
        try {
            let res;
            if (provider === 'google') {
                res = await googleSignIn();
            } else if (provider === 'apple') {
                res = await appleSignIn();
            }

            // Check if user exists in Firestore, if not create doc
            const userDocRef = doc(db, "users", res.user.uid);
            await setDoc(userDocRef, {
                email: res.user.email,
                role: "citizen", // Default to citizen for social login
                createdAt: new Date()
            }, { merge: true }); // Merge prevents overwriting existing data if any

        } catch (err) {
            console.error(err);
            setError("Failed to sign in with " + provider + ": " + err.message);
        }
        setLoading(false);
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar showUserMenu={false} />
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexGrow: 1,
                padding: '20px 0'
            }}>
                <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '5px' }}>Create an Account</h2>
                        <p style={{ margin: 0 }}>Join B-WAMS to report and track issues</p>
                    </div>

                    {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                            />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        <button disabled={loading} className="btn btn-block" type="submit" style={{ height: '44px' }}>
                            Sign Up
                        </button>
                    </form>

                    <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                        <span style={{ padding: '0 10px', fontSize: '0.85rem' }}>OR</span>
                        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button
                            disabled={loading}
                            onClick={() => handleSocialLogin('google')}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem',
                                padding: '10px', cursor: 'pointer', transition: 'background 0.2s',
                                color: '#1e293b', fontWeight: 500
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M23.52 12.29C23.52 11.43 23.44 10.6 23.3 9.81H12V14.41H18.46C18.18 15.86 17.33 17.09 16.06 17.92V20.84H19.95C22.21 18.78 23.52 15.77 23.52 12.29Z" fill="#4285F4" />
                                <path d="M12 24C15.24 24 17.96 22.92 19.95 21.08L16.06 18.15C14.99 18.88 13.62 19.32 12 19.32C8.87 19.32 6.22 17.21 5.27 14.36H1.24V17.47C3.21 21.36 7.28 24 12 24Z" fill="#34A853" />
                                <path d="M5.27 14.36C5.03 13.63 4.89 12.85 4.89 12.05C4.89 11.24 5.03 10.46 5.27 9.73V6.63H1.24C0.45 8.19 0 9.98 0 12.05C0 14.12 0.45 15.91 1.24 17.47L5.27 14.36Z" fill="#FBBC05" />
                                <path d="M12 4.77C13.76 4.77 15.34 5.37 16.59 6.55L19.99 3.16C17.96 1.25 15.24 0 12 0C7.28 0 3.21 2.64 1.24 6.63L5.27 9.73C6.22 12.88 8.87 14.77 12 14.77V4.77Z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>
                    </div>

                    <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
