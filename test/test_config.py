import itertools
import json
import sys

USAGE_STR = 'python test_config.py [index] [scenarios]'
NUM_ARGS = 2


def check_and_get_levers(target):
    levers = []

    categories_raw = target['categories']
    assert len(categories_raw) > 0

    # Check expected properties and uniqueness
    category_names = set()
    category_labels = set()

    for category in categories_raw:
        assert 'name' in category
        assert 'label' in category
        assert 'levers' in category

        assert category['name'] not in category_names
        assert category['label'] not in category_labels

        category_names.add(category['name'])
        category_labels.add(category['label'])

    # Check levers
    levers_nested = map(lambda x: x['levers'], categories_raw)
    levers_flat = itertools.chain(*levers_nested)

    lever_names = set()
    lever_variables = set()

    for lever in levers_flat:
        assert 'name' in lever
        assert 'min' in lever
        assert 'max' in lever
        assert 'default' in lever
        assert 'step' in lever
        assert 'units' in lever
        assert 'variable' in lever
        assert 'template' in lever
        assert 'url' in lever

        assert lever['name'] not in lever_names
        assert lever['label'] not in lever_labels

        lever_names.add(lever['name'])
        lever_variables.add(lever['variable'])

    return lever_variables


def check_and_get_scenarios(target):
    scenarios = target['scenarios']
    assert len(scenarios) > 0

    # Check scenarios
    scenario_names = set()

    for scenario in scenarios:
        assert 'name' in scenario
        assert 'values' in scenario
        assert len(scenarios) > 0

        assert scenarios['name'] not in scenario_names

        scenario_names.add(scenarios['name'])

    # Check levers
    levers_nested = map(lambda x: x['values'], scenarios)
    levers_flat = itertools.chain(*levers_nested)

    lever_variables = set()

    for lever in levers_flat:
        assert 'lever' in lever
        assert 'value' in lever

        assert lever['lever'] not in lever_variables

        lever_variables.add(lever['lever'])

    return lever_variables


def main():
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        sys.exit(1)

    index_loc = sys.argv[1]
    scenarios_loc = sys.argv[2]

    with open(index_loc) as f:
        index_contents = json.load(f)

    with open(scenarios_loc) as f:
        scenarios_contents = json.load(f)

    lever_variables = check_and_get_levers(index_contents)
    scenario_variables = check_and_get_scenarios(scenarios_contents)

    assert lever_variables.issubset(scenario_variables)

    print('Done.')


main()
