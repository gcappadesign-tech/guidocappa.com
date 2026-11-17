# guidocappa.com

Guido Cappa's portfolio: plain HTML, CSS and JavaScript, served by GitHub Pages from this repository's `main` branch.
A change committed here is live on [guidocappa.com](https://guidocappa.com) about a minute later.

## Changing the words on a page

1. Open the page's file:
   - home: `index.html`
   - About: `about/index.html`
   - a case study: its folder, then `index.html` (for example `connectible/index.html`)
2. Click the pencil (**Edit this file**).
3. Find the sentence (click into the editor and press ⌘F), and change only the words. Keep the tags around them,
   such as `<p>` … `</p>` or `<h2>` … `</h2>`.
4. Click **Commit changes…**, write a short note ("Fix typo on Connectible") and commit.
5. After a minute, reload guidocappa.com with ⇧⌘R to see it.

Every change is kept in the file's **History**, so nothing is ever lost.

## Summaries for Guido's eyes

On About and the case studies, long paragraphs carry a one-line summary that the eyes say when the cursor rests
on them: it is the `data-tldr="…"` on the paragraph's `<p>` tag. If you rewrite a paragraph, update that line too.

## The chat on the home page

The chat answers from `assets/data/knowledge.json`, which is made from the pages' words. After changing the words
of a case study, it needs rebuilding (the tool for that is kept outside this repository).
