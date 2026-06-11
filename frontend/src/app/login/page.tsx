'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';
import { auth } from '../../lib/auth';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post('/auth/login', { email, password });
      auth.setToken(data.access_token);
      router.push('/notebook');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#000000]">
      <div className="bg-surface p-8 sm:p-12 rounded-2xl w-full max-w-md border border-white/10 shadow-lg mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2 text-white">Welcome Back</h1>
          <p className="text-white/60 text-sm">Sign in to continue to your notebook</p>
        </div>

        {registered && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white/80 text-sm text-center">
            Account created successfully. Sign in to continue.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:outline-none placeholder:text-white/30"
            />
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="bg-white text-base py-[14px] rounded-lg font-semibold mt-2 disabled:opacity-70 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-white/60">
          Don't have an account? <Link href="/register" className="text-white/80 font-medium hover:text-white">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="w-5 h-5 border-3 border-white/10 border-l-white rounded-full animate-spin"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
