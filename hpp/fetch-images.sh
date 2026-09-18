#!/bin/sh
# The Verão Maior page keeps its pictures where the campaign published them,
# on RD Station's library. That works, but it ties the card to a host nobody
# here controls. Run this once, from the root of the repository, to bring
# them alongside the page and point it at the copies:
#
#     sh hpp/fetch-images.sh
#
# It downloads every picture the page asks for into hpp/images/ and rewrites
# the page's own sources to match. Nothing else in the file is touched, and
# running it twice is harmless.
set -eu

page="hpp/verao-maior.html"
dir="hpp/images"
mkdir -p "$dir"

# every distinct cloudfront source in the page
grep -o 'https://d335luupugsy2\.cloudfront\.net/cms/files/[^")'"'"' ]*' "$page" | sort -u |
while read -r url; do
    name=$(printf '%s' "$url" | sed 's/.*\///; s/[^A-Za-z0-9._-]/_/g')
    if [ ! -f "$dir/$name" ]; then
        printf 'fetching %s\n' "$name"
        curl -fsSL "$url" -o "$dir/$name"
    fi
    # point the page at the copy beside it
    sed -i.bak "s|$url|images/$name|g" "$page"
    rm -f "$page.bak"
done

printf 'done — the page now reads its pictures from %s\n' "$dir"
