import csv
import json
import pathlib
import sys

NUM_ARGS = 2
USAGE_STR = 'python scenarios_overview.py [csv loc] [path to json files]'
ATTRS = [
    'eolRecyclingMT',
    'eolLandfillMT',
    'eolIncinerationMT',
    'eolMismanagedMT',
    'consumptionAgricultureMT',
    'consumptionConstructionMT',
    'consumptionElectronicMT',
    'consumptionHouseholdLeisureSportsMT',
    'consumptionPackagingMT',
    'consumptionTransporationMT',
    'consumptionTextileMT',
    'consumptionOtherMT',
    'netImportsMT',
    'netExportsMT',
    'domesticProductionMT',
    'netWasteExportMT',
    'netWasteImportMT'
]
TRADE_ATTRS = [
    'netImportsMT',
    'netExportsMT',
    'netWasteExportMT',
    'netWasteImportMT'
]
REGIONS = ['china', 'eu30', 'nafta', 'row']


def main():
    if len(sys.argv) < NUM_ARGS + 1:
        print(USAGE_STR)
        return
    
    output_loc = sys.argv[1]
    input_locs = sys.argv[2:]

    output_rows = []
    for input_loc in input_locs:
        name = pathlib.Path(input_loc).stem
        
        with open(input_loc) as f:
            input_src = json.load(f)
        
        input_src['global'] = {}
        for attr in ATTRS:
            input_src['global'][attr] = sum(map(
                lambda x: input_src[x][attr],
                REGIONS
            ))
        
        for attr in TRADE_ATTRS:
            input_src['global'][attr] = None
        
        regions_with_global = REGIONS + ['global']
        for region in regions_with_global:
            new_row = {'region': region, 'scenario': name}
            for attr in ATTRS:
                new_row[attr] = input_src[region][attr]
            output_rows.append(new_row)
        
    with open(output_loc, 'w') as f:
        export_attrs = ['scenario', 'region'] + ATTRS
        writer = csv.DictWriter(f, fieldnames=export_attrs)
        writer.writeheader()
        writer.writerows(output_rows)


if __name__ == '__main__':
    main()
