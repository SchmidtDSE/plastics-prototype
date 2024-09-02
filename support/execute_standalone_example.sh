cd js_standalone
rm ./test_output.json
npm run standalone ./example.json ./test_output.json ./test_error.txt

if [ -f ./test_error.txt ]; then
    echo "Failed to execute standalone."
    exit 1
fi
