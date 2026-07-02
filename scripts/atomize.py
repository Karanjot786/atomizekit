#!/usr/bin/env python3
"""Scaffold platform-native distribution drafts from one blog post.

Reads <slug>.mdx (or .md) from the host repo's blog dir (cwd/{brand.blogDir},
then ../{brand.blogDir}, or --blog-dir override), pulls frontmatter, and
creates {brand.distributionDir}/<slug>/{<platform>...,index}.md with
per-platform headers + the canonical blog URL built from
brand.canonicalPattern. Claude fills the copy per references/playbook.md.

Brand config (domain, canonicalPattern, blogDir, distributionDir, platforms,
eyebrow) comes from <skill>/brand/brand.json — run /setup first if missing.

No key, no posting. Drafts only. Usage:
  atomize.py --slug my-post [--blog-dir path/to/blog]
"""
import argparse, json, os, re, sys

# per-platform header: (label, format hint, one-line rule)
# Covers every platform brand.json's contract allows (see brand.template.json).
SPEC = {
    "x":         ("X (Twitter)", "contrarian one-liner / hypocrisy expose / paradox",
                  "<=15 words, no hashtags, no emojis. Put the canonical link in a REPLY, not the main post."),
    "reddit":    ("Reddit", "native text post, useful-first",
                  "Be a person. Tell the lesson. Link only if it genuinely helps AND the sub allows. No link-drop."),
    "linkedin":  ("LinkedIn", "hook line -> short lines -> one data insight -> soft CTA",
                  "Human, not corporate. Canonical link inline. One real stat from the blog."),
    "instagram": ("Instagram", "carousel caption or single-image caption",
                  "Hook + value in the caption. Blog goes in 'link in bio'."),
    "youtube":   ("YouTube", "Shorts script (30-60s) or community post",
                  "Hook in the first 3 seconds. Canonical link in the description."),
    "medium":    ("Medium", "full-length republish of the blog",
                  "Republish the whole article. Set the Medium canonical link to the blog URL (Import Story or canonical field) so it does not compete for the same ranking. Medium title + subtitle."),
    "substack":  ("Substack", "newsletter issue (email-first)",
                  "Subject line + one personal opening line + the value + a read-the-full-guide CTA to the blog. Written to a subscriber, not a search engine."),
}


def skill_root():
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_brand():
    p = os.path.join(skill_root(), "brand", "brand.json")
    if not os.path.exists(p):
        sys.exit("no brand/brand.json — run the skill's /setup first (it interviews you and writes it)")
    return json.load(open(p, encoding="utf-8"))


def read_blog(slug, blog_dir, brand_blog_dir):
    # The blog lives in the HOST repo (cwd). --blog-dir overrides the search
    # entirely; otherwise look in cwd/{brand.blogDir}, then the parent's
    # {brand.blogDir} (handles the skill living one level under the site repo).
    if blog_dir:
        dirs = [blog_dir]
    else:
        dirs = [os.path.join(os.getcwd(), brand_blog_dir),
                os.path.join(os.getcwd(), "..", brand_blog_dir)]
    for d in dirs:
        for ext in (".mdx", ".md"):
            p = os.path.join(d, slug + ext)
            if os.path.exists(p):
                return open(p, encoding="utf-8").read()
    searched = ", ".join(os.path.normpath(d) for d in dirs)
    sys.exit(f"no blog post {slug}.(mdx|md) in [{searched}] (write it with commands/write.md first, or pass --blog-dir)")


def frontmatter(text):
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.S)
    fm = {}
    if m:
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                fm[k.strip()] = v.strip().strip('"').strip("'")
    return fm


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True)
    ap.add_argument("--blog-dir", default=None,
                    help="dir holding <slug>.mdx (default: <cwd>/{brand.blogDir} then ../{brand.blogDir})")
    a = ap.parse_args()

    brand = load_brand()
    platforms = brand["platforms"]

    fm = frontmatter(read_blog(a.slug, a.blog_dir, brand["blogDir"]))
    title = fm.get("title", a.slug)
    canonical = brand["canonicalPattern"].replace("{slug}", a.slug)

    out_dir = os.path.join(os.getcwd(), brand["distributionDir"], a.slug)
    os.makedirs(out_dir, exist_ok=True)

    for plat in platforms:
        if plat not in SPEC:
            print(f"warning: no playbook spec for platform '{plat}' — skipping (add it to SPEC in atomize.py)", file=sys.stderr)
            continue
        label, fmt, rule = SPEC[plat]
        path = os.path.join(out_dir, f"{plat}.md")
        if os.path.exists(path):
            continue  # never clobber copy already written
        header = (
            f"platform: {label}\n"
            f"canonical: {canonical}\n"
            f"source_blog: {title}\n"
            f"format: {fmt}\n"
            f"rule: {rule}\n"
            f"posted: false\n"
            f"---\n\n"
            f"<!-- Claude: write the {label} variant here. One insight from the blog, native voice.\n"
            f"     Destination is {canonical} (see rule above for where the link goes). -->\n"
        )
        open(path, "w", encoding="utf-8").write(header)

    # index: tracks all variants + the canonical source
    idx = os.path.join(out_dir, "index.md")
    if not os.path.exists(idx):
        lines = [f"# Distribution: {title}", "", f"Canonical: {canonical}", "", "| Platform | File | Posted |", "|---|---|---|"]
        for plat in platforms:
            if plat in SPEC:
                lines.append(f"| {SPEC[plat][0]} | {plat}.md | no |")
        lines += ["", "Post each one manually, then flip `posted: false -> true` in the file.", ""]
        open(idx, "w", encoding="utf-8").write("\n".join(lines))

    # post.json: the single data source for BOTH visual renderers (render_cards.mjs
    # + hyperframes video). headline/url derived from the blog; stat/statLabel left
    # empty on purpose so the renderers fail loud until Claude fills a REAL number.
    post = os.path.join(out_dir, "post.json")
    if not os.path.exists(post):
        with open(post, "w", encoding="utf-8") as f:
            json.dump({
                "headline": title,
                "stat": "",         # TODO Claude: one REAL number from the blog
                "statLabel": "",    # TODO Claude: what the number counts
                "url": canonical,
                "eyebrow": brand.get("eyebrow", ""),
            }, f, indent=2)

    print(f"scaffolded {out_dir}/  (canonical: {canonical})")
    print("next: Claude writes each *.md per references/playbook.md, fills stat/statLabel in post.json, then the user posts manually")


if __name__ == "__main__":
    main()
