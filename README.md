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

Create a local `.env` file first:

```bash
NVIDIA_API_KEY=PASTE_KEY_HERE
NVIDIA_MODEL=moonshotai/kimi-k2-instruct
PORT=5174
```

Replace `PASTE_KEY_HERE` with your Nvidia API key.

```bash
npm run dev
```

Then open `http://127.0.0.1:5174`.

## Version Control Notes

This project is ready for Git version control. The `.gitignore` keeps local files, logs, build output, dependencies, and environment files out of commits.

Do not commit real API keys. Keep the Nvidia key in `.env`; `.gitignore` prevents that file from being committed.
