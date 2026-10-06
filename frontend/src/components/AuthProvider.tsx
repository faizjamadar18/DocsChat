'use client';
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // Use environment variable or fallback for development
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'placeholder_client_id';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
