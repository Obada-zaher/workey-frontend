import type { CSSProperties } from "react";

export function ProfileProgressRing({ percentage }: { percentage: number }) {
  const progress = Math.min(100, Math.max(0, percentage));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);
  const ringStyle = {
    "--profile-progress-circumference": circumference,
    "--profile-progress-offset": offset,
  } as CSSProperties;

  return (
    <div
      aria-label={`Profile completion: ${progress}%`}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={progress}
      className="profile-progress-ring"
      role="progressbar"
    >
      <svg aria-hidden="true" className="profile-progress-ring__svg" viewBox="0 0 100 100">
        <circle className="profile-progress-ring__track" cx="50" cy="50" r={radius} />
        <circle
          className="profile-progress-ring__value"
          cx="50"
          cy="50"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={ringStyle}
        />
      </svg>
      <span className="profile-progress-ring__label">{progress}%</span>
    </div>
  );
}
