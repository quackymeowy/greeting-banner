# Greeting Banner (Notion embed)

A dynamic header banner for Notion dashboards:
- "Good morning / afternoon / evening, {name}", based on the chosen time zone (default: Los Angeles)
- Live date and time
- A daily tagline that rotates
- Responsive: centers and rescales on phones and narrow columns, and hides the tagline on very short embeds so nothing gets cropped

## Setup
1. `bg.jpg` is the background photo (text removed from the mockup image). To change it, replace the file with a text-free photo of the same name.
2. Enable GitHub Pages (Settings → Pages → Deploy from branch → `main` / root).
3. In Notion, type `/embed`, paste the Pages URL, and drag the block to about 220–260px tall.

## URL parameters (optional)
| Param | Default | Example |
|---|---|---|
| `name` | Enyita | `?name=Enyita` |
| `tz` | America/Los_Angeles | `?tz=Asia/Tokyo` |
| `tagline` | Discipline today, freedom tomorrow. | `?tagline=First line|Second line` (one per day, rotating) |
| `bg` | bg.jpg | `?bg=https://.../photo.jpg` |
| `quote` | Dream it.\|Believe it.\|Do it. | right-hand quote, one line per `\|`; `?quote=` hides it |
| `emoji` | none | `?emoji=🙂` shows it after the name |
| `focus` | 30% 50% | which part of the photo stays visible when cropped |

Greeting hours: morning 5:00–11:59, afternoon 12:00–16:59, evening 17:00–4:59.
