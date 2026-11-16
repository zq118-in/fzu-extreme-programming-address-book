# Test Report

Project: Linbook address book — Extreme Programming assignment  
Student: Liu Peikun (刘培坤), 832401213  
Verification date: November 16, 2026  
Scope: local application, domain rules, real Excel workbooks and browser interactions

## Automated checks

Run from the project root:

```sh
npm test
node --check dist/scripts/app.js
```

Result: **10 tests passed, 0 failed**. JavaScript syntax checking also passed.

| Check | Result |
| --- | --- |
| Trim input, deduplicate repeated methods, preserve explicit favorite status | PASS |
| Preserve all public fields through worksheet-row conversion, including punctuation and Unicode | PASS |
| Accept reordered correct headers; reject missing or duplicate headers | PASS |
| Reject a bad later row without changing existing records or partially importing the workbook | PASS |
| Skip exact duplicates, disregard method ordering, retain changed same-name contacts as separate records | PASS |
| Reject invalid favorite flags, too many methods and non-string method values | PASS |
| Reject empty data and imports exceeding the row limit | PASS |
| Search across methods and notes; combine search with the favorites filter | PASS |
| Keep demonstration contacts explicitly fictional and export one contact per row | PASS |
| Write and read a genuine compressed XLSX using bundled SheetJS; preserve leading-zero phone strings and formula-like text as literal text | PASS |

The last test checks the actual workbook library rather than only testing an equivalent JSON transformation. It verifies that a note starting with `=` has no worksheet formula property.

## Browser checks

The following cases were completed against the running local application. All named contacts in this run were fictional test records.

| Browser case | Observed result | Evidence |
| --- | --- | --- |
| Open the application | Six clearly labeled sample contacts appear; totals and methods are visible | `media/frame-001.jpg` |
| Create Alex demo | Save two phone numbers, including a leading-zero value, plus an email, social account, address and favorite status | `media/frame-002.jpg` |
| Search for the saved contact | The new record appears in the search results | `media/frame-003.jpg` |
| Inspect complete contact details | Both phone values and the other methods are retained | `media/frame-004.jpg` |
| Edit a contact | Updated note is saved successfully | `media/frame-005.jpg` |
| Toggle favorite status and open favorites | Remove the favorite, add it again, and find it in the favorites view | `media/frame-006.jpg` |
| Export Excel | A real `.xlsx` file contains all seven contacts, one contact per row | `media/frame-007.jpg`, `media/demo-export.xlsx` |
| Inspect the exported workbook | The leading-zero phone value remains text and is preserved | `media/demo-export.xlsx` |
| Reimport the exported workbook | Preview detects seven exact duplicates and skips all seven | `media/frame-008.jpg` |
| Import a malformed email array containing `[123]` | The application rejects the complete import and makes no contact changes | `media/frame-009.jpg` |
| Preview a valid Taylor demo import | Preview reports one new fictional contact | `media/frame-010.jpg` |
| Confirm the valid import | Total increases from seven contacts to eight | `media/frame-011.jpg` |
| Reload the page | All eight contacts remain, including the imported contact and its methods | `media/frame-012.jpg` |
| Delete Taylor demo | Confirmation explicitly identifies the test contact to be removed | `media/frame-013.jpg` |
| Search after deletion | No matching result remains; total returns to seven | `media/frame-014.jpg` |
| Inspect the final application | Completed workflows leave a usable local address book | `media/frame-015.jpg` |

## Demonstration media

- **Primary: [full operation video](media/demo-full.mp4)** — 178 sequential captures collected while operating the application, approximately four captures per second, encoded into a 46.13-second MP4. Five recorded sections are joined with pauses between sections removed.
- [Primary video provenance and section guide](FULL_VIDEO.md), including timing sources, workflow counts, file hash and decode verification.
- [Primary video poster](media/demo-full-poster.jpg).
- Supplementary: [step-by-step overview](media/demo-step-by-step.mp4) — 15 selected actual browser screenshots, three seconds per stage, 45 seconds in total.
- Supplementary: [offline step-by-step viewer](media/demo-step-by-step.html), with previous, next and autoplay controls.
- [Supplementary media verification record](media/demo-step-by-step.json): source screenshot hashes, captions and encoder/decode metadata.

The full operation video is the primary running demonstration. Its five sections show create/search, details/edit/favorites, export/duplicate import, invalid/valid import/reload, and confirmed deletion. It starts with seven contacts, adds Morgan demo to reach eight, imports Taylor demo to reach nine, then removes the two recording-specific test contacts to return to seven. The recorded empty favorites result after removing favorite status is retained as valid application behavior.

The supplementary 45-second overview is a **step-by-step demonstration assembled from selected running-application screenshots**, not a continuous screen recording. Both videos preserve the complete screenshot content without cropping and use H.264, a 1280 × 800 canvas, 24 fps output and the broadly supported `yuv420p` pixel format. The primary capture rate was approximately four frames per second; the higher output rate supports standard media players. FFmpeg fully decoded all **1,107 frames of the primary video** and all **1,080 frames of the supplementary overview** successfully.

## Verification limits

This report covers the tested local browser workflow and automated checks. It does not claim that a blog has been submitted, a pull request merged, or a cloud deployment completed. Cross-device synchronization, authentication, shared databases and production security are outside the current implementation. Data persistence is specific to the browser and origin used for the run.
