mkdir /tmp/pipeline_staging
wget --user plastics --password kSno3GeK https://global-plastics-tool.org/datapipeline.zip -O /tmp/pipeline_staging/pipeline.zip
unzip /tmp/pipeline_staging/pipeline.zip -d /tmp/pipeline_staging
echo "== Checking staging contents =="
[ ! -e /tmp/pipeline_staging/output/combined.db ] && exit 1;
mv /tmp/pipeline_staging/output pipeline
ls pipeline
echo "== Checking moved contents =="
[ ! -e pipeline/combined.db ] && exit 2;
echo "== Loaded pipeline results =="
