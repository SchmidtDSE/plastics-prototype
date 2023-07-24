mkdir data
wget --user plastics --password kSno3GeK https://global-plastics-tool.org/data/web.csv -O ./data/web.csv

bash sh/npm_install.sh
bash sh/render_template.sh
bash sh/load_deps.sh
bash sh/make.sh
