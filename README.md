# Shvithi Portfolio

A responsive, static personal portfolio using a dark navy and warm beige editorial style. No backend, database, build step, or framework is required. It can be deployed directly to Vercel.

## Before publishing
1. Add your portrait as `assets/shvithi-photo.jpg`. The layout will show a designed placeholder until the image is added.
2. Open `script.js` and set `APP_URL` to your mobile app's live page, store listing, demo, or repository.
3. Add your CV PDF as `assets/shvithi-cv.pdf`. The CV section is already a separate page at `cv.html`.
4. Review the About and Skills text to make sure it reflects your current details.

## Preview locally
Open `index.html` in a browser. For a local server, run `python -m http.server 8000` in this folder and visit `http://localhost:8000`.

## Deploy to Vercel
1. Create a GitHub repository and upload the contents of this folder.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Framework preset: **Other**. Build command: leave blank. Output directory: `.` (or leave default if Vercel detects the static site).
4. Deploy.

The website uses Google Fonts from the web. It has no backend and does not collect or store visitor data. The cursor trail is disabled on touch devices and when reduced motion is preferred.
