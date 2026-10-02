# Manual QA Checklist

| ID | Test | Steps | Expected Result |
|----|------|-------|-----------------|
| 01 | Invite param injection | Open `index.html?name=<script>alert(1)</script>` | The name displays exactly as `<script>alert(1)</script>` as text, no alert fires. CSP blocks inline execution. |
| 02 | Empty invite param | Open `index.html` without parameters | Headline defaults to "You're invited." |
| 03 | Responsive Navigation | Resize window to mobile width (<768px) | Desktop links hide, hamburger menu appears. Clicking opens full-screen glass menu. |
| 04 | Scroll Spy | Scroll down the page | Navigation links become highlighted dynamically as their sections enter the viewport. |
| 05 | Theme Toggle | Click the sun/moon icon in nav | Page background and text invert smoothly. Icon changes. State is persisted in localStorage. |
| 06 | Compare Drawer | In "Weapons" section, check 2 tools | Bottom drawer slides up showing a comparison table of the selected tools. |
| 07 | Compare Limit | Try to check a 4th tool in "Weapons" | Checkbox is rejected (unchecked) and an alert warns "Max 3 tools". |
| 08 | Leaderboard Sort | In Leaderboard, change sort dropdown | Table resorts instantly based on Score, Speed, or Tests Passed. Podium updates. |
| 09 | Certificate Gen | Click "Certificate" on a player row | A PNG downloads containing the player's name, score, and an animated-style canvas background. |
| 10 | Konami Code | Type Up Up Down Down Left Right L R B A | Background turns deep purple, gradient turns red/gold, alert says "GOD MODE". |
| 11 | Reduced Motion | Enable OS-level "Reduce Motion", reload | Confetti doesn't fire, logo draw doesn't animate, GSAP scrolls are disabled, terminal animation is hidden. |
| 12 | Invite Builder | Open `invite.html`, paste names | Live preview updates with first name. "Generate Links" outputs valid URLs. "Copy All" copies cleanly. |
| 13 | Score Script | Run `node scripts/score.js` locally | Reads `players.json`, outputs updated `results.json` mapping metrics correctly without crashing. |
