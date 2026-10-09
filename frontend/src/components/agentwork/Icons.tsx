import React from 'react';

// Agentwork Logo Mark (Duotone geometric shape)
export function AgentworkLogo({ className = 'h-5 w-auto', showName = true }: { className?: string; showName?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 70 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-auto shrink-0 text-current">
        <path
          d="M42 23C42 19.134 38.866 16 35 16C31.134 16 28 19.134 28 23L28 31L14 31V23C14 11.402 23.402 2 35 2C46.598 2 56 11.402 56 23V31L42 31V23Z"
          fill="currentColor"
        />
        <path
          d="M21 60C9.40203 60 0 50.598 0 39L0 31L14 31L14 39C14 42.866 17.134 46 21 46C24.866 46 28 42.866 28 39V31H42V39C42 42.866 45.134 46 49 46C52.866 46 56 42.866 56 39V31L70 31V39C70 50.598 60.598 60 49 60C43.6212 60 38.7154 57.977 35 54.6514C31.2846 57.977 26.3788 60 21 60Z"
          fill="currentColor"
        />
      </svg>
      {showName && (
        <span className="font-semibold text-[17px] tracking-[-0.03em] leading-none text-current">
          agentwork
        </span>
      )}
    </div>
  );
}

export function AgentworkMark({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 70 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M42 23C42 19.134 38.866 16 35 16C31.134 16 28 19.134 28 23L28 31L14 31V23C14 11.402 23.402 2 35 2C46.598 2 56 11.402 56 23V31L42 31V23Z"
        fill="currentColor"
      />
      <path
        d="M21 60C9.40203 60 0 50.598 0 39L0 31L14 31L14 39C14 42.866 17.134 46 21 46C24.866 46 28 42.866 28 39V31H42V39C42 42.866 45.134 46 49 46C52.866 46 56 42.866 56 39V31L70 31V39C70 50.598 60.598 60 49 60C43.6212 60 38.7154 57.977 35 54.6514C31.2846 57.977 26.3788 60 21 60Z"
        fill="currentColor"
      />
    </svg>
  );
}

// App Provider Logos (SVG)
export function SlackIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52-2.523 2.52 2.52 0 0 1 2.52-2.52h2.52v2.52c0 1.394-1.127 2.523-2.52 2.523z" fill="#E01E5A" />
      <path d="M6.303 15.165a2.528 2.528 0 0 1 2.52-2.523h2.52v5.043c0 1.393-1.127 2.52-2.52 2.52a2.52 2.52 0 0 1-2.52-2.52v-2.52z" fill="#E01E5A" />
      <path d="M8.823 5.042a2.528 2.528 0 0 1 2.52-2.52 2.52 2.52 0 0 1 2.52 2.52v2.52h-2.52a2.528 2.528 0 0 1-2.52-2.52z" fill="#36C5F0" />
      <path d="M8.823 6.303a2.528 2.528 0 0 1 2.52 2.52v2.52H6.303a2.52 2.52 0 0 1-2.52-2.52 2.528 2.528 0 0 1 2.52-2.52h2.52z" fill="#36C5F0" />
      <path d="M18.958 8.823a2.528 2.528 0 0 1 2.52 2.52 2.52 2.52 0 0 1-2.52 2.52h-2.52v-2.52c0-1.393 1.127-2.52 2.52-2.52z" fill="#2EB67D" />
      <path d="M17.697 8.823a2.528 2.528 0 0 1-2.52 2.52h-2.52V6.3a2.52 2.52 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.52 2.52v2.523z" fill="#2EB67D" />
      <path d="M15.177 18.958a2.528 2.528 0 0 1-2.52 2.52 2.52 2.52 0 0 1-2.52-2.52v-2.52h2.52c1.393 0 2.52 1.127 2.52 2.52z" fill="#ECB22E" />
      <path d="M15.177 17.697a2.528 2.528 0 0 1-2.52-2.52v-2.52h5.043a2.52 2.52 0 0 1 2.52 2.52 2.528 2.528 0 0 1-2.52 2.52h-2.523z" fill="#ECB22E" />
    </svg>
  );
}

