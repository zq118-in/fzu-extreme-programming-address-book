# Full Operation Demonstration

[Watch or download the full operation video](media/demo-full.mp4)  
[View the video poster](media/demo-full-poster.jpg)

The primary demonstration is a recording of actual operations in the running Linbook application. It contains **178 sequential browser captures** collected at approximately four captures per second while the application was being operated. It is separate from the supplementary 15-image step-by-step overview.

## Recorded sections

The recording contains five sections. Pauses between sections have been removed. The visible video header discloses this edit.

| Approximate video time | Captures | Recorded workflow |
| --- | --- | --- |
| 00:00–00:10 | 0–38 | Create Morgan demo with two phone numbers, email, social account and address; save and search |
| 00:10–00:19 | 39–74 | View all details, edit the note, remove favorite status and observe the resulting favorites view |
| 00:19–00:28 | 75–108 | Switch to all contacts, restore favorite status, export eight contacts and reimport the workbook with eight exact duplicates skipped |
| 00:28–00:38 | 109–145 | Reject a malformed import, import Taylor demo, increase the total to nine and reload to verify persistence |
| 00:38–00:46 | 146–177 | Confirm deletion of Taylor demo and Morgan demo, returning to seven contacts, then inspect the final overview |

Morgan demo and Taylor demo are fictional testing records. The application state already contained the six labeled sample records and the Alex demo record from the earlier verification run before this recording began. The totals therefore follow **7 → 8 → 9 → 8 → 7**. Removing Morgan demo from favorites while a search was active can correctly produce an empty favorites result; that behavior remains visible in the recording.

## Timing and presentation

- Captures 0–74 use the source files' modification times because a capture-session reset left those sections without JSON timestamp files.
- Captures 75–177 use their recorded JSON capture timestamps.
- Within each section, frame display durations follow the capture intervals, bounded to 0.15–1.0 seconds; the final capture of each section is held for 0.25 seconds.
- No three-second-per-image slideshow timing is used in this primary video.
- Screenshots are fitted inside the 1280 × 800 canvas without cropping. English section captions identify the workflow.
- The output is encoded at 24 fps for player compatibility; this does not imply that the original browser capture rate was 24 fps.
- The original capture sequence and timestamp files are retained with the local working evidence. The repository needs only the final video, poster and this provenance note.

## File verification

| Property | Value |
| --- | --- |
| File | `media/demo-full.mp4` |
| Container and codec | MP4, H.264 High profile |
| Pixel format | `yuv420p` |
| Canvas | 1280 × 800 |
| Encoded frame rate | 24 fps |
| Duration | 46.13 seconds |
| Size | 755,400 bytes |
| Encoded frames decoded for verification | 1,107 |
| SHA-256 | `6d5e4498b2346192ec4756eba7a1b5191fe6cab73249865e1b448f4c3c71e670` |

FFmpeg successfully decoded the entire file with no decoding errors. A frame extracted at 12 seconds was also visually inspected to confirm readable application content, complete framing and the recorded-section captions.

This document records the local demonstration evidence. It does not claim that the blog has been submitted, a pull request merged or a cloud deployment completed.
