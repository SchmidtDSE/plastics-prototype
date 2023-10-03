import sys

NUM_ARGS = 3
USAGE_STR = 'python preprocess_visitors.py [template] [content] [output]'


def main():
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        sys.exit(1)
    
    source_loc = sys.argv[1]
    content_loc = sys.argv[2]
    output_loc = sys.argv[3]

    with open(source_loc) as f:
        template_source = f.read()
    
    with open(content_loc) as f:
        content = f.read()
    
    rendered = template_source.replace('{{ CODE }}', content)

    with open(output_loc, 'w') as f:
        f.write(rendered)



if __name__ == '__main__':
    main()
