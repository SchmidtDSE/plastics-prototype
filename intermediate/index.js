/**
 * Simple module entrypoint.
 * 
 * @license BSD, see LICENSE.md
 */

import antlr4 from 'antlr4';
import PlasticsLangLexer from './PlasticsLangLexer.js';
import PlasticsLangParser from './PlasticsLangParser.js';
import PlasticsLangListener from './PlasticsLangListener.js';
import PlasticsLangVisitor from './PlasticsLangVisitor.js';


/**
 * Get the ANTLR toolkit needed to process plastics language scripts.
 * 
 * @returns Toolkit components.
 */
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
