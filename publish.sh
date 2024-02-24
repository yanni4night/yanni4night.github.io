#/bin/bash

rm -rf ../gh-pages

git clone --depth=1 -b gh-pages git@github.com:yanni4night/yanni4night.github.io.git ../gh-pages

rm -rf ../gh-pages/*

yarn
yarn build

cp -r _site/* ../gh-pages

cd ../gh-pages

touch .nojekyll
git add -A

now=`date +%Y/%m/%d-%H:%M:%S`

git commit --allow-empty -m "publish $now"

git push origin gh-pages