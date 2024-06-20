"""Script to build the standalone tasks in CI / CD."""

import json
import os
import sys

NUM_ARGS = 3
USAGE_STR = 'USAGE: python build_scenarios.py [scenarios json] [job template] [output dir]'

SCENARIOS = {
    "snapshot": {
        'minimumRecyclingRate': {'minimum-recycle-rate': 40},
        'minimumRecycledContent': {'minimum-recycled-content': 40},
        'minimumPackagingReuse': {'minimum-packaging-reuse': 40},
        'capVirgin': {'cap-virgin': 1},
        'banPsPackaging': {'ban-ps-packaging': 1},
        'banSingleUse': {'ban-single-use': 90},
        'reducedAdditives': {'reduced-additives': 90},
        'recyclingInvestment': {'recycling-investment': 100},
        'wasteInvestment': {'waste-investment': 100},
        'taxVirgin': {'tax-virgin': 1},
        'banWasteTrade': {'ban-waste-trade': 1},
        'lowAmbition': {
            'minimum-recycle-rate': 20,
            'minimum-recycled-content': 20,
            'ban-single-use': 30,
            'reduced-additives': 30,
            'recycling-investment': 10,
            'waste-investment': 25
        },
        'highAmbition': {
            'minimum-recycle-rate': 40,
            'minimum-recycled-content': 40,
            'minimum-packaging-reuse': 40,
            'cap-virgin': 1,
            'ban-ps-packaging': 1,
            'ban-single-use': 90,
            'reduced-additives': 90,
            'recycling-investment': 100,
            'waste-investment': 50,
            'tax-virgin': 2,
            'ban-waste-trade': 1
        },
        'businessAsUsual': {}
    },
    "timeseries": {
        'lowAmbition': {
            'minimum-recycle-rate': 20,
            'minimum-recycled-content': 20,
            'ban-single-use': 30,
            'reduced-additives': 30,
            'recycling-investment': 10,
            'waste-investment': 25
        },
        'highAmbition': {
            'minimum-recycle-rate': 40,
            'minimum-recycled-content': 40,
            'cap-virgin': 1,
            'ban-ps-packaging': 1,
            'ban-single-use': 90,
            'reduced-additives': 90,
            'recycling-investment': 100,
            'waste-investment': 100,
            'tax-virgin': 2,
            'ban-waste-trade': 1
        },
        'businessAsUsual': {}
    }
}


def get_scenario(name, scenarios_json):
    matching = filter(lambda x: x['id'] == name, scenarios_json['scenarios'])
    return list(matching)[0]


def main():
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        sys.exit(1)
    
    scenarios_json_loc = sys.argv[1]
    job_template_loc = sys.argv[2]
    output_dir = sys.argv[3]

    with open(scenarios_json_loc) as f:
        scenarios_json = json.load(f)
    
    with open(job_template_loc) as f:
        job_template = json.load(f)
    
    for timeseries_type in SCENARIOS:
        for name in SCENARIOS[timeseries_type]:
            scenario_info = SCENARIOS[timeseries_type][name]
            inputs = []

            for key in scenario_info:
                scenario_value = scenario_info[key]
                scenario = get_scenario(key, scenarios_json)
                
                if 'config' in scenario:
                    base_value = scenario['config']['default']
                    multiplier = scenario_value / base_value
                    for value in scenario['values']:
                        inputs.append({
                            'lever': value['lever'],
                            'value': value['baseValue'] * multiplier
                        })
                else:
                    for value in scenario['values']:
                        inputs.append({
                            'lever': value['lever'],
                            'value': value['value']
                        })
                
            job_template['inputs'] = inputs

            if timeseries_type == 'snapshot':
                years = [2050]
            elif name == 'businessAsUsual':
                years = range(2011, 2050)
            else:
                years = range(2024, 2050)  # Only spend time on projection years
            
            for year in years:
                if year != 2050:
                    full_name = '%s%d' % (name, year)
                else:
                    full_name = name
                job_template['year'] = year
                output_path = os.path.join(output_dir, full_name + '.json')
                with open(output_path, 'w') as f:
                    json.dump(job_template, f)


if __name__ == '__main__':
    main()
