mkdir standalone_tasks
python support/build_scenarios.py pt/scenarios.json js_standalone/example.json ./standalone_tasks

cd js_standalone
for file in ../standalone_tasks/*.json; do 
    npm run standalone "$file" "$file" "test_error.txt"
done
cd ..

python support/scenarios_overview.py ./standalone_tasks/scenarios_overview.csv ./standalone_tasks/*.json
