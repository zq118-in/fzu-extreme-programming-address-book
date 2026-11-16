# Linbook v1.0.0

Release notes prepared for the first runnable assignment version. Release publication is verified separately on GitHub.

## Features

- Create, view, edit and delete address-book contacts.
- Bookmark important contacts and filter the favorites view.
- Store multiple phone numbers, emails, social accounts and addresses per contact.
- Search contact names, organizations, notes and all supported contact methods.
- Persist contacts in browser-local storage, including favorite status.
- Export a genuine `.xlsx` workbook with one contact per row.
- Import the first worksheet of a matching workbook, with a validation preview and explicit confirmation.
- Preserve repeated values using JSON string arrays and retain leading-zero phone numbers.
- Skip exact duplicates and reject invalid rows atomically, without overwriting existing contacts.
- Reject formula-containing worksheets and oversized imports with visible feedback.
- Run locally with a dependency-free Node.js preview server; the Excel library and license are bundled.

## Verification

- All 10 Node.js tests pass, including a real XLSX round trip with the bundled library.
- [GitHub Actions check completed successfully](https://github.com/zq118-in/fzu-extreme-programming-address-book/actions/runs/43838828336).
- [Implementation PR #1 was merged](https://github.com/zq118-in/fzu-extreme-programming-address-book/pull/1), preserving the implementation and verification commits.

## Run

Requires Node.js 20 or later. From the downloaded project directory:

```bash
npm start
```

Open `http://127.0.0.1:4173`. Run `npm test` for the automated checks.

## Limits

The address book is browser-local and single-user. It has no backend, authentication or cross-device sync. Export workbooks for portable backups before clearing browser storage.

Only `.xlsx` imports are supported: up to 5 MB, 1,000 contacts per import and 10,000 stored contacts overall. Only the first worksheet is read. Headers must match the documented schema; method cells contain JSON string arrays and the favorite column is `0` or `1`. Public contact information is preserved, while imported internal IDs and timestamps are regenerated.

This release does not claim cloud deployment or course-task submission.
