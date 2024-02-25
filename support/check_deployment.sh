[ ! -e deploy/data/web.csv ] && exit 1;
[ ! -e deploy/index.html ] && exit 2;
echo "Deployment ok"
