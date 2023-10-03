mkdir data
wget --user plastics --password kSno3GeK https://global-plastics-tool.org/data/web.csv -O ./data/web.csv

bash support/npm_install.sh
bash support/render_template.sh
bash support/load_deps.sh
bash support/make.sh
