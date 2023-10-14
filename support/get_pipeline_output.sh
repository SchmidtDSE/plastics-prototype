mkdir /tmp/pipeline_staging
wget --user plastics --password kSno3GeK https://global-plastics-tool.org/datapipeline.zip -O /tmp/pipeline_staging/pipeline.zip
unzip /tmp/pipeline_staging/pipeline.zip -d /tmp/pipeline_staging
mv /tmp/pipeline_staging/output /tmp/pipeline_staging/pipeline
cp -r /tmp/pipeline_staging/pipeline pipeline
