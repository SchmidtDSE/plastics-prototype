[ ! -e img/line.png ] && exit 1;
[ ! -e img/waste.png ] && exit 2;
[ ! -e img/consumption.png ] && exit 3;
[ ! -e img/sankey.png ] && exit 4;
echo "Test files found."
exit 0