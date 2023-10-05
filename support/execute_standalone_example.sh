cd js_standalone
npm run standalone ./example.json ./test_output.json
[ ! -e test_output.json ] && exit 1
