# Local reading list

Open `blog.html` on this computer to view the draft. The page, its stylesheet, and its font files are ignored in this working copy so they cannot be added to the live `main` branch by accident. The portfolio homepage keeps its Blog item inactive.

The draft is backed up on the public GitHub branch `codex/reading-notes-draft` in `Omjay/Omjay-Portfolio`. GitHub Pages serves `main`, so this branch does not create a live blog page. People browsing the repository can still read the branch. Changes you make locally are **not backed up automatically**: after adding or changing entries, ask Codex to sync this draft to that branch and verify the push.

To add an article, copy the `<li class="reading-item">` block in `blog.html` and change its author, source description, linked title, and the two notes. Use one short sentence for **What it covers** and one for **What it means to me**. Update both links in the block to the new article URL. The item numbers update automatically.

You can also send these five fields to Codex to add an entry:

```text
URL:
Title and author:
What it covers:
What it means to me:
Topic (optional):
```

If viewing the file directly does not load the fonts, start a server from this folder bound to `127.0.0.1` and open `http://127.0.0.1:4173/blog.html`. Keep the server local to this computer.

When you decide to publish, bring the draft into `main` deliberately and enable the Blog navigation. Until then, do not stage the draft files with `git add -f` on another branch.
