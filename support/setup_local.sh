mkdir data

bash support/get_pipeline_output.sh
bash support/move_data.sh

bash support/npm_install.sh
bash support/render_template.sh
bash support/load_deps.sh
bash support/make.sh

pip install -r requirements.txt
