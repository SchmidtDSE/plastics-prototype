mkdir -p deploy
cp -r css deploy/css
cp -r data deploy/data
cp -r font deploy/font
cp -r img deploy/img
cp -r js deploy/js
cp -r pt deploy/pt
cp -r template deploy/template
cp -r third_party deploy/third_party
cp index.html deploy
cp preview.html deploy
epoch=$(date +%s)
sed -i "s/EPOCH/${epoch}/g" deploy/index.html
