'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
      router.push('/home');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex">
      {/* Left Column (Desktop Dark Side) */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground relative overflow-hidden select-none">
        <div className="relative z-10 flex flex-col justify-between py-12 px-10 xl:px-16 w-full h-full">
          {/* Logo */}
          <Link className="flex items-center text-white gap-1" href="/">
            <svg
              className="size-6"
              width="179"
              height="254"
              viewBox="0 0 179 254"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.95771 218.931L53.8124 245.592C64.4931 251.802 69.8335 254.907 73.8441 252.6C77.8547 250.292 77.8547 244.115 77.8547 231.76V129.609C77.8547 125.101 77.8547 122.847 76.783 120.991C75.7113 119.135 73.7593 118.008 69.8554 115.753L24.0007 89.2759C13.3338 83.1166 8.00036 80.037 4.00018 82.3464C0 84.6557 0 90.8145 0 103.132V205.099C0 209.592 0 211.838 1.0657 213.691C2.13139 215.543 4.0735 216.672 7.95771 218.931Z"
                fill="currentColor"
              />
              <path
                d="M170.201 56.8134L85.4194 7.85851C74.7525 1.69922 69.4191 -1.38043 65.4189 0.928939C61.4187 3.23831 61.4187 9.39702 61.4187 21.7145V72.6429C61.4187 76.9602 61.4187 79.1188 62.4145 80.9232C63.4103 82.7277 65.2366 83.8784 68.8893 86.1799L93.7405 101.838C97.3932 104.14 99.2195 105.291 100.215 107.095C101.211 108.899 101.211 111.058 101.211 115.375V169.051C101.211 181.429 101.211 187.618 105.228 189.924C109.245 192.23 114.59 189.109 125.279 182.868L170.269 156.598C174.141 154.337 176.077 153.206 177.139 151.356C178.201 149.507 178.201 147.265 178.201 142.781V70.6693C178.201 66.1613 178.201 63.9073 177.129 62.051C176.057 60.1947 174.105 59.0676 170.201 56.8134Z"
                fill="currentColor"
              />
            </svg>
            <span className="text-lg font-medium tracking-tight">Plura</span>
          </Link>

          {/* Heading & Features */}
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-4xl xl:text-5xl font-medium text-white tracking-tight font-heading">
                Your AI Workspace
              </h2>
              <p className="text-neutral-400 text-lg mt-2">
                for creating content
              </p>
            </div>

            {/* 4 Feature icon tiles */}
            <div className="grid grid-cols-4 place-items-start md:max-w-xs gap-4">
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center justify-center size-12 rounded-lg bg-white/5 border border-white/8 hover:border-primary/40 transition-colors">
                  <Image
                    alt="The Studio"
                    width={24}
                    height={24}
                    className="size-6"
                    src="/icons/features/studio-light.svg"
                  />
                </div>
                <span className="text-xs text-neutral-400 font-medium text-center">Studio</span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center justify-center size-12 rounded-lg bg-white/5 border border-white/8 hover:border-primary/40 transition-colors">
                  <Image
                    alt="AI Agents"
                    width={24}
                    height={24}
                    className="size-6"
                    src="/icons/features/agent-light.svg"
                  />
                </div>
                <span className="text-xs text-neutral-400 font-medium text-center">Agents</span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center justify-center size-12 rounded-lg bg-white/5 border border-white/8 hover:border-primary/40 transition-colors">
                  <Image
                    alt="Smart Memory"
                    width={24}
                    height={24}
                    className="size-6"
                    src="/icons/features/memory-light.svg"
                  />
                </div>
                <span className="text-xs text-neutral-400 font-medium text-center">Memory</span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center justify-center size-12 rounded-lg bg-white/5 border border-white/8 hover:border-primary/40 transition-colors">
                  <Image
                    alt="Voice Commands"
                    width={24}
                    height={24}
                    className="size-6"
                    src="/icons/features/mic-light.svg"
                  />
                </div>
                <span className="text-xs text-neutral-400 font-medium text-center">Commands</span>
              </div>
            </div>
          </div>

          <div />
        </div>
      </div>

      {/* Right Column (Light Auth Side) */}
      <div className="flex-1 flex items-center px-6 py-12 bg-background justify-center">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <Link className="flex items-center gap-1.5" href="/">
              <svg
                className="size-6 text-foreground"
                width="179"
                height="254"
                viewBox="0 0 179 254"
                fill="none"
              >
                <path
                  d="M7.95771 218.931L53.8124 245.592C64.4931 251.802 69.8335 254.907 73.8441 252.6C77.8547 250.292 77.8547 244.115 77.8547 231.76V129.609C77.8547 125.101 77.8547 122.847 76.783 120.991C75.7113 119.135 73.7593 118.008 69.8554 115.753L24.0007 89.2759C13.3338 83.1166 8.00036 80.037 4.00018 82.3464C0 84.6557 0 90.8145 0 103.132V205.099C0 209.592 0 211.838 1.0657 213.691C2.13139 215.543 4.0735 216.672 7.95771 218.931Z"
                  fill="currentColor"
                />
                <path
                  d="M170.201 56.8134L85.4194 7.85851C74.7525 1.69922 69.4191 -1.38043 65.4189 0.928939C61.4187 3.23831 61.4187 9.39702 61.4187 21.7145V72.6429C61.4187 76.9602 61.4187 79.1188 62.4145 80.9232C63.4103 82.7277 65.2366 83.8784 68.8893 86.1799L93.7405 101.838C97.3932 104.14 99.2195 105.291 100.215 107.095C101.211 108.899 101.211 111.058 101.211 115.375V169.051C101.211 181.429 101.211 187.618 105.228 189.924C109.245 192.23 114.59 189.109 125.279 182.868L170.269 156.598C174.141 154.337 176.077 153.206 177.139 151.356C178.201 149.507 178.201 147.265 178.201 142.781V70.6693C178.201 66.1613 178.201 63.9073 177.129 62.051C176.057 60.1947 174.105 59.0676 170.201 56.8134Z"
                  fill="currentColor"
                />
              </svg>
              <span className="text-xl font-semibold tracking-tight font-heading">Plura</span>
            </Link>
          </div>

          <div className="text-center lg:text-left w-full mt-2">
            <h1 className="text-2xl font-medium text-foreground tracking-tight font-heading">
              Welcome back
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Sign in to continue to your workspace
            </p>
          </div>

          {/* Plura exact Google Button Container with GoogleLogin trigger */}
          <div className="relative w-full mt-6">
            <button
              data-slot="button"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all active:scale-95 cursor-pointer select-none bg-foreground text-background hover:opacity-90 h-10 px-4 py-2 group overflow-hidden relative w-full gap-2 shadow-sm"
            >
              <div className="relative overflow-hidden w-full flex justify-center">
                <div className="transition-transform duration-300 ease-in-out group-hover:-translate-y-full">
                  <span className="flex items-center justify-center gap-2">
                    <svg className="size-4" viewBox="-0.5 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg">
                      <g>
                        <path
                          d="M9.82727273,24 C9.82727273,22.4757333 10.0804318,21.0144 10.5322727,19.6437333 L2.62345455,13.6042667 C1.08206818,16.7338667 0.213636364,20.2602667 0.213636364,24 C0.213636364,27.7365333 1.081,31.2608 2.62025,34.3882667 L10.5247955,28.3370667 C10.0772273,26.9728 9.82727273,25.5168 9.82727273,24"
                          fill="#FBBC05"
                        />
                        <path
                          d="M23.7136364,10.1333333 C27.025,10.1333333 30.0159091,11.3066667 32.3659091,13.2266667 L39.2022727,6.4 C35.0363636,2.77333333 29.6954545,0.533333333 23.7136364,0.533333333 C14.4268636,0.533333333 6.44540909,5.84426667 2.62345455,13.6042667 L10.5322727,19.6437333 C12.3545909,14.112 17.5491591,10.1333333 23.7136364,10.1333333"
                          fill="#EB4335"
                        />
                        <path
                          d="M23.7136364,37.8666667 C17.5491591,37.8666667 12.3545909,33.888 10.5322727,28.3562667 L2.62345455,34.3946667 C6.44540909,42.1557333 14.4268636,47.4666667 23.7136364,47.4666667 C29.4455,47.4666667 34.9177955,45.4314667 39.0249545,41.6181333 L31.5177727,35.8144 C29.3995682,37.1488 26.7323182,37.8666667 23.7136364,37.8666667"
                          fill="#34A853"
                        />
                        <path
                          d="M46.1454545,24 C46.1454545,22.6133333 45.9318182,21.12 45.6113636,19.7333333 L23.7136364,19.7333333 L23.7136364,28.8 L36.3181818,28.8 C35.6879545,31.8912 33.9724545,34.2677333 31.5177727,35.8144 L39.0249545,41.6181333 C43.3393409,37.6138667 46.1454545,31.6490667 46.1454545,24"
                          fill="#4285F4"
                        />
                      </g>
                    </svg>
                    Continue with Google
                  </span>
                </div>
                <div className="absolute inset-0 transition-transform duration-300 ease-in-out group-hover:translate-y-0 translate-y-full">
                  <span className="flex items-center justify-center gap-2">
                    <svg className="size-4" viewBox="-0.5 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg">
                      <g>
                        <path
                          d="M9.82727273,24 C9.82727273,22.4757333 10.0804318,21.0144 10.5322727,19.6437333 L2.62345455,13.6042667 C1.08206818,16.7338667 0.213636364,20.2602667 0.213636364,24 C0.213636364,27.7365333 1.081,31.2608 2.62025,34.3882667 L10.5247955,28.3370667 C10.0772273,26.9728 9.82727273,25.5168 9.82727273,24"
                          fill="#FBBC05"
                        />
                        <path
                          d="M23.7136364,10.1333333 C27.025,10.1333333 30.0159091,11.3066667 32.3659091,13.2266667 L39.2022727,6.4 C35.0363636,2.77333333 29.6954545,0.533333333 23.7136364,0.533333333 C14.4268636,0.533333333 6.44540909,5.84426667 2.62345455,13.6042667 L10.5322727,19.6437333 C12.3545909,14.112 17.5491591,10.1333333 23.7136364,10.1333333"
                          fill="#EB4335"
                        />
                        <path
                          d="M23.7136364,37.8666667 C17.5491591,37.8666667 12.3545909,33.888 10.5322727,28.3562667 L2.62345455,34.3946667 C6.44540909,42.1557333 14.4268636,47.4666667 23.7136364,47.4666667 C29.4455,47.4666667 34.9177955,45.4314667 39.0249545,41.6181333 L31.5177727,35.8144 C29.3995682,37.1488 26.7323182,37.8666667 23.7136364,37.8666667"
                          fill="#34A853"
                        />
                        <path
                          d="M46.1454545,24 C46.1454545,22.6133333 45.9318182,21.12 45.6113636,19.7333333 L23.7136364,19.7333333 L23.7136364,28.8 L36.3181818,28.8 C35.6879545,31.8912 33.9724545,34.2677333 31.5177727,35.8144 L39.0249545,41.6181333 C43.3393409,37.6138667 46.1454545,31.6490667 46.1454545,24"
                          fill="#4285F4"
                        />
                      </g>
                    </svg>
                    Continue with Google
                  </span>
                </div>
              </div>
            </button>

            {/* Hidden clickable GoogleLogin overlay to trigger real auth seamlessly */}
            <div className="absolute inset-0 opacity-0 overflow-hidden cursor-pointer z-10 flex items-center justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign in failed.')}
                useOneTap
                width="384"
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm mt-3 text-center">{error}</div>}
          {loading && <div className="text-muted-foreground text-sm mt-3 text-center">Signing in...</div>}

          <p className="text-center lg:text-left text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <Link className="text-foreground font-medium hover:text-primary transition-colors" href="/login">
              Sign up
            </Link>
          </p>

          <p className="text-center lg:text-left text-xs text-muted-foreground mt-4 leading-relaxed">
            By continuing, you acknowledge that you have read and agree to our{' '}
            <Link className="text-foreground hover:text-primary transition-colors" href="/terms">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link className="text-foreground hover:text-primary transition-colors" href="/privacy">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background">
          <div className="w-6 h-6 border-2 border-primary/20 border-l-primary rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
