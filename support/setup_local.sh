mkdir data

bash support/get_pipeline_output.sh
bash support/prepare_data.sh

[ ! -e data/overview_ml.csv ] && exit 1;

bash support/npm_install.sh
bash support/load_deps.sh
bash support/make.sh
bash support/update_scenarios_default.sh
bash support/run_scenarios_standalone.sh
bash support/render_template.sh
