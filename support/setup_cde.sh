pip install -r requirements.txt
bash support/render_index.sh

[ ! -e pt/index.json ] && exit 1;

bash support/setup_local.sh

[ ! -e data/overview_ml.csv ] && exit 2;
[ ! -e standalone_tasks/scenarios_overview.csv ] && exit 3;

bash support/install_processing.sh

bash support/render_line_graphs.sh
bash support/render_butterfly.sh
bash support/render_sankey.sh
bash support/check_image_outputs.sh
