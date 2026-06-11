'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <div className="bg-surface p-8 sm:p-12 rounded-2xl w-full max-w-md border border-white/10 shadow-lg mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2 text-white">Create Account</h1>
          <p className="text-white/60 text-sm">Start your research journey</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block mb-2 text-sm text-white/60">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={2}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:outline-none placeholder:text-white/30"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-white/60">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:outline-none placeholder:text-white/30"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-white/60">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:outline-none placeholder:text-white/30"
            />
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="bg-white text-base py-[14px] rounded-lg font-semibold mt-2 disabled:opacity-70 cursor-pointer"
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
