ROOT_DIR=$PWD;
cd image_gen
xvfb-run -a ../processing-4.3/processing-java --sketch=plastics_sankey --output=/tmp/sankeybuild --force --run $ROOT_DIR/standalone_tasks/scenarios_overview.csv $ROOT_DIR/img