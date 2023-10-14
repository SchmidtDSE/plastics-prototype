mkdir data

echo "== Checking data =="
[ ! -e pipeline/overview_ml.csv ] && exit 1;
[ ! -e pipeline/overview_curve.csv ] && exit 2;
[ ! -e pipeline/overview_naive.csv ] && exit 3;

echo "== Moving data =="
mv pipeline/overview_ml.csv data/overview_ml.csv
mv pipeline/overview_curve.csv data/overview_curve.csv
mv pipeline/overview_naive.csv data/overview_naive.csv
cp data/overview_ml.csv data/web.csv

echo "== Data moved =="
