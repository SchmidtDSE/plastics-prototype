import csv
import json
import sys

NUM_ARGS = 2
USAGE_STR = 'python update_scenarios.py [data csv] [scenarios]'
TARGET_YEAR = 2025


def main():
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        sys.exit(1)

    data_loc = sys.argv[1]
    scenarios_loc = sys.argv[2]

    totals = {}
    with open(data_loc) as f:
        input_data = csv.DictReader(f)
        data_2030 = filter(lambda x: int(x['year']) == TARGET_YEAR, input_data)
        for region_record in data_2030:
            region = region_record['region']
            totals[region] = float(region_record['primaryProductionMT'])

    with open(scenarios_loc) as f:
        scenarios = json.load(f)

    cap_scenario = list(
        filter(lambda x: x['id'] == 'cap-virgin', scenarios['scenarios'])
    )[0]
    for value in cap_scenario['values']:
        region = value['lever'].replace('VirginPlasticCap', '')
        total = totals[region]
        value['value'] = round(total / 1) * 1

    with open(scenarios_loc, 'w') as f:
        json.dump(scenarios, f, indent=2)
    


if __name__ == '__main__':
    main()
