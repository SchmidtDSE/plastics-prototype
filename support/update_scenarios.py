import csv
import json
import sys

NUM_ARGS = 2
USAGE_STR = 'python update_scenarios.py [data csv] [scenarios]'


def main():
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        sys.exit(1)

    data_loc = sys.argv[1]
    scenarios_loc = sys.argv[2]

    totals = {}
    with open(data_loc) as f:
        input_data = csv.DictReader(f)
        data_2030 = filter(lambda x: int(x['year']) == 2030, input_data)
        for region_record in data_2030:
            region = region_record['region']
            consumption_keys = filter(lambda x: 'consumption' in x, region_record.keys())
            total = sum(map(lambda x: float(region_record[x]), consumption_keys))
            percentRecycling = float(region_record['eolRecyclingMT']) / (
                float(region_record['eolLandfillMT']) +
                float(region_record['eolIncinerationMT']) +
                float(region_record['eolMismanagedMT']) +
                float(region_record['eolRecyclingMT'])
            )
            percentVirigin = 1 - percentRecycling
            totals[region] = total * percentVirigin

    with open(scenarios_loc) as f:
        scenarios = json.load(f)

    cap_scenario = list(
        filter(lambda x: x['id'] == 'cap-virgin', scenarios['scenarios'])
    )[0]
    for value in cap_scenario['values']:
        region = value['lever'].replace('VirginPlasticCap', '')
        total = totals[region]
        value['value'] = round(total / 5) * 5

    with open(scenarios_loc, 'w') as f:
        json.dump(scenarios, f)
    


if __name__ == '__main__':
    main()
