# Notify Plan & Usage Spec

## Product direction

Notify is a cloud note app with strong AI features. Core note-taking stays accessible on all plans, while AI-heavy workflows and extra storage are the main paid layers.

## Plan summary

### Free — $0/month

Best for casual note-taking and light AI use.

Included:

* Unlimited text notes
* Note basics: text, image, edit, voice, icon
* Favourite notes
* Note calendar
* 100 MB storage for image + voice attachments
* 50 AI credits / month
* Low daily AI cap
* Standard speed
* Basic AI actions:

  * Ask AI based on notes
  * Summary notes

Limits:

* AI credits reset monthly
* Daily AI usage cap is lower than paid plans
* Extra storage available at $1 / 100 MB

### Starter — $10/month

Best for regular users who want more AI without paying Pro price.

Included:

* Unlimited text notes
* Note basics: text, image, edit, voice, icon
* Favourite notes
* Note calendar
* 500 MB storage for image + voice attachments
* 250 AI credits / month
* Medium daily AI cap
* Faster processing than Free
* Advanced AI actions:

  * Ask AI based on notes
  * Summary notes
  * Read note aloud

Limits:

* AI credits reset monthly
* Daily AI cap is lower than Pro
* Extra storage available at $1 / 100 MB

### Pro — $20/month

Best for heavy AI usage and power users.

Included:

* Unlimited text notes
* Note basics: text, image, edit, voice, icon
* Favourite notes
* Note calendar
* 5 GB storage for image + voice attachments
* 1000 AI credits / month
* High daily AI cap
* Priority processing
* Full AI suite:

  * Ask AI based on notes
  * Summary notes
  * Read note aloud
  * Speech mode with Whisper
  * Mindmap generation from notes
* Bulk AI actions
* Best-in-class speed

Limits:

* AI credits reset monthly
* Daily cap is much higher than Free and Starter
* Extra storage available if needed

## Usage model

### AI credit usage

Credit should be consumed by AI-based tasks only.

Suggested starting weights:

* Ask AI based on note: 1–3 credits
* Summary note: 2–5 credits
* Read note aloud: 1–2 credits
* Speech mode with Whisper: 2–6 credits depending on duration
* Mindmap generation: 5–12 credits depending on note size

### Storage usage

Storage applies only to attachments:

* Images
* Voice recordings

Suggested pricing:

* Extra storage: $1 / 100 MB

### Core note usage

Do not limit the number of notes on price tiers.
This keeps the product simple and avoids punishing users for storing plain text.

## Upgrade logic

### Free to Starter

Upgrade when a user:

* Runs out of monthly AI credits
* Uses AI more than a few times a week
* Wants more storage for images or voice notes

### Starter to Pro

Upgrade when a user:

* Uses mindmap or speech mode often
* Needs large AI volume
* Wants priority speed and higher daily caps
* Hits storage limits often

## Recommended UX rules

### Show usage clearly

Display:

* Monthly AI credits used / remaining
* Daily AI cap if relevant
* Storage used / available

### Keep paywall messaging specific

Use copy like:

* “Upgrade to generate more mindmaps.”
* “You’ve used all monthly AI credits.”
* “Add storage for more voice and image notes.”

### Avoid hard deleting user data

If a user downgrades, keep existing notes and attachments.
Only restrict future usage when limits are exceeded.

## Pricing logic notes

* Free should feel useful, not broken.
* Starter should feel like the best value for everyday users.
* Pro should feel like the plan for heavy AI and fast workflows.
* Storage should be separate enough to monetize, but not so aggressive that it feels petty.

## Suggested final positioning

* Free = personal notes + light AI
* Starter = regular AI user
* Pro = power AI user
