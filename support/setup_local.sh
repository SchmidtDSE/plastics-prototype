mkdir data

bash support/get_pipeline_output.sh
bash support/move_data.sh

bash support/npm_install.sh
bash support/load_deps.sh
bash support/make.sh
bash support/update_scenarios_default.sh
bash support/run_scenarios_standalone.sh
bash support/render_template.sh

pip install -r requirements.txt
