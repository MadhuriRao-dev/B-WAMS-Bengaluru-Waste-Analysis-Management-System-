import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, googleSignIn, appleSignIn } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
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
            }
        } catch (err) {
            console.error(err);
            setError("User not found. Please sign up.");
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
        <div style={{ minHeight: '100vh' }}>
            <Navbar showUserMenu={false} />
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 64px)'
            }}>
                <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '5px' }}>Welcome Back</h2>
                        <p style={{ margin: 0 }}>Sign in to B-WAMS Portal</p>
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
                        <button disabled={loading} className="btn btn-block" type="submit" style={{ height: '44px' }}>
                            {isLogin ? 'Sign In' : 'Create Account'}
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
                        <button
                            disabled={loading}
                            onClick={() => handleSocialLogin('apple')}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                background: 'black', border: '1px solid black', borderRadius: '0.5rem',
                                padding: '10px', cursor: 'pointer', transition: 'opacity 0.2s',
                                color: 'white', fontWeight: 500
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.05 20.28C15.9037 21.9329 14.6593 23.7042 12.636 23.7431C10.6896 23.7844 10.0673 22.5898 7.8288 22.5898C5.58782 22.5898 4.90422 23.7431 3.03661 23.7844C1.09265 23.8233 -0.525546 17.5147 0.158309 14.0772C0.500593 12.3524 1.74501 9.94723 4.34386 9.86695C6.27315 9.82566 7.64151 11.1554 8.76182 11.1554C9.88212 11.1554 10.9385 9.78438 13.0494 9.78438C13.8588 9.78438 16.1264 10.0759 17.5802 12.1895C17.4716 12.2515 15.2227 13.5794 15.2536 16.4C15.2847 19.3489 17.7667 20.3626 17.8288 20.3936C17.7978 20.4868 17.5337 21.3986 17.05 20.28ZM11.6601 6.84838C12.5312 5.79201 13.1221 4.31985 12.9665 2.87036C11.6911 2.92205 10.145 3.72124 9.242 4.77708C8.43257 5.71185 7.73295 7.21074 7.91931 8.63914C9.33535 8.75231 10.7891 7.9056 11.6601 6.84838Z" />
                            </svg>
                            Continue with Apple
                        </button>
                    </div>

                    <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary-color)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: 0
                            }}
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? "Sign up" : "Log in"}
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
