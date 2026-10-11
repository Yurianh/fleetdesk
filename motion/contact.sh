#!/bin/sh
# Planche contact des images fixes d'une scène : 4 colonnes, triées par instant.
# Usage : sh contact.sh <scene> [format]
set -e
dir="$1/review"
if [ -n "$2" ]; then files=$(ls "$dir"/still-"$2"-*.png | sort -t- -k3 -n)
else files=$(ls "$dir"/still-[0-9]*.png | sort -t- -k2 -n); fi
n=$(echo "$files" | wc -l | tr -d ' ')
inputs=""; labels=""; layout=""
i=0
for f in $files; do
  inputs="$inputs -i $f"; labels="$labels[$i]"
  c=$((i % 4)); r=$((i / 4))
  x=$( [ $c -eq 0 ] && echo 0 || printf 'w0%.0s+' $(seq $c) | sed 's/+$//' )
  y=$( [ $r -eq 0 ] && echo 0 || printf 'h0%.0s+' $(seq $r) | sed 's/+$//' )
  layout="$layout|${x}_${y}"
  i=$((i + 1))
done
ffmpeg -loglevel error -y $inputs -filter_complex "${labels}xstack=inputs=$n:layout=${layout#|}:fill=white,scale=1600:-1" "$dir/contact${2:+-$2}.png"
echo "$dir/contact${2:+-$2}.png"
