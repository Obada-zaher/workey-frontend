export default function AccountLoading() {
  return <div aria-label="Loading Home" className="max-w-6xl" role="status"><div className="skeleton h-9 w-52" /><div className="skeleton mt-3 h-5 w-80 max-w-full" /><div className="skeleton mt-8 h-36 w-full" /><div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <div className="skeleton h-72" key={item} />)}</div><span className="sr-only">Loading Home.</span></div>;
}
