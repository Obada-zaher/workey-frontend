export const otpLength = 6;
export const staticDemoOtp = "000000";
export function maskEmail(email: string) { const [local, domain] = email.split("@"); if (!local || !domain) return "your email address"; return `${local.slice(0, Math.min(2, local.length))}${"*".repeat(Math.max(3, local.length - 2))}@${domain}`; }
