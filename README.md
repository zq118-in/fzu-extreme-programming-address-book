# LinkBook — Extreme Programming Address Book

Software Engineering (FZU–MU), **Liu Peikun / 刘培坤, 832401213**. Individual assignment. Implementation, tests, media and Git history are provided for inspection.

## Run

Install Node.js 20 or newer. No dependency installation or build is required.

```sh
npm start
```

Open http://127.0.0.1:4173. Keep the same browser and origin to retain local records. ES modules require HTTP, so do not open index.html directly using file://.

```sh
npm test
```

## Features

- Create, view, edit, delete and search contacts.
- Favorite contacts and filter the favorites list.
- Multiple phone numbers, email addresses, social accounts and physical addresses per contact.
- Import and export genuine `.xlsx` workbooks, one contact per row.
- JSON arrays in separate category columns preserve multiple values without delimiter ambiguity.
- Validate the entire workbook before importing; skip exact contact duplicates.
- Local browser persistence, responsive layout, accessible forms and clear feedback.
- Explicitly fictional sample data, labeled in the interface.

## Project map

```text
dist/                 Static application; deploy this directory
dist/scripts/core.mjs         Contact rules and Excel data mapping
dist/scripts/app.js           Interface and persistence
dist/vendor/          Pinned SheetJS CE 0.20.3 and its Apache-2.0 license
tests/                Node.js unit and workbook round-trip tests
docs/                 Architecture, coding standards and assignment blog
server.mjs            Dependency-free local HTTP server
```

Read [coding standards](docs/CODING_STANDARDS.md) and [architecture](docs/ARCHITECTURE.md). SheetJS is vendored from its official distribution at https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js and runs locally; no runtime CDN request is made.

## Scope and privacy

Contact data is stored in localStorage in this browser, not uploaded to a server. This prototype does not provide authentication, encryption, multi-device sync or shared databases. Export backups before clearing browser data. The repository and demonstration contain fictional contacts only.

No upstream starter repository was supplied for this assignment; this is an original repository. The branch/PR/release workflow is used without claiming a fork. Optional deployment credit is not claimed for local execution or repository publication alone.

