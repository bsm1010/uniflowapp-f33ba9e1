export function renderErrorPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Fennecly — Server error</title>
    <style>
      :root{color-scheme:light dark;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#fafafa;color:#18181b}
      @media (prefers-color-scheme:dark){:root{background:#09090b;color:#fafafa}.panel{border-color:#27272a;background:#18181b}.muted{color:#a1a1aa}.ghost{border-color:#3f3f46;color:#fafafa}}
      body{min-height:100vh;margin:0;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at top,#ede9fe,transparent 34%),var(--background,#fafafa)}
      .panel{max-width:520px;border:1px solid #e4e4e7;background:rgba(255,255,255,.86);border-radius:18px;padding:32px;box-shadow:0 24px 70px rgba(24,24,27,.12);text-align:center}
      h1{margin:0;font-size:28px;line-height:1.15;letter-spacing:0;font-weight:800}
      p{margin:12px 0 0;line-height:1.65}.muted{color:#71717a}.actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:24px}
      a,button{appearance:none;border:0;border-radius:10px;padding:11px 16px;font-weight:700;font-size:14px;text-decoration:none;cursor:pointer}.primary{background:#7c3aed;color:#fff}.ghost{background:transparent;border:1px solid #d4d4d8;color:#18181b}
    </style>
  </head>
  <body>
    <main class="panel">
      <h1>Something went wrong</h1>
      <p class="muted">The server hit an unexpected error. Please refresh the page or return home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Refresh</button>
        <a class="ghost" href="/">Go home</a>
      </div>
    </main>
  </body>
</html>`;
}
