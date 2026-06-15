# Agent Context

## Git & Deployment

- GitHub remote: `https://github.com/bsm1010/uniflowapp-f33ba9e1`
- Default branch on GitHub is **`main`** — always push to `main`, NOT `master`
- Lovable.dev pulls from the `main` branch for deployments
- Both `main` and `master` branches exist locally; keep `main` as the primary sync target
- Current commit at setup: `7a59e59`

## Commands

- `npm run dev` — rebuilds route tree and starts dev server
- `npm run build` — full build (client passes, SSR may time out locally but works on Vercel)
- `git push origin master:main` — push local master to remote main (with `--force` if needed)
