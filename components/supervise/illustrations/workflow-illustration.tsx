export function WorkflowIllustration() {
  return (
    <svg viewBox="0 0 400 140" className="h-full w-full" role="img" aria-label="Three-step workflow: submit, review, track">
      <line x1="70" y1="70" x2="330" y2="70" stroke="var(--border-strong)" strokeWidth={2} strokeDasharray="6 6" />

      {/* Step 1 — submit */}
      <g>
        <circle cx="70" cy="70" r="38" fill="var(--brand-50)" stroke="var(--brand-300)" strokeWidth={2} />
        <rect x="55" y="52" width="30" height="36" rx="4" fill="white" stroke="var(--brand-600)" strokeWidth={2.5} />
        <path d="M 62 62 h 16 M 62 70 h 16 M 62 78 h 10" stroke="var(--brand-600)" strokeWidth={2} strokeLinecap="round" />
        <path d="M 70 40 v -12 m 0 0 l -6 6 m 6 -6 l 6 6" stroke="var(--brand-700)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Step 2 — review */}
      <g>
        <circle cx="200" cy="70" r="38" fill="var(--warn-300)" opacity={0.25} />
        <circle cx="200" cy="70" r="38" fill="none" stroke="var(--warn-500)" strokeWidth={2} />
        <circle cx="195" cy="65" r="12" fill="none" stroke="var(--warn-600)" strokeWidth={3} />
        <line x1="204" y1="74" x2="214" y2="84" stroke="var(--warn-600)" strokeWidth={3} strokeLinecap="round" />
      </g>

      {/* Step 3 — track */}
      <g>
        <circle cx="330" cy="70" r="38" fill="var(--success-300)" opacity={0.25} />
        <circle cx="330" cy="70" r="38" fill="none" stroke="var(--success-500)" strokeWidth={2} />
        <path d="M 316 70 l 9 9 l 18 -20" fill="none" stroke="var(--success-600)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
