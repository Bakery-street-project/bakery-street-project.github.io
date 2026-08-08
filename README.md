# bakery-street-project.github.io

Engineering portfolio and notes for [Bakery-street-project](https://github.com/Bakery-street-project).

Built with [Jekyll](https://jekyllrb.com/) and deployed on [GitHub Pages](https://pages.github.com/).

## Local Development

```bash
# Install dependencies
bundle install

# Serve locally
bundle exec jekyll serve

# Build for production
bundle exec jekyll build
```

## Structure

- `_pages/` — About, Projects, Notes pages
- `_posts/` — Blog posts (optional)
- `_notes/` — Technical notes collection
- `_data/` — Navigation and site data
- `assets/` — CSS, JS, images
- `.github/workflows/` — CI/CD for build and prose linting

## Deployment

Automatic deployment on push to `main` via GitHub Actions.

## License

MIT
