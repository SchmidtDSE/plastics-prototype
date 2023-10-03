import string
import sys

USAGE_STR = 'python render_templates.py [from] [into] [output]'
NUM_ARGS = 3


def main():
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        sys.exit(1)

    from_template_loc = sys.argv[1]
    into_template_loc = sys.argv[2]
    output_loc = sys.argv[3]

    with open(from_template_loc) as f:
        target_str = f.read()

    with open(into_template_loc) as f:
        into_template = string.Template(f.read())

    rendered = into_template.safe_substitute(target=target_str)

    with open(output_loc, 'w') as f:
        f.write(rendered)


if __name__ == '__main__':
    main()
