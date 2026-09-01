export function MentorshipIllustration() {
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" role="img" aria-label="Two figures connected by a supervision line, representing student-lecturer mentorship">
      <ellipse cx="160" cy="180" rx="140" ry="16" fill="var(--brand-50)" />

      <line x1="120" y1="90" x2="200" y2="90" stroke="var(--border-strong)" strokeWidth={2} strokeDasharray="5 5" />

      {/* Lecturer figure */}
      <g transform="translate(90, 40)">
        <circle cx="0" cy="0" r="22" fill="var(--brand-700)" />
        <path d="M -26 60 C -26 30 26 30 26 60 L 26 66 L -26 66 Z" fill="var(--brand-600)" />
      </g>

      {/* Student figure */}
      <g transform="translate(230, 40)">
        <circle cx="0" cy="0" r="22" fill="var(--brand-300)" />
        <path d="M -26 60 C -26 30 26 30 26 60 L 26 66 L -26 66 Z" fill="var(--brand-500)" />
      </g>

      <circle cx="160" cy="90" r="7" fill="var(--success-500)" stroke="white" strokeWidth={2} />
    </svg>
  );
}
