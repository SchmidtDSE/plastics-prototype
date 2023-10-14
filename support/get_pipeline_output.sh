mkdir /tmp/pipeline_staging
wget --user plastics --password kSno3GeK https://global-plastics-tool.org/datapipeline.zip -O /tmp/pipeline_staging/pipeline.zip
unzip /tmp/pipeline_staging/pipeline.zip -d /tmp/pipeline_staging
mv /tmp/pipeline_staging/output pipeline
[ ! -e pipeline/combined.db ] && exit 1;
