echo "Installing deps..."
[ ! -e test/qunit.css ] && wget https://cdnjs.cloudflare.com/ajax/libs/qunit/2.19.4/qunit.min.css -O test/qunit.css
[ ! -e test/qunit.min.js ] && wget https://cdnjs.cloudflare.com/ajax/libs/qunit/2.19.4/qunit.min.js -O test/qunit.min.js
mkdir -p third_party
[ ! -e third_party/ace.min.js ] && wget https://cdnjs.cloudflare.com/ajax/libs/ace/1.23.0/ace.min.js -O third_party/ace.min.js
[ ! -e third_party/d3.min.js ] && wget https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js -O third_party/d3.min.js
[ ! -e third_party/theme-textmate.js ] && wget https://cdnjs.cloudflare.com/ajax/libs/ace/1.23.0/theme-textmate.min.js -O third_party/theme-textmate.js
[ ! -e third_party/theme-textmate-css.js ] && wget https://cdnjs.cloudflare.com/ajax/libs/ace/1.23.0/theme-textmate-css.min.js -O third_party/theme-textmate-css.js
[ ! -e third_party/papaparse.min.js ] && wget https://raw.githubusercontent.com/mholt/PapaParse/master/papaparse.min.js -O third_party/papaparse.min.js
[ ! -e third_party/handlebars.min.js ] && wget https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.7.7/handlebars.min.js -O third_party/handlebars.min.js
echo "Installed deps."