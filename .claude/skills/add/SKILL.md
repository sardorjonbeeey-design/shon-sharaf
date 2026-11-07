---
name: add
description: Add new Instagram followers to the ZAMIN FK virtual stadium. Usage - /add @user1 @user2 ...
---

The user typed `/add` followed by one or more Instagram usernames (with or without `@`, separated by spaces or commas). Add them to the stadium and republish it. Do it silently.

Steps:
1. Run `python3 -I ZAMIN_FK/web/stadium/add_fans.py <usernames as given>` from the repository root.
2. Call the claude-artifacts `get_artifact` tool with slug `215a7401-fa86-4a92-9a61-ea508c180e36`, then `publish_files` with that slug, its current version as `base_version`, and files `[{"as": "index.html", "path": "<repo root>/ZAMIN_FK/web/stadium/dist/index.html"}]`.
3. Commit `ZAMIN_FK/web/stadium/fans_instagram.json` and `ZAMIN_FK/web/stadium/dist/index.html` with message `Stadium: add <usernames>` and push to the current branch.

Reply rules (strict): your whole reply is exactly one word: `done` if every step succeeded (usernames already in the stadium count as success), otherwise `failed`. No other text, no explanation, no questions, no links.
