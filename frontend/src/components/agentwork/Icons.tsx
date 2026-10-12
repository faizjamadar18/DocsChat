import React from 'react';

// Quello Logo Mark (from /icons/logo/Q-black.svg)
export function QuelloMark({ className = 'size-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 341.21 341.50"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Quello"
    >
      <path d="M157.10 0.55A170.75 170.75 0 0 1 341.21 160.70L263.62 165.81A92.99 92.99 0 0 0 162.62 78.11Z" />
      <path d="M4.08 207.87A170.75 170.75 0 0 1 136.89 3.39L153.03 79.46A92.99 92.99 0 0 0 80.12 191.59Z" />
      <path d="M230.78 330.61A170.75 170.75 0 0 1 9.71 227.51L82.78 200.91A92.99 92.99 0 0 0 204.09 257.57Z" />
      <path d="M173.83 213.06L213.01 174.02L329.11 289.93L289.90 328.99Z" />
    </svg>
  );
}

export function QuelloLogo({ className = 'h-6 w-auto', showName = true }: { className?: string; showName?: boolean }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <QuelloMark className="size-7 shrink-0" />
      {showName && (
        <span className="font-semibold text-lg tracking-[-0.03em] leading-none text-current">
          uello
        </span>
      )}
    </div>
  );
}

// Aliases for compatibility across landing page components
export const AgentworkLogo = QuelloLogo;
export const AgentworkMark = QuelloMark;

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
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <title>Linear</title>
      <path
        fill="#5E6AD2"
        d="M1.225 61.523c-.222-.949.908-1.546 1.597-.857l36.512 36.512c.69.69.092 1.82-.857 1.597-18.425-4.323-32.93-18.827-37.252-37.252ZM.002 46.889a.99.99 0 0 0 .29.76L52.35 99.71c.201.2.478.307.76.29 2.37-.149 4.695-.46 6.963-.927.765-.157 1.03-1.096.478-1.648L2.576 39.448c-.552-.551-1.491-.286-1.648.479a50.067 50.067 0 0 0-.926 6.962ZM4.21 29.705a.988.988 0 0 0 .208 1.1l64.776 64.776c.289.29.726.375 1.1.208a49.908 49.908 0 0 0 5.185-2.684.981.981 0 0 0 .183-1.54L8.436 24.336a.981.981 0 0 0-1.541.183 49.896 49.896 0 0 0-2.684 5.185Zm8.448-11.631a.986.986 0 0 1-.045-1.354C21.78 6.46 35.111 0 49.952 0 77.592 0 100 22.407 100 50.048c0 14.84-6.46 28.172-16.72 37.338a.986.986 0 0 1-1.354-.045L12.659 18.074Z"
      />
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
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        fill="#635BFF"
        d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697.5 12.441.5 6.64.5 2.71 3.59 2.71 8.271c0 5.863 7.822 6.13 7.822 9.097 0 1.066-.911 1.541-2.27 1.541-2.227 0-5.184-1.088-7.062-2.131L.29 22.395C2.102 23.368 5.485 24 9.183 24c6.046 0 10.154-2.903 10.154-7.822 0-6.196-8.03-6.494-8.03-9.529.023-.746.59-1.144 1.669-1.144 1.397 0 3.42.49 4.887 1.258l.643-4.832c-1.385-.536-3.13-.776-4.53-.776z"
      />
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
    <svg viewBox="0 0 24 24" fill="#FF7A59" className={className}>
      <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.845h-.067a2.2 2.2 0 00-2.193 2.193v.067a2.196 2.196 0 001.252 1.973l.013.006v2.852a6.22 6.22 0 00-2.969 1.31l.012-.01-7.828-6.095A2.497 2.497 0 104.3 4.656l-.012.006 7.697 5.991a6.176 6.176 0 00-1.038 3.446c0 1.343.425 2.588 1.147 3.607l-.013-.02-2.342 2.343a1.968 1.968 0 00-.58-.095h-.002a2.033 2.033 0 102.033 2.033 1.978 1.978 0 00-.1-.595l.005.014 2.317-2.317a6.247 6.247 0 104.782-11.134l-.036-.005zm-.964 9.378a3.206 3.206 0 113.215-3.207v.002a3.206 3.206 0 01-3.207 3.207z" />
    </svg>
  );
}

