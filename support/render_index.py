"""Script which uses Jinja to render an index.json.

License: BSD
"""
import json
import sys

import jinja2

NUM_ARGS = 3
USAGE_STR = 'python render_index.py [template] [template vals] [output]'

FATES = [
    {'label': 'Recycling', 'key': 'Recycling'},
    {'label': 'Incineration', 'key': 'Incineration'},
    {'label': 'Landfill', 'key': 'Landfill'},
    {'label': 'Mismanaged', 'key': 'Mismanaged'}
]
SECTORS = [
    {'label': 'Agriculture', 'key': 'Agriculture'},
    {'label': 'Construction', 'key': 'Construction'},
    {'label': 'Electronic', 'key': 'Electronic'},
    {'label': 'Household Leisure Sports', 'key': 'HouseholdLeisureSports'},
    {'label': 'Packaging', 'key': 'Packaging'},
    {'label': 'Transportation', 'key': 'Transportation'},
    {'label': 'Textile', 'key': 'Textile'},
    {'label': 'Other', 'key': 'Other'}
]


def main():
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        return

    template_loc = sys.argv[1]
    template_vals_loc = sys.argv[2]
    output_loc = sys.argv[3]

    jinja_env = jinja2.Environment(loader=jinja2.BaseLoader())

    with open(template_loc) as f:
        template = jinja_env.from_string(f.read())
    
    with open(template_vals_loc) as f:
        template_vals = json.load(f)

    regions = template_vals['regions']

    all_regions = set(map(lambda x: x['key'], regions))
    def get_other_regions(region_name):
        others = filter(lambda x: x != region_name, all_regions)
        others_quoted = map(lambda x: '"%s"' % x, others)
        return ','.join(others_quoted)
    
    rendered_str = template.render(
        regions=regions,
        fates=FATES,
        sectors=SECTORS,
        get_other_regions=get_other_regions
    )
    rendered_parsed = json.loads(rendered_str)
    rendered_formatted = json.dumps(rendered_parsed, indent=4, sort_keys=True)

    with open(output_loc, 'w') as f:
        f.write(rendered_formatted)


if __name__ == '__main__':
    main()
