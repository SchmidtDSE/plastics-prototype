import datetime
import sys

USAGE = 'python update_humans.py [path to humans txt]'
NUM_ARGS = 1


def main():
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE)
        sys.exit(1)
    
    path_to_file = sys.argv[1]

    with open(path_to_file) as f:
        source = f.read()
    
    date_str = datetime.datetime.now().isoformat().split('T')[0].replace('-', '/')
    new_contents = source.replace('LAST_UPDATED', date_str)

    with open(path_to_file, 'w') as f:
        f.write(new_contents)


if __name__ == '__main__':
    main()
