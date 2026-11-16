# Coding Standards

Project: Address Book — Extreme Programming assignment  
Student: Liu Peikun (刘培坤), 832401213  
Work mode: Individual project

## 1. Scope and organization

- Keep the deliverable buildless: semantic HTML, CSS and browser JavaScript modules.
- Keep contact validation and spreadsheet conversion in `dist/scripts/core.mjs`. These functions must not read the DOM or browser storage.
- Keep event handling, rendering, file selection and persistence in `dist/scripts/app.js`.
- Keep external library files in `dist/vendor/` and record their source and license. Do not load application dependencies from a remote CDN at runtime.
- Do not commit credentials, browser session data, real address books or generated dependency directories.

## 2. Style and names

- Use UTF-8, two-space indentation and a final newline.
- Use `const` unless reassignment is necessary; avoid mutable global variables.
- Use `camelCase` for functions and variables, `PascalCase` for classes, and `UPPER_SNAKE_CASE` for constants.
- Give functions task-oriented names such as `validateContact` or `exportContacts`.
- Use JavaScript modules with explicit imports and exports.
- Prefer small functions with one clear responsibility. Explain non-obvious decisions in comments; do not repeat the code in prose.
- Use semantic HTML elements and descriptive CSS class names. Keep presentation in the stylesheet.

## 3. Contact data and validation

- Require a non-empty contact name and trim user-entered text.
- Store repeated contact methods as arrays rather than delimiter-dependent free text.
- Preserve phone numbers as text so that leading zeros, `+` prefixes and long values survive spreadsheet round trips.
- Validate imported values through the same domain rules used by the editor.
- Report an invalid workbook clearly. Validate all rows before adding any imported contacts so that a failed import cannot leave a partial result.
- Keep duplicate-handling behavior explicit in the interface and documentation; do not silently overwrite a contact.
- Do not invent realistic personal contact details for examples. Clearly label sample contacts as fictional.

## 4. Rendering, accessibility and safety

- Treat names, notes and imported spreadsheet cells as untrusted text.
- Use `textContent`, DOM creation and form value properties for user-entered content. Never interpolate that content into `innerHTML`, inline event handlers or executable URLs.
- If fixed HTML templates are used, keep their contents developer-authored and insert user data separately.
- Use visible labels for inputs, accessible names for icon buttons and a visible keyboard focus style.
- Support keyboard operation of dialogs, save/cancel actions and filters.
- Show success, validation and storage errors using understandable status messages.
- Render acceptably on narrow screens without hiding essential actions.
- Do not describe browser-local storage as an authenticated server database or cloud synchronization service.

## 5. Spreadsheet rules

- Export a real `.xlsx` workbook with one contact per row and one information category per column.
- Use stable headers and JSON array strings for repeated methods; do not split arbitrary text on commas.
- Export user text as string cells, not spreadsheet formulas.
- Preserve the favorite flag during export/import.
- Reject missing required columns and invalid row data with actionable feedback.
- Enforce the application's import size limit before parsing.
- Keep the template consistent with the import validator and export schema.

## 6. Verification

- Use meaningful tests for domain validation, Excel row conversion, repeated values, invalid imports and export/import round trips.
- Use the Node.js built-in test runner for pure JavaScript tests; keep tests independent of the UI implementation.
- Check the running interface for contact creation, editing, deletion, favorites, search, refresh persistence and workbook import/export.
- Capture screenshots and a running demonstration from the real application.
- Record the checks actually run. Never report a test, deployment or demonstration as successful before verifying its result.

## 7. Git workflow

- Make meaningful commits corresponding to actual implementation or documentation changes.
- Write commit messages that identify the change, for example `feat: add contact favorites` or `docs: explain Excel format`.
- Do not backdate commits, invent collaboration or divide one unchanged file into empty commits to simulate development history.
- Use a feature branch and pull request for reviewable changes. An individual author can use this workflow without claiming another reviewer participated.
- Publish a release only for a verified project state. Include concise release notes and known limitations.
- Derive contributor counts from the real repository history and state which branch was counted.

## 8. Academic reporting

- Identify the author and individual work mode consistently in the blog and repository.
- Record PSP estimates separately from actual time. If an estimate was reconstructed after work, label it as retrospective rather than presenting it as a prior prediction.
- Do not claim an upstream fork if no starter repository was assigned. Explain the use of an original repository instead.
- Do not claim cloud deployment credit for a `localhost` URL.
