cd language
java -jar antlr-4.9.3-complete.jar -Dlanguage=JavaScript PlasticsLang.g4 -visitor -o ../intermediate
cd ..

cd intermediate
npm run build
cd ..

cp intermediate/static/plasticslang.js js/plastics_lang.js