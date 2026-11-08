# Publishing to the Chrome Web Store

This guide covers both the first submission and later updates. All the copy and image files referenced here are in [`store/listing.md`](../store/listing.md).

> Do the dashboard steps yourself, in your own browser. Google's developer program expects a person to handle account and submission steps.

## 0. Build the package

```sh
npm test          # 9 tests, should all pass
npm run package   # creates dist/weeks-1.0.0.zip
```

You can also download `weeks-1.0.0.zip` from the [v1.0.0 GitHub release](https://github.com/authenticryan/weeks/releases/tag/v1.0.0). CI builds the zip from the tagged commit.

Before you upload, test the exact build:

1. Unzip it into a temporary folder.
2. In `chrome://extensions`, choose **Load unpacked** and select that folder.
3. Open a new tab and click through Weeks, Rules and Settings.
4. Remove the unpacked copy when you're done.

## 1. Set up the developer account (one time)

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) and sign in with the Google account you want to publish under.
2. Accept the developer agreement and pay the one-time registration fee (US$5).
3. Turn on **2-Step Verification** for that Google account if it isn't on already. Publishing requires it.
4. In **Account**, set your publisher name. It appears on the listing, so "Ryan Dsouza" works. Then verify your contact email.
5. If you're asked about **trader status** (an EU requirement), a free personal project with no revenue is normally "non-trader". If you later charge money or publish as a business, update this.

## 2. Create the item

1. Click **New item** and upload `dist/weeks-1.0.0.zip`.
2. The dashboard reads the name, summary, version and icon from the manifest.

## 3. Fill in each tab

Copy each field from [`store/listing.md`](../store/listing.md):

| Tab | What to do |
|---|---|
| **Store listing** | Paste the description. Pick the category and language. Upload the icon, the 5 screenshots and both promo tiles. Add the homepage and support URLs. |
| **Privacy** | Paste the single purpose and the `storage` justification. Answer **No** to remote code. Tick **Personally identifiable information**. Tick all three certifications. Paste the privacy policy URL. |
| **Distribution** | Free, Public, All regions. |
| **Test instructions** | Paste the reviewer steps. Optional, but it speeds up review. |

The dashboard won't let you submit until every required field is green.

## 4. Submit

1. Click **Submit for review**.
2. Choose whether to publish automatically once it's approved, or to publish manually yourself afterwards. Manual gives you control of launch timing.
3. Review times vary, from hours to a couple of weeks. First submissions from a new account usually take longest. Google will email you when it's done.

If it's rejected, the email names the policy. The usual causes are a vague single purpose, a missing privacy disclosure, or a permission that isn't explained. All three are covered above. Fix the issue, bump the patch version (see below) and resubmit.

## 5. After approval

1. Copy the store URL (`https://chromewebstore.google.com/detail/<id>`).
2. Add it to the top of `README.md` as the install link and commit.
3. Optionally, set the GitHub repo's website to the store URL:
   `gh repo edit authenticryan/weeks --homepage <store url>`

---

## Shipping an update

The Chrome Web Store rejects an upload unless its `version` is higher than the live one. The manifest is the source of truth for the version.

1. Make the change. Run `npm test`, then load the extension unpacked and check it.
2. Pick the new version using [SemVer](https://semver.org/):
   - **Patch** (1.0.1): fixes and copy tweaks
   - **Minor** (1.1.0): new features
   - **Major** (2.0.0): changes to how saved data is stored
3. Update the version in **both** `extension/manifest.json` and `package.json`.
4. In `CHANGELOG.md`, move the items under `[Unreleased]` into a new `## [x.y.z] - YYYY-MM-DD` section, and add the compare link at the bottom.
5. If the UI changed, rebuild the store images with `npm run assets`.
6. Commit, then tag and push:
   ```sh
   git commit -am "Release 1.0.1"
   git tag v1.0.1
   git push && git push --tags
   ```
   CI runs the tests, builds the zip and creates a GitHub release with the changelog notes. The release fails if the tag doesn't match the manifest version.
7. In the dashboard, open the item, go to **Package** and click **Upload new package**. Upload the zip from the release, then **Submit for review**.
