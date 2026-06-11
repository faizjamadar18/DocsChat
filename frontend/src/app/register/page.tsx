'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', { username, email, password });
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#000000]">
      <div className="p-8 sm:p-12 rounded-2xl w-full max-w-md shadow-lg mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-1.5 text-white">Create Account</h1>
          <p className="text-white/60 text-sm">Start your research journey right now</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            {/* <label className="block mb-2 text-sm text-white/60">Username</label> */}
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={2}
              placeholder='Enter your username...'
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:outline-none placeholder:text-white/30 text-sm"
            />
          </div>

          <div>
            {/* <label className="block mb-2 text-sm text-white/60">Email</label> */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder='Enter your email address...'
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:outline-none placeholder:text-white/30 text-sm"
            />
          </div>

          <div className="relative">
            {/* <label className="block mb-2 text-sm text-white/60">Password</label> */}
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder='Enter password'
              className="w-full px-4 py-2 pr-10 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:outline-none placeholder:text-white/30 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 cursor-pointer"
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="bg-surface text-white py-[10px] rounded-4xl font-semibold mt-2 disabled:opacity-70 cursor-pointer"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-white/60">
          Already have an account? <Link href="/login" className="text-white/80 font-medium hover:text-white">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
