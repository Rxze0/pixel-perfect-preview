<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- SitABit sample data and ranking/allergen logic live in src/lib/sitabit.ts, UI in src/routes/index.tsx; styles are the prototype CSS ported verbatim into src/styles.css — keeps parity with the original prototype.
- Screen motion uses progressive browser view transitions with CSS entrance fallback and reduced-motion overrides — keeps navigation smooth without a runtime animation dependency.
- Auth is demo-only (src/lib/auth.tsx, localStorage session + accounts); gate member features with useAuth().requireUser() — keeps the prototype backend-free until real accounts are added.
