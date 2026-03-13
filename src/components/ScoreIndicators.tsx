interface ScoreRingProps {
  score: number;
  label: string;
  size?: number;
  strokeWidth?: number;
}

export function ScoreRing({ score, label, size = 72, strokeWidth = 3.5 }: ScoreRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const scoreClass = score >= 85 ? 'score-excellent' : score >= 70 ? 'score-good' : 'score-moderate';
  const strokeColor = score >= 85 ? 'hsl(var(--success))' : score >= 70 ? 'hsl(var(--gold))' : 'hsl(var(--stone))';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative score-ring">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} opacity="0.5" />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={strokeColor} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-base font-display font-bold ${scoreClass}`}>{score}</span>
        </div>
      </div>
      <p className="section-header text-[9px]">{label}</p>
    </div>
  );
}

interface ScoreBarProps {
  score: number;
  label: string;
  maxWidth?: string;
}

export function ScoreBar({ score, label }: ScoreBarProps) {
  const barColor = score >= 85 ? 'bg-success' : score >= 70 ? 'bg-gold' : 'bg-stone';
  const bgColor = score >= 85 ? 'bg-success-light' : score >= 70 ? 'bg-warning-light' : 'bg-muted';
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium text-foreground">{score}%</span>
      </div>
      <div className={`h-1.5 ${bgColor} rounded-full overflow-hidden`}>
        <div className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
