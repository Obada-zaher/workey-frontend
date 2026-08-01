"use client";

import type { CSSProperties } from "react";

export function AuthStatement({
  compact = false,
  statement,
  supportingText,
}: {
  compact?: boolean;
  statement: string[];
  supportingText: string;
}) {
  return (
    <div className={`auth-statement${compact ? " auth-statement--compact" : ""}`}>
      <p aria-hidden="true" className="auth-statement__visual">
        {statement.map((line, lineIndex) => (
          <span className="auth-statement__line" key={line}>
            {line.split(" ").map((word, lineWordIndex) => {
              const previousWordCount = statement
                .slice(0, lineIndex)
                .reduce((count, previousLine) => count + previousLine.split(" ").length, 0);
              const delay = (previousWordCount + lineWordIndex) * 60;

              return (
                <span
                  key={`${lineIndex}-${lineWordIndex}`}
                >
                  <span
                    className="auth-statement__word"
                    style={{ "--auth-statement-delay": `${delay}ms` } as CSSProperties}
                  >
                    {word}
                  </span>
                  {lineWordIndex < line.split(" ").length - 1 ? " " : null}
                </span>
              );
            })}
          </span>
        ))}
      </p>
      <p className="auth-statement__accessible">{statement.join(" ")}</p>
      <p className="auth-statement__support">{supportingText}</p>
    </div>
  );
}
