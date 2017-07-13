#/bin/bash

rm -rf ../gh-pages

git clone -b gh-pages git@github.com:yanni4night/yanni4night.github.io.git ../gh-pages

rm -rf ../gh-pages/*

bundle exec jekyll build -d ../gh-pages/

cd ../gh-pages

git add -A

now=`date +%Y/%m/%d-%H:%M:%S`

git commit --allow-empty -m "publish $now"

git push origin gh-pages