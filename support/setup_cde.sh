pip install -r requirements.txt
bash support/render_index.sh
[ ! -e pt/index.json ] && exit 1;

bash support/setup_local.sh
bash support/install_processing.sh
bash support/render_line_graphs.sh