ROOT_DIR=$PWD;
cd image_gen
xvfb-run $ROOT_DIR/processing-4.3/processing-java --sketch=butterfly --output=/tmp/butteflybuild --force --run $ROOT_DIR/data/Pipeline\ Result/overview_ml.csv $ROOT_DIR/img