# ZAMIN FK Issues Log

## Issue #1: Black/Empty Canvas (FIXED)
**Symptom**: 3D stadium/city canvas not rendering - blank black screen  
**Root Cause**: Z-index layering issues from UI redesign attempts using `position:fixed` with `z-index:15` on overlay elements  
**Failed Attempts**:
- Added `#sidePanel` with `z-index:15` (blocked canvas rendering)
- Added `#panelToggle` with `position:absolute; left:-50px` (kept off-screen)
- Multiple CSS-based UI additions created layering conflicts

**Solution**: 
- Restored backup files (known working state)
- Canvas CSS: `#c { position:fixed; inset:0; z-index:0 }` (default, behind UI)
- UI elements: `.ui { position:fixed; z-index:5 }` (above canvas)
- Database schema includes profession system + admin logging
- All fixed positioning elements kept at z-index ≤ 25

**Prevention**: Never add fixed-positioned overlays with z-index > canvas. Use existing sheet/modal system.

---

## Issue #2: TypeError - bot.initFeedback is not a function (FIXED)
**Symptom**: Render deployment crash on server startup  
**File**: `ZAMIN_FK/web/city/server.js:77`  
**Error**: `TypeError: bot.initFeedback is not a function`

**Root Cause**: During backup restoration, `bot.js` was missing:
- `initFeedback(db)` function definition
- `logToAdminChannel(title, details)` function definition
- `saveFeedback()` function definition
- `isFeedback()` regex constant
- Exports for these functions

**Solution**:
- Added `initFeedback(db)` - creates feedback table on startup
- Added `saveFeedback(tgId, username, text)` - saves user feedback + notifies admin
- Added `logToAdminChannel(title, details)` - logs actions to admin channel
- Added `isFeedback()` regex for `/feedback` command detection
- Updated `replyFor()` to handle feedback messages
- Added `ADMIN_ID`, `ADMIN_CHANNEL` environment variables
- Updated `module.exports` to include `initFeedback` and `logToAdminChannel`

**Files Modified**: `ZAMIN_FK/web/city/bot.js`  
**Verified**: Both bot.js and server.js pass Node.js syntax check

---

## Issue #3: Missing Admin Channel Integration (RESOLVED)
**Symptom**: Admin logging calls in server.js had no function to call  
**Root Cause**: Backup restoration didn't include complete admin channel setup from commit 423249c

**Solution**:
- Merged admin channel logging from commit 423249c
- Added profession system database schema (applications table)
- Added HTML escaping in economy.js for security
- Pass `logToAdminChannel` and `nickOf` to economy.init
- All user actions now logged: new houses, seats, profession applications, approvals, job shifts, bonuses, upgrades, purchases

---

## Prevention Checklist

### Before UI Changes
- [ ] Never use `z-index > 5` for fixed positioned elements  
- [ ] Canvas must stay at default z-index (0)
- [ ] Use existing `.ui` class for standard UI elements
- [ ] Test canvas rendering in browser immediately

### Before Backup Restore
- [ ] Check git history for missing functions
- [ ] Verify all exports in module.exports
- [ ] Run Node.js syntax check: `node -c file.js`
- [ ] Test all bot.* method calls are exported

### Before Deployment
- [ ] Verify environment variables are set on Render
- [ ] Check database schema migrations (if not exists)
- [ ] Ensure all feedback system tables exist
- [ ] Test /start, /feedback, /id commands in Telegram

---

## Related Commits
- f374479: Fix: restore missing feedback and admin channel functions
- f794606: Restore backup with admin channel logging
- 423249c: Add admin channel logging for all user actions

## Environment Variables Required
```
BOT_TOKEN=<your_bot_token>
DATABASE_URL=postgresql://...
ADMIN_CHANNEL=<telegram_channel_id>
ADMIN_IDS=<comma_separated_user_ids>
PUBLIC_URL=https://... (Render: RENDER_EXTERNAL_URL)
WEBAPP_URL=https://... (Mini App URL)
```

