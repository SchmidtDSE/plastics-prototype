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
[ ! -e third_party/tabby-ui.min.css ] && wget https://cdn.jsdelivr.net/gh/cferdinandi/tabby@12.0.3/dist/css/tabby-ui.min.css -O third_party/tabby-ui.min.css
[ ! -e third_party/tabby.min.js ] && wget https://cdn.jsdelivr.net/gh/cferdinandi/tabby@12.0.3/dist/js/tabby.min.js -O third_party/tabby.min.js
[ ! -e third_party/popper.min.js ] && wget https://unpkg.com/@popperjs/core@2.11.8/dist/umd/popper.min.js -O third_party/popper.min.js
[ ! -e third_party/simplebar.css ] && wget https://cdn.jsdelivr.net/npm/simplebar@latest/dist/simplebar.css -O third_party/simplebar.css
[ ! -e third_party/simplebar.min.js ] && wget https://cdn.jsdelivr.net/npm/simplebar@latest/dist/simplebar.min.js -O third_party/simplebar.min.js
[ ! -e third_party/tippy.min.js ] && wget https://unpkg.com/tippy.js@6.3.7/dist/tippy-bundle.umd.min.js -O third_party/tippy.min.js
[ ! -e third_party/js.cookie.min.js ] && wget https://cdn.jsdelivr.net/npm/js-cookie@3.0.5/dist/js.cookie.min.js -O third_party/js.cookie.min.js

[ ! -e third_party/pollyfill.min.js ] && wget https://polyfill.io/v3/polyfill.min.js?features=es2015%2Ces2016%2Ces2017%2Ces2018%2Ces2019%2Ces2020%2Ces2021%2Ces2022%2Ces5%2Ces6%2Ces7%2CResizeObserver -O third_party/pollyfill.min.js

[ ! -e third_party/es-module-shims.js ] && wget https://ga.jspm.io/npm:es-module-shims@1.8.0/dist/es-module-shims.js -O third_party/es-module-shims.js

echo "Installed deps."
