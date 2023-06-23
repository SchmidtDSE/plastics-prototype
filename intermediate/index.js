import antlr4 from 'antlr4';
import PlasticsLangLexer from './PlasticsLangLexer.js';
import PlasticsLangParser from './PlasticsLangParser.js';
import PlasticsLangListener from './PlasticsLangListener.js';
import PlasticsLangVisitor from './PlasticsLangVisitor.js';


function getToolkit() {
  return {
    "antlr4": antlr4,
    "PlasticsLangLexer": PlasticsLangLexer,
    "PlasticsLangParser": PlasticsLangParser,
    "PlasticsLangListener": PlasticsLangListener,
    "PlasticsLangVisitor": PlasticsLangVisitor
  };
}


export {getToolkit};