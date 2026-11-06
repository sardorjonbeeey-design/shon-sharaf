# Virtual stand (tribuna)

`python3 build_stadium.py fans.json out.png --new N`

- fans.json — follow order: `[{"username": "...", "consent": true}]`. The builder saves each fan's `look` back into the file, so a fan keeps the same look forever.
- Seat and look come from the username (sha256), so they stay the same every day.
- Up to 55 fans at full size; above that the crowd shrinks to fit (down to 45%); the rest are shown as "+N muxlis".
- Username tags are shown only for the newest N fans and only when `consent` is true (rule from the handoff: ask permission before showing a username).
- The fan count badge is always labelled VIRTUAL.
