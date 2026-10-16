'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { QuelloMark, RadialSpinner } from '../../components/agentwork/Icons';
import BackendWarmup from '../../components/BackendWarmup';
import { api } from '../../lib/api';
import { auth } from '../../lib/auth';

function LoginForm() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get('next') || '/home';
  // Letter-never-lost: carry a /join/{token} invite through Google signup
  // so invited new users skip the solo room (backend honors invite_token).
  const inviteToken =
    next.startsWith('/join/') ? decodeURIComponent(next.slice('/join/'.length)).split('?')[0].split('/')[0] : null;

  // Immediately start loading when window blurs while hovering over the Google button (e.g. Google popup window opened)
  useEffect(() => {
    const handleBlur = () => {
      if (isHovered) {
        setError('');
        setLoading(true);
      }
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [isHovered]);

  // Safety timeout: reset loading if authentication does not finish within 45s
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setLoading(false);
    }, 45000);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError('');
    setLoading(true);

    if (!credentialResponse.credential) {
      setError('Google sign in failed (no credential received).');
      setLoading(false);
      return;
    }

    try {
      const data = await api.post('/auth/google', {
        credential: credentialResponse.credential,
        ...(inviteToken ? { invite_token: inviteToken } : {}),
      });
      auth.setToken(data.access_token);
      const needsOnboarding =
        data.is_new_user === true || data.user?.onboarding_completed === false;
      if (needsOnboarding) {
        router.push(`/onboarding/welcome?next=${encodeURIComponent(next)}`);
      } else if (next && next.startsWith('/') && !next.startsWith('//')) {
        router.push(next);
      } else {
        router.push('/home');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex">
      <BackendWarmup />
      {/* Left Column (Desktop Dark Side) */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground relative overflow-hidden select-none">
        <div className="relative z-10 flex flex-col justify-between py-12 px-10 xl:px-16 w-full h-full">
          {/* Logo */}
          <Link className="flex items-center text-white" href="/">
            <QuelloMark className="size-7" />
            <span className="text-lg font-medium tracking-tight">uello</span>
          </Link>

          {/* Heading & Features - aligned to bottom */}
          <div className="flex flex-col gap-8 mt-auto">
            <div>
              <h2 className="text-4xl xl:text-5xl font-medium text-white tracking-tight font-heading">
                Your AI Workspace
              </h2>
              <p className="text-neutral-400 text-lg mt-2">
                grounded in your documents and knowledge
              </p>
            </div>

            {/* 4 Feature icon tiles */}
            <div className="grid grid-cols-4 place-items-start md:max-w-xs gap-4">
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center justify-center size-12 rounded-xl bg-white/5 border border-white/8 hover:border-primary/40 transition-colors">
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
                <div className="flex items-center justify-center size-12 rounded-xl bg-white/5 border border-white/8 hover:border-primary/40 transition-colors">
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
                <div className="flex items-center justify-center size-12 rounded-xl bg-white/5 border border-white/8 hover:border-primary/40 transition-colors">
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
                <div className="flex items-center justify-center size-12 rounded-xl bg-white/5 border border-white/8 hover:border-primary/40 transition-colors">
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
        </div>
      </div>

      {/* Right Column (Light Auth Side) */}
      <div className="flex-1 flex items-center px-6 py-12 bg-background justify-center">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <Link className="flex items-center gap-2" href="/">
              <QuelloMark className="size-6 text-foreground" />
              <span className="text-xl font-semibold tracking-tight font-heading">Quello</span>
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

          {/* Quello Google Button Container with exact plura.in hover and click animations */}
          <div
            onPointerDownCapture={() => {
              setError('');
              setLoading(true);
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative w-full mt-6 group select-none"
          >
            <button
              data-slot="button"
              type="button"
              tabIndex={-1}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none active:scale-95 group-active:scale-95 select-none bg-foreground text-background group-hover:opacity-80 hover:opacity-80 h-9 px-4 py-2 overflow-hidden relative w-full gap-2 cursor-pointer pointer-events-none shadow-sm"
            >
              <div className="relative overflow-hidden">
                <div className="transition-transform duration-300 ease-in-out group-hover:-translate-y-full">
                  <span className="flex items-center gap-2">
                    {loading ? (
                      <RadialSpinner className="size-4 text-current" />
                    ) : (
                      <svg className="size-4" viewBox="-0.5 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg">
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
                      </svg>
                    )}
                    Continue with Google
                  </span>
                </div>
                <div className="absolute inset-0 transition-transform duration-300 ease-in-out group-hover:translate-y-0 translate-y-full">
                  <span className="flex items-center gap-2">
                    {loading ? (
                      <RadialSpinner className="size-4 text-current" />
                    ) : (
                      <svg className="size-4" viewBox="-0.5 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg">
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
                      </svg>
                    )}
                    Continue with Google
                  </span>
                </div>
              </div>
            </button>

            {/* Hidden clickable GoogleLogin overlay to trigger real auth seamlessly */}
            <div className="absolute inset-0 opacity-0 overflow-hidden cursor-pointer z-10 flex items-center justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setLoading(false);
                  setError('Google sign in failed.');
                }}
                click_listener={() => {
                  setError('');
                  setLoading(true);
                }}
                promptMomentNotification={(notification) => {
                  if (notification.isDismissedMoment() || notification.isSkippedMoment()) {
                    setLoading(false);
                  }
                }}
                useOneTap
                width="384"
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm mt-3 text-center">{error}</div>}

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
