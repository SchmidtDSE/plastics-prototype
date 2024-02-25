echo "== [main] Get main pipline =="
mkdir /tmp/pipeline_staging
wget https://global-plastics-tool.org/datapipeline.zip -O /tmp/pipeline_staging/pipeline.zip
unzip /tmp/pipeline_staging/pipeline.zip -d /tmp/pipeline_staging

echo "== [main] Checking staging contents =="
[ ! -e /tmp/pipeline_staging/output/combined.db ] && exit 1;
mv /tmp/pipeline_staging/output pipeline
ls pipeline

echo "== [main] Checking moved contents =="
[ ! -e pipeline/combined.db ] && exit 2;

echo "== [main] Loaded pipeline results =="

echo "== [support] Get supporting data =="
mkdir /tmp/ghg_staging
wget https://global-plastics-tool.org/data/polymer_ratios.csv -O /tmp/ghg_staging/polymer_ratios.csv
wget https://global-plastics-tool.org/data/production_trade_subtype_ratios.csv -O /tmp/ghg_staging/production_trade_subtype_ratios.csv

echo "== [support] Checking support =="
[ ! -e /tmp/ghg_staging/polymer_ratios.csv ] && exit 3;
[ ! -e /tmp/ghg_staging/production_trade_subtype_ratios.csv ] && exit 4;
mv /tmp/ghg_staging/polymer_ratios.csv pipeline
mv /tmp/ghg_staging/production_trade_subtype_ratios.csv pipeline

echo "== [support] Checking moved contents =="
[ ! -e pipeline/polymer_ratios.csv ] && exit 5;

echo "== [support] Getting downstream diagnostics =="
mkdir /tmp/ghg_pipeline_staging
wget https://global-plastics-tool.org/data/ghg-pipeline.zip -O /tmp/ghg_pipeline_staging/ghg-pipeline.zip
unzip /tmp/ghg_pipeline_staging/ghg-pipeline.zip -d /tmp/ghg_pipeline_staging

echo "== [support] Checking supplemental diagnostics =="
[ ! -e /tmp/ghg_pipeline_staging/deploy/sweep.csv ] && exit 6;
[ ! -e /tmp/ghg_pipeline_staging/deploy/out_sample_test.txt ] && exit 7;

echo "== [support] Moving supplemental diagnostics =="
mv /tmp/ghg_pipeline_staging/deploy/sweep.csv pipeline/trade_sector_sweep.csv
mv /tmp/ghg_pipeline_staging/deploy/out_sample_test.txt pipeline/trade_sector_out_sample_test.txt

echo "== [support] Checking supplemental diagnostics moved =="
[ ! -e pipeline/trade_sector_sweep.csv ] && exit 8;
[ ! -e pipeline/trade_sector_out_sample_test.txt ] && exit 9;

echo "== [support] Loaded supporting data =="
