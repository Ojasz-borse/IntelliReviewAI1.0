
import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const AuthForm: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                // In a real app, you might want to save the phone number to Firestore here.
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center pt-20">
            <div className="max-w-md w-full mx-auto p-8 rounded-2xl bg-white/[0.02] border border-white/5">
                <h2 className="text-2xl font-semibold text-center mb-2">{isLogin ? 'Sign In' : 'Create Account'}</h2>
                <p className="text-neutral-400 text-sm text-center mb-6">
                    {isLogin ? "Welcome back to IntelliReview AI." : "Get started with your AI-powered insights."}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                         <div>
                            <label htmlFor="phone" className="text-xs text-neutral-400 mb-1.5 block">Phone Number</label>
                            <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm placeholder:text-neutral-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all" />
                        </div>
                    )}
                     <div>
                        <label htmlFor="email" className="text-xs text-neutral-400 mb-1.5 block">Email Address</label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm placeholder:text-neutral-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all" />
                    </div>
                     <div>
                        <label htmlFor="password"  className="text-xs text-neutral-400 mb-1.5 block">Password</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm placeholder:text-neutral-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all" />
                    </div>
                    {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all disabled:opacity-50">
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <p className="text-xs text-neutral-500 text-center mt-6">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-violet-400 hover:text-violet-300">
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthForm;
