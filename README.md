# AWS CCP Study Site

A static AWS Cloud Practitioner study reference app.

## Project Structure

```text
.
├── index.html
├── assets
│   ├── css
│   │   └── styles.css
│   └── js
│       ├── app.js
│       └── theme-init.js
├── package.json
└── README.md
```

- `index.html` contains the page structure and links to the extracted assets.
- `assets/css/styles.css` contains the site styling.
- `assets/js/theme-init.js` applies the saved color theme early during page load.
- `assets/js/app.js` contains the application data and interactions.

## Run Locally

```bash
npm run dev
```

Then open `http://127.0.0.1:5174`.

## Version Control Notes

This project is ready for Git version control. The `.gitignore` keeps local files, logs, build output, dependencies, and environment files out of commits.

Do not commit real API keys. The current Study Buddy key value is still the existing placeholder in `assets/js/app.js`.
