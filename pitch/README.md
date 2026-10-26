# Pitch deck

Five-slide pitch for the Claude Impact Lab hackathon. The spoken script is in the speaker notes.

- [output/scribular-pitch.pptx](output/scribular-pitch.pptx): the editable deck; present from this file.
- [output/scribular-pitch-preview.pdf](output/scribular-pitch-preview.pdf): quick-look PDF, rendered from an HTML mirror of the generator. It approximates the PPTX layout and is not a PowerPoint render.
- [speaker-notes.md](speaker-notes.md): the script, slide by slide, extracted from the deck.
- [output/REVIEW.md](output/REVIEW.md): independent review findings and fixes.
- [src/build_deck.js](src/build_deck.js): the generator. To rebuild: \`cd pitch && npm ci && node src/build_deck.js\`. See [BUILD.md](BUILD.md).

Built with Anthropic's PPTX skill: https://skills.sh/anthropics/skills/pptx

## Evidence notes

- Survey: SBE Council, *Small Business Technology Use Survey*, March 2026, p.38, Q20; base of 425 AI-tool users. The survey does not support ranking privacy as the #1 concern, so the deck says "a major concern."
- The savings figures on the closing slide are illustrative goals, not measured results.
- The source survey PDF is not committed; cite it by the reference above.
