#!/bin/sh
# The three landing pages keep their pictures where the campaigns published
# them, on RD Station's library. That works, but it ties the card to a host
# nobody here controls. Run this once, from the root of the repository, to
# bring them alongside the pages and point the pages at the copies:
#
#     sh hpp/fetch-images.sh
#
# It downloads every picture the pages ask for into hpp/images/ and rewrites
# their own sources to match. Nothing else in the files is touched, and
# running it twice is harmless.
set -eu

dir="hpp/images"
mkdir -p "$dir"

for page in hpp/verao-maior.html hpp/pix-automatico.html hpp/todo-o-brasil.html; do
    printf '%s\n' "$page"
    # every distinct cloudfront source in the page
    grep -o 'https://d335luupugsy2\.cloudfront\.net/cms/files/[^")'"'"' ]*' "$page" | sort -u |
    while read -r url; do
        name=$(printf '%s' "$url" | sed 's/.*\///; s/[^A-Za-z0-9._-]/_/g')
        if [ ! -f "$dir/$name" ]; then
            printf '  fetching %s\n' "$name"
            curl -fsSL "$url" -o "$dir/$name"
        fi
        # point the page at the copy beside it
        sed -i.bak "s|$url|images/$name|g" "$page"
        rm -f "$page.bak"
    done
done

printf 'done — the pages now read their pictures from %s\n' "$dir"
