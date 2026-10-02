#!/bin/sh
# Creates missing WebP thumbnails for public/Dump (needs ImageMagick).
# Images without a thumbnail still work; the grid then loads the original.
cd "$(dirname "$0")/../public/Dump" || exit 1
mkdir -p thumbs
for f in *.jpg *.jpeg *.png *.gif *.webp; do
  [ -f "$f" ] || continue
  t="thumbs/${f%.*}.webp"
  [ -f "$t" ] || magick "$f[0]" -resize '320x240^' -quality 75 "$t"
done
