cd language
if [ ! -f antlr-4.13.0-complete.jar ]; then
  wget https://github.com/antlr/website-antlr4/raw/gh-pages/download/antlr-4.13.0-complete.jar
fi
java -jar antlr-4.13.0-complete.jar -Dlanguage=JavaScript PlasticsLang.g4 -visitor -o ../intermediate
cd ..

cd intermediate
npm run build
cd ..

cp intermediate/static/plasticslang.js js/plastics_lang.js

python support/preprocess_visitors.py 