export function AttioIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 28" fill="none" className={className}>
      <path
        fill="#21201C"
        d="M23.7582 8.82343C24.1958 8.1213 24.1958 7.21828 23.7582 6.52013L21.085 2.24172L20.8622 1.8817C20.4624 1.24322 19.7742 0.861328 19.0184 0.861328H12.9837C12.2298 0.861328 11.5416 1.24322 11.1398 1.88369L0.333425 19.1783C0.11662 19.5244 -0.000732422 19.9242 -0.000732422 20.33C-0.000732422 20.7358 0.114631 21.1355 0.331436 21.4796L3.22945 26.1201C3.62925 26.7605 4.31745 27.1404 5.0713 27.1404H11.106C11.8638 27.1404 12.552 26.7585 12.9499 26.1181L13.1706 25.768C13.1706 25.768 13.1706 25.768 13.1706 25.764C13.1706 25.764 13.1746 25.7581 13.1746 25.7561L15.3287 22.3111L21.7135 12.0934L23.7543 8.82542L23.7582 8.82343ZM23.1277 7.67178C23.1277 7.89256 23.0661 8.11533 22.9408 8.31225L12.3551 25.2548C12.2597 25.408 12.1065 25.4259 12.0448 25.4259C11.9832 25.4259 11.832 25.408 11.7346 25.2548L9.0593 20.9685C8.81664 20.5806 8.81664 20.0814 9.0593 19.6895L19.6449 2.75091C19.7404 2.59577 19.8936 2.57786 19.9552 2.57786C20.0169 2.57786 20.17 2.59577 20.2675 2.7529L22.9408 7.03131C23.0661 7.22822 23.1277 7.451 23.1277 7.67178V7.67178Z"
      />
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
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3.33098 3.90404C3.33098 3.60694 3.69009 3.45823 3.90016 3.6683L6.56665 6.3348C6.62919 6.39731 6.66433 6.48211 6.66435 6.57054V9.09933L3.33098 5.86332V3.90404Z" fill="#FEE100" />
      <path d="M3.33098 6.43249L0.0953015 3.19648C0.0328472 3.13404 -0.0022884 3.04938 -0.00239563 2.96107V1.2372C-0.00239563 0.940108 0.356716 0.791398 0.566782 1.00146L3.33098 3.76566V6.43249ZM3.33098 6.43249L0.566782 3.6683C0.356716 3.45823 -0.00239563 3.60694 -0.00239563 3.90404V5.62791C-0.0022884 5.71622 0.0328472 5.80088 0.0953015 5.86332L3.33098 9.09933V6.43249ZM0.566782 7.00167C0.356716 6.79161 -0.00239563 6.94032 -0.00239563 7.23741V8.96128C-0.0022884 9.04959 0.0328472 9.13425 0.0953015 9.19669L3.33098 12.4327V9.76587L0.566782 7.00167Z" fill="#1D4AFF" />
      <path d="M6.66435 6.57054C6.66433 6.48211 6.62919 6.39731 6.56665 6.3348L3.90016 3.6683C3.69009 3.45823 3.33098 3.60694 3.33098 3.90404V5.62791C3.33109 5.71622 3.36622 5.80088 3.42868 5.86332L6.66435 9.09933V6.5702V6.57054ZM3.33098 12.4324H5.19256C5.48965 12.4324 5.63837 12.0733 5.4283 11.8632L3.33098 9.76587V12.4327V12.4324ZM3.33098 6.43249V8.96095C3.33094 9.00479 3.33956 9.04821 3.35632 9.08871C3.37308 9.12922 3.39767 9.16603 3.42868 9.19702L6.66435 12.4327V9.90391C6.66433 9.81548 6.62919 9.73069 6.56665 9.66817L3.33098 6.43249Z" fill="#F54E00" />
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

export function GoogleIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function FigmaIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 54 80" fill="none" className={className}>
      <path d="M13.3333 80.0002C20.6933 80.0002 26.6667 74.0268 26.6667 66.6668V53.3335H13.3333C5.97333 53.3335 0 59.3068 0 66.6668C0 74.0268 5.97333 80.0002 13.3333 80.0002Z" fill="#0ACF83" />
      <path d="M0 39.9998C0 32.6398 5.97333 26.6665 13.3333 26.6665H26.6667V53.3332H13.3333C5.97333 53.3332 0 47.3598 0 39.9998Z" fill="#A259FF" />
      <path d="M0 13.3333C0 5.97333 5.97333 0 13.3333 0H26.6667V26.6667H13.3333C5.97333 26.6667 0 20.6933 0 13.3333Z" fill="#F24E1E" />
      <path d="M26.6667 0H40.0001C47.3601 0 53.3334 5.97333 53.3334 13.3333C53.3334 20.6933 47.3601 26.6667 40.0001 26.6667H26.6667V0Z" fill="#FF7262" />
      <path d="M53.3334 39.9998C53.3334 47.3598 47.3601 53.3332 40.0001 53.3332C32.6401 53.3332 26.6667 47.3598 26.6667 39.9998C26.6667 32.6398 32.6401 26.6665 40.0001 26.6665C47.3601 26.6665 53.3334 32.6398 53.3334 39.9998Z" fill="#1ABCFE" />
    </svg>
  );
}

export function SyncIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}

export function PaperclipIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

export function ArrowUpIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

