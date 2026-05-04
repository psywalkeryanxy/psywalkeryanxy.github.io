# psywalkeryanxy.github.io

Personal site, built with [Quarto](https://quarto.org).

## Local preview

```bash
quarto preview
```

Opens at `http://localhost:port`, hot-reloads on save.

## Build

```bash
quarto render
```

Outputs to `docs/`. The `_quarto.yml` is already configured for `output-dir: docs`, which is the directory GitHub Pages serves for user sites.

## Deploy

```bash
git add .
git commit -m "update site"
git push
```

In your repo settings → Pages: set source to `main` branch, `/docs` folder. After the first push, the site is live at <https://psywalkeryanxy.github.io>.

## Adding content

### A new science post (paper companion, methods note, etc.)

```
posts/science/YYYY-MM-DD-slug/
  index.qmd
  thumb.png        # optional, used as listing image
  any-figure.png
```

The listing page picks it up automatically — no edits to `_quarto.yml` needed.

### A new life post

Same pattern under `posts/life/`.

### A new photo

Drop the image into `photos/img/` and add one line to `photos/index.qmd`:

```html
<a href="photos/img/07.jpg" data-caption="..."><img src="photos/img/07.jpg" alt="..." loading="lazy"></a>
```

## Files you'll likely want to update

- `index.qmd` — your bio, email, profile photo path (`images/profile.jpg`)
- `_quarto.yml` — email link in the navbar `right:` section
- `published_papers/` — copy your existing PDFs and figure PNGs here (path matches your old site)
- `images/profile.jpg` — your headshot

## Customizing the look

- Colors / fonts → `assets/custom.scss`
- Layout / components → `assets/styles.css`

The accent color is currently a muted oxblood (`#8a3a2e`). Change `$link-color` in `custom.scss` if you want a different accent.
