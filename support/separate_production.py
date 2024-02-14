import csv
import sys

USAGE_STR = 'python separate_production.py [input] [output] [recycle delay] [yield loss] [start]'
NUM_ARGS = 5
OUTPUT_COLS = [
    'year',
    'region',
    'eolRecyclingMT',
    'eolLandfillMT',
    'eolIncinerationMT',
    'eolMismanagedMT',
    'consumptionAgricultureMT',
    'consumptionConstructionMT',
    'consumptionElectronicMT',
    'consumptionHouseholdLeisureSportsMT',
    'consumptionPackagingMT',
    'consumptionTransportationMT',
    'consumptionTextileMT',
    'consumptionOtherMT',
    'netImportsMT',
    'netExportsMT',
    'primaryProductionMT',
    'secondaryProductionMT',
    'netWasteExportMT',
    'netWasteImportMT'
]


def partial_parse_record(record):
    record['year'] = int(record['year'])
    record['eolRecyclingMT'] = float(record['eolRecyclingMT'])
    record['domesticProductionMT'] = float(record['domesticProductionMT'])
    return record


def get_key(year, region):
    return '%d\t%s' % (year, region)


def strip_record(record):
    return dict(map(lambda x: (x, record[x]), OUTPUT_COLS))


def main():
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        sys.exit(1)
    
    input_loc = sys.argv[1]
    output_loc = sys.argv[2]
    recycle_delay = int(sys.argv[3])
    yield_loss = float(sys.argv[4])
    start_year = int(sys.argv[5])

    indexed_records = {}
    flat_records = []
    with open(input_loc) as f:
        raw_records = csv.DictReader(f)
        parsed_records = map(partial_parse_record, raw_records)

        for record in parsed_records:
            key = get_key(record['year'], record['region'])
            indexed_records[key] = record
            flat_records.append(record)
    
    def transform_record(record):
        input_key = get_key(record['year'] - recycle_delay, record['region'])
        input_record = indexed_records[input_key]
        input_recycling = input_record['eolRecyclingMT']
        
        original_primary = record['domesticProductionMT']
        secondary_naive = input_recycling * (1 - yield_loss / 100)
        secondary = original_primary if original_primary < secondary_naive else secondary_naive
        primary = original_primary - secondary

        record['primaryProductionMT'] = primary
        record['secondaryProductionMT'] = secondary

        return record
    
    allowed_records = filter(lambda x: x['year'] >= start_year, flat_records)
    transformed_records = map(transform_record, allowed_records)
    stripped_records = map(strip_record, transformed_records)

    with open(output_loc, 'w') as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLS)
        writer.writeheader()
        writer.writerows(stripped_records)


if __name__ == '__main__':
    main()
