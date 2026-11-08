# Chrome Web Store listing: copy and paste

Everything you need to type into the Developer Dashboard. Each field below is labelled with the dashboard tab it belongs to.

---

## Package tab

**Upload:** `dist/weeks-1.0.0.zip` (build with `npm run package`, or download it from the GitHub release).

The name, summary and icon come from `extension/manifest.json`:

- **Name:** Weeks: Life in Weeks
- **Summary (132 chars max):** Your life in weeks on every new tab: the weeks you've lived, the weeks you have left, and the rules you want to live by.

---

## Store listing tab

### Description

```
Your life, one week at a time.

Weeks replaces your new tab page with a grid of your life. Each square is one week. Each row is one year. The weeks you've lived are filled in. The weeks you have left are empty.

Every Sunday (or Monday, if you prefer) another square fills in. For the first two days of the new week it blinks slowly: a quiet reminder that you are one week older.

RULES TO LIVE BY
Write up to twelve short rules for the life you want. "In bed by 11 pm." "Phone stays out of the bedroom." "The people I love get my best." One of them appears on every new tab.

CALM BY DESIGN
White background, black lines, square corners. No streaks, no notifications, no ads.

PRIVATE BY DESIGN
• No account, no sign-up
• Your birthday and rules stay in your Chrome profile
• No servers, no analytics, no network requests
• One permission: storage
• Delete everything from Settings at any time

HOW IT WORKS
• Enter your date of birth and a life expectancy (80 years by default)
• Choose whether a new week starts on Sunday or Monday
• Hover any square to see the dates it covers
• Switch between Weeks and Rules in the bottom-right corner

Inspired by Tim Urban's "Your Life in Weeks".
```

### Category

**Well-being**, under Lifestyle. If that category isn't in the list, use **Workflow & Planning**, under Productivity.

### Language

English

### Graphic assets

| Field | File | Required |
|---|---|---|
| Store icon (128×128) | `extension/icons/icon128.png` | Yes |
| Screenshot 1 | `store/screenshots/01-weeks.png` | Yes (at least one) |
| Screenshot 2 | `store/screenshots/02-rules.png` | |
| Screenshot 3 | `store/screenshots/03-detail.png` | |
| Screenshot 4 | `store/screenshots/04-settings.png` | |
| Screenshot 5 | `store/screenshots/05-setup.png` | |
| Small promo tile (440×280) | `store/promo/small-tile-440x280.png` | Optional, recommended |
| Marquee promo tile (1400×560) | `store/promo/marquee-1400x560.png` | Optional |

All screenshots are 1280×800 PNGs with no transparency and use sample data, not a real person.

### Additional fields

- **Homepage URL:** `https://github.com/authenticryan/weeks`
- **Support URL:** `https://github.com/authenticryan/weeks/issues`
- **Mature content:** No

---

## Privacy tab

**Single purpose description**

```
Weeks replaces the new tab page with a view of the user's life in weeks (weeks lived and weeks left), along with a short list of personal rules the user writes.
```

**Permission justification: `storage`**

```
Saves the user's date of birth, life expectancy, week-start preference and up to 12 short rules so the new tab page can display them. Data is kept in chrome.storage.sync in the user's own Chrome profile. Nothing is sent to any server.
```

**Are you using remote code?** No, I am not using remote code.

**Data usage: what user data do you collect?**

Google says data must be disclosed even if it only stays on the user's device. To be safe, tick:

- [x] **Personally identifiable information.** This covers the date of birth, which works out to the user's age.

Leave the other categories unticked: no health, financial, authentication, location, web history, user activity or website content. The rules are notes the user writes for themselves. If the dashboard shows a category clearly meant for user-written text, tick it as well. Over-disclosing is safer than under-disclosing.

**Certifications:** tick all three.

- [x] I do not sell or transfer user data to third parties, outside of the approved use cases
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL**

```
https://github.com/authenticryan/weeks/blob/main/PRIVACY.md
```

---

## Distribution tab

- **Payments:** Free
- **Visibility:** Public
- **Regions:** All regions

---

## Test instructions tab (for the reviewer)

```
No account or login is needed.
1. Open a new tab. Enter any date of birth and click "Show my weeks".
2. The grid shows weeks lived (filled) and weeks left (empty). Hover any square to see its dates.
3. Click "Rules" (bottom right) and type in any cell. It saves automatically. Return to "Weeks" and open a new tab to see a rule shown in the left column.
4. "Settings" (bottom left) lets you change the inputs or delete all data.
The extension makes no network requests and uses only the storage permission.
```
