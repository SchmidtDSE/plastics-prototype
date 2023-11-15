mkdir data

echo "== Checking data =="
[ ! -e pipeline/overview_ml.csv ] && exit 1;
[ ! -e pipeline/overview_curve.csv ] && exit 2;
[ ! -e pipeline/overview_naive.csv ] && exit 3;

echo "== Moving data =="
mv pipeline/overview_ml.csv data/overview_ml_original.csv
mv pipeline/overview_curve.csv data/overview_curve_original.csv
mv pipeline/overview_naive.csv data/overview_naive_original.csv
mv pipeline/combined.db data/combined.db
cp data/overview_ml.csv data/web.csv

echo "== Splitting primary / secondary =="
python support/separate_production.py data/overview_ml_original.csv data/overview_ml.csv 1 20 2011
python support/separate_production.py data/overview_curve_original.csv data/overview_curve.csv 1 20 2011
python support/separate_production.py data/overview_naive_original.csv data/overview_naive.csv 1 20 2011

echo "== Data prepared =="
