![Version](https://img.shields.io/badge/version-0.0.3-orange.svg?style=for-the-badge)

# Form To Slack

This lightweight JS app deployed on [Vercel](https://vercel.com/) sends form submissions directly to
Slack as messages.

---

## Development and Deployment

Install vercel-cli:

```bash
brew install vercel-cli
```

Then login;

```bash
vercel login
```

Run locally:

```bash
npm install
vercel dev
```

To deploy production; just `push` the code!

---

## Rake Tasks

```bash
rake -T

rake release[revision]  # bump version, default: patch, available: major,minor,patch
rake run:server         # run server
```

---

## API Endpoints

- http://localhost:3000/api/slack
- http://localhost:3000/api/health

