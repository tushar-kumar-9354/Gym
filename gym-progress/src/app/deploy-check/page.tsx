export const dynamic = 'force-static';

export default function DeployCheckPage() {
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME ?? new Date().toISOString();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-700 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/20">
        <h1 className="text-4xl font-bold text-cyan-300">Deploy Check</h1>
        <p className="mt-4 text-slate-300">
          This page is built at deploy time. If you push a change and redeploy, the build time should update.
        </p>
        <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-950 p-6 text-slate-100">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Build marker</p>
          <p className="mt-2 text-xl font-semibold text-cyan-200">{buildTime}</p>
        </div>
        <div className="mt-10 space-y-4 text-slate-300">
          <p>Steps to confirm deploy updates:</p>
          <ol className="list-decimal list-inside rounded-xl border border-slate-700 bg-slate-900 p-4 text-slate-200">
            <li>Open this page at <code className="rounded bg-slate-800 px-2 py-1">/deploy-check</code>.</li>
            <li>Push a new commit and deploy again.</li>
            <li>Reload this page and verify the build time has changed.</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
