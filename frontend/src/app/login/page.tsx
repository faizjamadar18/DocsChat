'use client';
import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { api } from '../../lib/api';
import { auth } from '../../lib/auth';

function LoginForm() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError('');
    setLoading(true);

    if (!credentialResponse.credential) {
        setError('Google sign in failed (no credential received).');
        setLoading(false);
        return;
    }

    try {
      const data = await api.post('/auth/google', { credential: credentialResponse.credential });
      auth.setToken(data.access_token);
      router.push('/notebook');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#000000]">
      <div className="p-8 sm:p-12 rounded-2xl w-full max-w-md shadow-lg mx-4 text-center">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1.5 text-white">Welcome to DocsChat</h1>
          <p className="text-white/60 text-sm">Sign in with your Google account</p>
        </div>

        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setError('Google login failed.');
            }}
            useOneTap
            theme="filled_black"
            shape="pill"
          />
        </div>

        {error && <div className="text-red-400 text-sm">{error}</div>}
        {loading && <div className="text-white/60 text-sm mt-4">Signing in...</div>}
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
