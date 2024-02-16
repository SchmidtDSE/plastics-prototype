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

echo "== Extract resin trade supplement =="
cd data
sqlite3 combined.db < ../support/get_resin_trade_supplement.sql
[ ! -e resin_trade_supplement.csv ] && exit 4;
cd ..

echo "== Splitting primary / secondary =="
python support/separate_production.py data/overview_ml_original.csv data/overview_ml.csv 1 20 2011
python support/separate_production.py data/overview_curve_original.csv data/overview_curve.csv 1 20 2011
python support/separate_production.py data/overview_naive_original.csv data/overview_naive.csv 1 20 2011

echo "== Make primary web output =="
cp data/overview_ml.csv data/web.csv

echo "== Move supporting data =="
mv pipeline/polymer_ratios.csv data/live_polymer_ratios.csv
mv pipeline/production_trade_subtype_ratios.csv data/live_production_trade_subtype_ratios.csv

echo "== Data prepared =="
