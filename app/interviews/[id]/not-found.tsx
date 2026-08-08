import Link from "next/link";
export default function InterviewNotFound() { return <div className="interview-route-state"><span aria-hidden="true">!</span><h1>Interview not found</h1><p>This interview does not exist or is not available to your account.</p><Link className="ui-button" href="/applications">Back to applications</Link></div>; }
