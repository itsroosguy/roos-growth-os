import React from "react";

export function GoogleCalendarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="17" rx="3" fill="#FFFFFF" stroke="#4285F4" strokeWidth="1.5" />
      <path d="M3 8.5H21" stroke="#4285F4" strokeWidth="1.5" />
      <path d="M8 2.5V5.5" stroke="#EA4335" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M16 2.5V5.5" stroke="#34A853" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="8" cy="13" r="1.25" fill="#4285F4" />
      <circle cx="12" cy="13" r="1.25" fill="#FBBC05" />
      <circle cx="16" cy="13" r="1.25" fill="#34A853" />
      <circle cx="8" cy="17" r="1.25" fill="#EA4335" />
      <circle cx="12" cy="17" r="1.25" fill="#4285F4" />
      <circle cx="16" cy="17" r="1.25" fill="#FBBC05" />
    </svg>
  );
}

export function GoogleMeetIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5" width="13" height="14" rx="2.5" fill="#00AC47" />
      <path d="M16 9.5L21 6V18L16 14.5V9.5Z" fill="#00832D" />
      <circle cx="9.5" cy="12" r="2.5" fill="#FFFFFF" />
    </svg>
  );
}

export function ZoomIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#2D8CFF" />
      <path
        d="M6 9C6 7.89543 6.89543 7 8 7H13C14.1046 7 15 7.89543 15 9V14C15 15.1046 14.1046 16 13 16H8C6.89543 16 6 15.1046 6 14V9Z"
        fill="#FFFFFF"
      />
      <path
        d="M15 10.2L18.4 7.65C18.7733 7.37 19.3 7.63667 19.3 8.1V15.9C19.3 16.3633 18.7733 16.63 18.4 16.35L15 13.8V10.2Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}