export function NotionIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l11.458-.84c1.12-.093 1.399-.373 1.12-1.213L18.423.896c-.373-.746-1.12-1.026-2.148-.933L2.686.99c-1.027.093-1.307.56-.934 1.306l2.707 1.912zm1.68 4.478v12.502c0 .933.466 1.306 1.492 1.213l13.136-.933c1.026-.093 1.213-.653 1.213-1.493V7.288c0-.84-.373-1.306-1.306-1.213l-13.23.933c-.933.093-1.305.56-1.305 1.678zm11.738 1.306c.093.56-.187 1.026-.746 1.026-.56 0-.746-.466-.84-.933l-.56-2.146-4.57 6.998v-5.69c0-.56.186-.933.746-.933.467 0 .747.373.84.84l.466 1.96 4.664-7.092v5.97z" />
    </svg>
  );
}

export function GoogleDriveIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M8.27 3.5 1.77 14.77l3.66 6.34 6.5-11.27L8.27 3.5z" fill="#0066DA" />
      <path d="M15.73 3.5H8.27l6.5 11.27h7.46L15.73 3.5z" fill="#00AC47" />
      <path d="m11.93 9.84-3.66 6.34 3.66 6.34h7.46l3.66-6.34-11.12-6.34z" fill="#EA4335" />
      <path d="M14.77 14.77H1.77L5.43 21.1h13.09l-3.75-6.33z" fill="#FFBA00" />
    </svg>
  );
}

export function GoogleDocsIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="2" width="18" height="20" rx="2" fill="#4285F4" />
      <path d="M7 7h10M7 11h10M7 15h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function GoogleSheetsIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="2" width="18" height="20" rx="2" fill="#0F9D58" />
      <path d="M8 7h8v10H8z" fill="#fff" fillOpacity="0.2" />
      <path d="M7 11h10M7 14h10M12 7v10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function GoogleSlidesIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="2" width="18" height="20" rx="2" fill="#F4B400" />
      <rect x="7" y="7" width="10" height="7" rx="1" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

export function GmailIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2 6l10 7 10-7v12H2V6z" fill="#EA4335" />
      <path d="M22 6L12 13 2 6V4h20v2z" fill="#C5221F" opacity="0.4" />
    </svg>
  );
}

export function LinearIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M2.5 19.5L19.5 2.5C18.2 1.5 16.7 1 15 1 7.3 1 1 7.3 1 15c0 1.7.5 3.2 1.5 4.5zm2 2C5.8 22.5 7.3 23 9 23c7.7 0 14-6.3 14-14 0-1.7-.5-3.2-1.5-4.5L4.5 21.5z" />
    </svg>
  );
}

export function GitHubIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function StripeIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697.5 12.441.5 6.64.5 2.71 3.59 2.71 8.271c0 5.863 7.822 6.13 7.822 9.097 0 1.066-.911 1.541-2.27 1.541-2.227 0-5.184-1.088-7.062-2.131L.29 22.395C2.102 23.368 5.485 24 9.183 24c6.046 0 10.154-2.903 10.154-7.822 0-6.196-8.03-6.494-8.03-9.529.023-.746.59-1.144 1.669-1.144 1.397 0 3.42.49 4.887 1.258l.643-4.832c-1.385-.536-3.13-.776-4.53-.776z" />
    </svg>
  );
}

export function Microsoft365Icon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="2" width="9" height="9" fill="#F25022" />
      <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
      <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
      <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export function HubSpotIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.5 7.5a3 3 0 1 0-3-3v3.1a6.49 6.49 0 0 0-4.5 2.4L4.8 7.3a2.5 2.5 0 1 0-.9 1.4l5.3 2.8a6.5 6.5 0 1 0 7.3-4.5v.5zm-5.5 11a4.5 4.5 0 1 1 4.5-4.5 4.5 4.5 0 0 1-4.5 4.5z" />
    </svg>
  );
}

export function AttioIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="5" fill="#1C1B1F" />
      <path d="M7 16l5-10 5 10h-2.5l-1-2.2H10.5L9.5 16H7zm4.2-4.2h1.6L12 9.7l-.8 2.1z" fill="#fff" />
    </svg>
  );
}

export function FirefliesIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" fill="#7C3AED" />
      <circle cx="12" cy="12" r="4" fill="#FCD34D" />
    </svg>
  );
}

export function PostHogIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3.5 12a8.5 8.5 0 1 1 17 0 8.5 8.5 0 0 1-17 0zm8.5-6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" />
    </svg>
  );
}

export function GranolaIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#F59E0B" />
      <circle cx="12" cy="12" r="5" fill="#fff" />
    </svg>
  );
}


