[ ! -e standalone_tasks/highAmbition.json ] && exit 1;
[ ! -e standalone_tasks/lowAmbition.json ] && exit 2;
[ ! -e standalone_tasks/selectPackage.json ] && exit 3;
echo "Test files found."
exit 0