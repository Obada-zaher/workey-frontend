import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Logo } from "@/components/ui/logo";
import { AuthStatement } from "./auth-statement";

export function AuthShell({
  children,
  description,
  eyebrow = "WORKEY ACCOUNT",
  statement,
  supportingText,
  title,
}: {
  children: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  statement: string[];
  supportingText: string;
  title: string;
}) {
  return (
    <main className="auth-shell">
      <aside className="auth-shell__visual" aria-label="Workey career journey">
        <div className="auth-shell__visual-utility">
          <Logo href="/" />
        </div>
        <div className="auth-shell__visual-content">
          <AuthStatement statement={statement} supportingText={supportingText} />
        </div>
        <div aria-hidden="true" className="auth-shell__motif">
          <span className="auth-shell__motif-orb auth-shell__motif-orb--one" />
          <span className="auth-shell__motif-orb auth-shell__motif-orb--two" />
          <span className="auth-shell__motif-line" />
        </div>
      </aside>

      <section className="auth-shell__form-panel">
        <div className="auth-shell__form-utility">
          <Logo href="/" size="small" />
          <ThemeToggle />
        </div>
        <div className="auth-form-content">
          <div className="auth-shell__mobile-statement">
            <AuthStatement compact statement={statement} supportingText={supportingText} />
          </div>
          <div className="auth-form-content__intro">
            <p className="auth-form-content__eyebrow">{eyebrow}</p>
            <h1 className="type-heading-1 text-text-primary">{title}</h1>
            {description ? <div className="auth-form-content__description">{description}</div> : null}
          </div>
          <div className="auth-form-content__body">{children}</div>
        </div>
      </section>
    </main>
  );
}
