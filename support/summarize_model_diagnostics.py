import csv
import json
import os
import sys

NUM_ARGS = 2
USAGE_STR = 'USAGE: python summarize_model_diagnostics.py [output json] [input dir]'
TYPE_NAMES = {
    'consumption': 'consumption',
    'waste': 'waste',
    'wasteTrade': 'wasteTrade',
    'goodsTrade': 'trade'
}


class ParsedRecord:

    def __init__(self, algorithm, validation_error, test_in_sample_error, test_out_sample_error):
        self._algorithm = algorithm
        self._validation_error = validation_error
        self._test_in_sample_error = test_in_sample_error
        self._test_out_sample_error = test_out_sample_error

    def get_algorithm(self):
        return self._algorithm

    def get_validation_error(self):
        return self._validation_error

    def get_test_in_sample_error(self):
        return self._test_in_sample_error

    def get_test_out_sample_error(self):
        return self._test_out_sample_error


def parse_main_sweep_record(raw_record):
    return ParsedRecord(
        raw_record['type'],
        float(raw_record['validInSampleTarget']),
        float(raw_record['testInSampleResponse']),
        float(raw_record['testOutSampleResponse'])
    )


def parse_trade_sector_record(raw_record):
    return ParsedRecord(
        raw_record['algorithm'],
        float(raw_record['validationMae']),
        float(raw_record['testMae']),
        None
    )


def get_selected_model_diagnostics(parsed, require_random_forest=True):
    if require_random_forest:
        candidates = filter(lambda x: x.get_algorithm() == 'random forest', parsed)
    else:
        candidates = parsed

    top_record = min(candidates, key=lambda x: x.get_validation_error())

    return top_record


def get_selected_diagnostics(type_name, input_dir):
    filename = os.path.join(input_dir, type_name + '_sweep.csv')

    with open(filename) as f:
        raw_records = csv.DictReader(f)
        parsed = map(parse_main_sweep_record, raw_records)
        selected_model = get_selected_model_diagnostics(parsed)

    return selected_model


def get_trade_sector_in_sample_test(input_dir):
    filename = os.path.join(input_dir, 'trade_sector_sweep.csv')

    with open(filename) as f:
        raw_records = csv.DictReader(f)
        parsed = map(parse_trade_sector_record, raw_records)
        selected_model = get_selected_model_diagnostics(parsed)

    return selected_model


def main():
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        return

    output_loc = sys.argv[1]
    input_dir = sys.argv[2]

    output_record = {}

    for full_name, short_name in TYPE_NAMES.items():
        selected_model = get_selected_diagnostics(short_name, input_dir)
        output_record[full_name + 'InSampleError'] = selected_model.get_test_in_sample_error()
        output_record[full_name + 'OutSampleError'] = selected_model.get_test_out_sample_error()

    trade_sector_out_sample_loc = os.path.join(input_dir, 'trade_sector_out_sample_test.txt')
    with open(trade_sector_out_sample_loc) as f:
        trade_sector_out_sample = float(f.read().split(': ')[-1])
        output_record['tradeSectorOutSampleError'] = trade_sector_out_sample

    trade_sector_in_sample = get_trade_sector_in_sample_test(input_dir)
    output_record['tradeSectorInSampleError'] = trade_sector_in_sample.get_test_in_sample_error()

    with open(output_loc, 'w') as f:
        json.dump(output_record, f)


if __name__ == '__main__':
    main()
