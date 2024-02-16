/**
 * Worker logic which calculates output metrics after running lever scripts.
 *
 * Worker logic which calculates output metrics after running lever scripts, including calculation
 * of polymers and GHG.
 *
 * @license BSD, see LICENSE.md
 */

// ======================
// == Cached resources ==
// ======================
// Thanks to safari shenanigans, use a cached copy of global and papaparse to avoid use of
// importScripts during offline mode.


// ======================
// == Global utilities ==
// ======================

/**
 * Calculate global statistics from region statistics for a state Map
 *
 * @param state The state Map in which the global statistics should be added.
 */
function addGlobalToState(state) {
    addGlobalToStateAttrs(state, ALL_ATTRS);
}


/**
 * Make a collection of year state Maps into percent differences.
 *
 * @param target The new values.
 * @param reference The old values.
 * @returns The states with relative values.
 */
function getRelative(target, reference) {
    const newTargetYears = new Map();

    target.forEach((targetValues, year) => {
        const referenceValues = reference.get(year);
        const newTargetValues = getRelativeSingleYear(
            targetValues,
            referenceValues,
        );
        newTargetYears.set(year, newTargetValues);
    });

    return newTargetYears;
}


/**
 * Convert a stat Map for a single year into percent change.
 *
 * @param target The new values.
 * @param reference The old values.
 * @returns The newly constructed state object (Map).
 */
function getRelativeSingleYear(target, reference) {
    const newOut = new Map();
    const targetOut = target.get("out");
    const referenceOut = reference.get("out");

    targetOut.forEach((targetRegions, region) => {
        const newRegionOut = new Map();
        targetRegions.forEach((targetValue, key) => {
            const referenceValue = referenceOut.get(region).get(key);
            const relativeValue = targetValue - referenceValue;
            newRegionOut.set(key, relativeValue);
        });
        newOut.set(region, newRegionOut);
    });

    const newGhg = new Map();
    const targetGhg = target.get("ghg");
    const referenceGhg = reference.get("ghg");

    targetGhg.forEach((targetRegions, region) => {
        const newRegionOut = new Map();
        targetRegions.forEach((targetValue, key) => {
            const referenceValue = referenceGhg.get(region).get(key);
            const relativeValue = targetValue - referenceValue;
            newRegionOut.set(key, relativeValue);
        });
        newGhg.set(region, newRegionOut);
    });

    const wrapped = new Map();
    wrapped.set("out", newOut);
    wrapped.set("ghg", newGhg);
    return wrapped;
}

/**
 * Calculate global statistics from region statistics for a state Map
 *
 * @param state The state Map in which the global statistics should be added.
 * @param attrs All attributes to add.
 */
function addGlobalToStateAttrs(state, attrs) {
    const outputs = state.get("out");
    const globalValues = new Map();
    attrs.forEach((attr) => {
        const total = Array.of(...outputs.keys())
            .filter((region) => region !== "global")
            .map((region) => outputs.get(region))
            .map((regionValues) => {
                const ATTRS_TO_ZERO = [
                    "netImportsMT",
                    "netWasteImportMT",
                ];

                const originalValue = regionValues.get(attr);
                if (ATTRS_TO_ZERO.indexOf(attr) != -1) {
                    return 0;
                } else {
                    return originalValue;
                }
            })
            .reduce((a, b) => a + b);
        globalValues.set(attr, total);
    });
    outputs.set("global", globalValues);
}

// ======================
// == Papaparse Cahced ==
// ======================

/* @license
Papa Parse
v5.4.1
https://github.com/mholt/PapaParse
License: MIT
*/
// eslint-disable-next-line
!function(e,t){"function"==typeof define&&define.amd?define([],t):"object"==typeof module&&"undefined"!=typeof exports?module.exports=t():e.Papa=t()}(this,function s(){"use strict";var f="undefined"!=typeof self?self:"undefined"!=typeof window?window:void 0!==f?f:{};var n=!f.document&&!!f.postMessage,o=f.IS_PAPA_WORKER||!1,a={},u=0,b={parse:function(e,t){var r=(t=t||{}).dynamicTyping||!1;J(r)&&(t.dynamicTypingFunction=r,r={});if(t.dynamicTyping=r,t.transform=!!J(t.transform)&&t.transform,t.worker&&b.WORKERS_SUPPORTED){var i=function(){if(!b.WORKERS_SUPPORTED)return!1;var e=(r=f.URL||f.webkitURL||null,i=s.toString(),b.BLOB_URL||(b.BLOB_URL=r.createObjectURL(new Blob(["var global = (function() { if (typeof self !== 'undefined') { return self; } if (typeof window !== 'undefined') { return window; } if (typeof global !== 'undefined') { return global; } return {}; })(); global.IS_PAPA_WORKER=true; ","(",i,")();"],{type:"text/javascript"})))),t=new f.Worker(e);var r,i;return t.onmessage=_,t.id=u++,a[t.id]=t}();return i.userStep=t.step,i.userChunk=t.chunk,i.userComplete=t.complete,i.userError=t.error,t.step=J(t.step),t.chunk=J(t.chunk),t.complete=J(t.complete),t.error=J(t.error),delete t.worker,void i.postMessage({input:e,config:t,workerId:i.id})}var n=null;b.NODE_STREAM_INPUT,"string"==typeof e?(e=function(e){if(65279===e.charCodeAt(0))return e.slice(1);return e}(e),n=t.download?new l(t):new p(t)):!0===e.readable&&J(e.read)&&J(e.on)?n=new g(t):(f.File&&e instanceof File||e instanceof Object)&&(n=new c(t));return n.stream(e)},unparse:function(e,t){var n=!1,_=!0,m=",",y="\r\n",s='"',a=s+s,r=!1,i=null,o=!1;!function(){if("object"!=typeof t)return;"string"!=typeof t.delimiter||b.BAD_DELIMITERS.filter(function(e){return-1!==t.delimiter.indexOf(e)}).length||(m=t.delimiter);("boolean"==typeof t.quotes||"function"==typeof t.quotes||Array.isArray(t.quotes))&&(n=t.quotes);"boolean"!=typeof t.skipEmptyLines&&"string"!=typeof t.skipEmptyLines||(r=t.skipEmptyLines);"string"==typeof t.newline&&(y=t.newline);"string"==typeof t.quoteChar&&(s=t.quoteChar);"boolean"==typeof t.header&&(_=t.header);if(Array.isArray(t.columns)){if(0===t.columns.length)throw new Error("Option columns is empty");i=t.columns}void 0!==t.escapeChar&&(a=t.escapeChar+s);("boolean"==typeof t.escapeFormulae||t.escapeFormulae instanceof RegExp)&&(o=t.escapeFormulae instanceof RegExp?t.escapeFormulae:/^[=+\-@\t\r].*$/)}();var u=new RegExp(Q(s),"g");"string"==typeof e&&(e=JSON.parse(e));if(Array.isArray(e)){if(!e.length||Array.isArray(e[0]))return h(null,e,r);if("object"==typeof e[0])return h(i||Object.keys(e[0]),e,r)}else if("object"==typeof e)return"string"==typeof e.data&&(e.data=JSON.parse(e.data)),Array.isArray(e.data)&&(e.fields||(e.fields=e.meta&&e.meta.fields||i),e.fields||(e.fields=Array.isArray(e.data[0])?e.fields:"object"==typeof e.data[0]?Object.keys(e.data[0]):[]),Array.isArray(e.data[0])||"object"==typeof e.data[0]||(e.data=[e.data])),h(e.fields||[],e.data||[],r);throw new Error("Unable to serialize unrecognized input");function h(e,t,r){var i="";"string"==typeof e&&(e=JSON.parse(e)),"string"==typeof t&&(t=JSON.parse(t));var n=Array.isArray(e)&&0<e.length,s=!Array.isArray(t[0]);if(n&&_){for(var a=0;a<e.length;a++)0<a&&(i+=m),i+=v(e[a],a);0<t.length&&(i+=y)}for(var o=0;o<t.length;o++){var u=n?e.length:t[o].length,h=!1,f=n?0===Object.keys(t[o]).length:0===t[o].length;if(r&&!n&&(h="greedy"===r?""===t[o].join("").trim():1===t[o].length&&0===t[o][0].length),"greedy"===r&&n){for(var d=[],l=0;l<u;l++){var c=s?e[l]:l;d.push(t[o][c])}h=""===d.join("").trim()}if(!h){for(var p=0;p<u;p++){0<p&&!f&&(i+=m);var g=n&&s?e[p]:p;i+=v(t[o][g],p)}o<t.length-1&&(!r||0<u&&!f)&&(i+=y)}}return i}function v(e,t){if(null==e)return"";if(e.constructor===Date)return JSON.stringify(e).slice(1,25);var r=!1;o&&"string"==typeof e&&o.test(e)&&(e="'"+e,r=!0);var i=e.toString().replace(u,a);return(r=r||!0===n||"function"==typeof n&&n(e,t)||Array.isArray(n)&&n[t]||function(e,t){for(var r=0;r<t.length;r++)if(-1<e.indexOf(t[r]))return!0;return!1}(i,b.BAD_DELIMITERS)||-1<i.indexOf(m)||" "===i.charAt(0)||" "===i.charAt(i.length-1))?s+i+s:i}}};if(b.RECORD_SEP=String.fromCharCode(30),b.UNIT_SEP=String.fromCharCode(31),b.BYTE_ORDER_MARK="\ufeff",b.BAD_DELIMITERS=["\r","\n",'"',b.BYTE_ORDER_MARK],b.WORKERS_SUPPORTED=!n&&!!f.Worker,b.NODE_STREAM_INPUT=1,b.LocalChunkSize=10485760,b.RemoteChunkSize=5242880,b.DefaultDelimiter=",",b.Parser=E,b.ParserHandle=r,b.NetworkStreamer=l,b.FileStreamer=c,b.StringStreamer=p,b.ReadableStreamStreamer=g,f.jQuery){var d=f.jQuery;d.fn.parse=function(o){var r=o.config||{},u=[];return this.each(function(e){if(!("INPUT"===d(this).prop("tagName").toUpperCase()&&"file"===d(this).attr("type").toLowerCase()&&f.FileReader)||!this.files||0===this.files.length)return!0;for(var t=0;t<this.files.length;t++)u.push({file:this.files[t],inputElem:this,instanceConfig:d.extend({},r)})}),e(),this;function e(){if(0!==u.length){var e,t,r,i,n=u[0];if(J(o.before)){var s=o.before(n.file,n.inputElem);if("object"==typeof s){if("abort"===s.action)return e="AbortError",t=n.file,r=n.inputElem,i=s.reason,void(J(o.error)&&o.error({name:e},t,r,i));if("skip"===s.action)return void h();"object"==typeof s.config&&(n.instanceConfig=d.extend(n.instanceConfig,s.config))}else if("skip"===s)return void h()}var a=n.instanceConfig.complete;n.instanceConfig.complete=function(e){J(a)&&a(e,n.file,n.inputElem),h()},b.parse(n.file,n.instanceConfig)}else J(o.complete)&&o.complete()}function h(){u.splice(0,1),e()}}}function h(e){this._handle=null,this._finished=!1,this._completed=!1,this._halted=!1,this._input=null,this._baseIndex=0,this._partialLine="",this._rowCount=0,this._start=0,this._nextChunk=null,this.isFirstChunk=!0,this._completeResults={data:[],errors:[],meta:{}},function(e){var t=w(e);t.chunkSize=parseInt(t.chunkSize),e.step||e.chunk||(t.chunkSize=null);this._handle=new r(t),(this._handle.streamer=this)._config=t}.call(this,e),this.parseChunk=function(e,t){if(this.isFirstChunk&&J(this._config.beforeFirstChunk)){var r=this._config.beforeFirstChunk(e);void 0!==r&&(e=r)}this.isFirstChunk=!1,this._halted=!1;var i=this._partialLine+e;this._partialLine="";var n=this._handle.parse(i,this._baseIndex,!this._finished);if(!this._handle.paused()&&!this._handle.aborted()){var s=n.meta.cursor;this._finished||(this._partialLine=i.substring(s-this._baseIndex),this._baseIndex=s),n&&n.data&&(this._rowCount+=n.data.length);var a=this._finished||this._config.preview&&this._rowCount>=this._config.preview;if(o)f.postMessage({results:n,workerId:b.WORKER_ID,finished:a});else if(J(this._config.chunk)&&!t){if(this._config.chunk(n,this._handle),this._handle.paused()||this._handle.aborted())return void(this._halted=!0);n=void 0,this._completeResults=void 0}return this._config.step||this._config.chunk||(this._completeResults.data=this._completeResults.data.concat(n.data),this._completeResults.errors=this._completeResults.errors.concat(n.errors),this._completeResults.meta=n.meta),this._completed||!a||!J(this._config.complete)||n&&n.meta.aborted||(this._config.complete(this._completeResults,this._input),this._completed=!0),a||n&&n.meta.paused||this._nextChunk(),n}this._halted=!0},this._sendError=function(e){J(this._config.error)?this._config.error(e):o&&this._config.error&&f.postMessage({workerId:b.WORKER_ID,error:e,finished:!1})}}function l(e){var i;(e=e||{}).chunkSize||(e.chunkSize=b.RemoteChunkSize),h.call(this,e),this._nextChunk=n?function(){this._readChunk(),this._chunkLoaded()}:function(){this._readChunk()},this.stream=function(e){this._input=e,this._nextChunk()},this._readChunk=function(){if(this._finished)this._chunkLoaded();else{if(i=new XMLHttpRequest,this._config.withCredentials&&(i.withCredentials=this._config.withCredentials),n||(i.onload=v(this._chunkLoaded,this),i.onerror=v(this._chunkError,this)),i.open(this._config.downloadRequestBody?"POST":"GET",this._input,!n),this._config.downloadRequestHeaders){var e=this._config.downloadRequestHeaders;for(var t in e)i.setRequestHeader(t,e[t])}if(this._config.chunkSize){var r=this._start+this._config.chunkSize-1;i.setRequestHeader("Range","bytes="+this._start+"-"+r)}try{i.send(this._config.downloadRequestBody)}catch(e){this._chunkError(e.message)}n&&0===i.status&&this._chunkError()}},this._chunkLoaded=function(){4===i.readyState&&(i.status<200||400<=i.status?this._chunkError():(this._start+=this._config.chunkSize?this._config.chunkSize:i.responseText.length,this._finished=!this._config.chunkSize||this._start>=function(e){var t=e.getResponseHeader("Content-Range");if(null===t)return-1;return parseInt(t.substring(t.lastIndexOf("/")+1))}(i),this.parseChunk(i.responseText)))},this._chunkError=function(e){var t=i.statusText||e;this._sendError(new Error(t))}}function c(e){var i,n;(e=e||{}).chunkSize||(e.chunkSize=b.LocalChunkSize),h.call(this,e);var s="undefined"!=typeof FileReader;this.stream=function(e){this._input=e,n=e.slice||e.webkitSlice||e.mozSlice,s?((i=new FileReader).onload=v(this._chunkLoaded,this),i.onerror=v(this._chunkError,this)):i=new FileReaderSync,this._nextChunk()},this._nextChunk=function(){this._finished||this._config.preview&&!(this._rowCount<this._config.preview)||this._readChunk()},this._readChunk=function(){var e=this._input;if(this._config.chunkSize){var t=Math.min(this._start+this._config.chunkSize,this._input.size);e=n.call(e,this._start,t)}var r=i.readAsText(e,this._config.encoding);s||this._chunkLoaded({target:{result:r}})},this._chunkLoaded=function(e){this._start+=this._config.chunkSize,this._finished=!this._config.chunkSize||this._start>=this._input.size,this.parseChunk(e.target.result)},this._chunkError=function(){this._sendError(i.error)}}function p(e){var r;h.call(this,e=e||{}),this.stream=function(e){return r=e,this._nextChunk()},this._nextChunk=function(){if(!this._finished){var e,t=this._config.chunkSize;return t?(e=r.substring(0,t),r=r.substring(t)):(e=r,r=""),this._finished=!r,this.parseChunk(e)}}}function g(e){h.call(this,e=e||{});var t=[],r=!0,i=!1;this.pause=function(){h.prototype.pause.apply(this,arguments),this._input.pause()},this.resume=function(){h.prototype.resume.apply(this,arguments),this._input.resume()},this.stream=function(e){this._input=e,this._input.on("data",this._streamData),this._input.on("end",this._streamEnd),this._input.on("error",this._streamError)},this._checkIsFinished=function(){i&&1===t.length&&(this._finished=!0)},this._nextChunk=function(){this._checkIsFinished(),t.length?this.parseChunk(t.shift()):r=!0},this._streamData=v(function(e){try{t.push("string"==typeof e?e:e.toString(this._config.encoding)),r&&(r=!1,this._checkIsFinished(),this.parseChunk(t.shift()))}catch(e){this._streamError(e)}},this),this._streamError=v(function(e){this._streamCleanUp(),this._sendError(e)},this),this._streamEnd=v(function(){this._streamCleanUp(),i=!0,this._streamData("")},this),this._streamCleanUp=v(function(){this._input.removeListener("data",this._streamData),this._input.removeListener("end",this._streamEnd),this._input.removeListener("error",this._streamError)},this)}function r(m){var a,o,u,i=Math.pow(2,53),n=-i,s=/^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/,h=/^((\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)))$/,t=this,r=0,f=0,d=!1,e=!1,l=[],c={data:[],errors:[],meta:{}};if(J(m.step)){var p=m.step;m.step=function(e){if(c=e,_())g();else{if(g(),0===c.data.length)return;r+=e.data.length,m.preview&&r>m.preview?o.abort():(c.data=c.data[0],p(c,t))}}}function y(e){return"greedy"===m.skipEmptyLines?""===e.join("").trim():1===e.length&&0===e[0].length}function g(){return c&&u&&(k("Delimiter","UndetectableDelimiter","Unable to auto-detect delimiting character; defaulted to '"+b.DefaultDelimiter+"'"),u=!1),m.skipEmptyLines&&(c.data=c.data.filter(function(e){return!y(e)})),_()&&function(){if(!c)return;function e(e,t){J(m.transformHeader)&&(e=m.transformHeader(e,t)),l.push(e)}if(Array.isArray(c.data[0])){for(var t=0;_()&&t<c.data.length;t++)c.data[t].forEach(e);c.data.splice(0,1)}else c.data.forEach(e)}(),function(){if(!c||!m.header&&!m.dynamicTyping&&!m.transform)return c;function e(e,t){var r,i=m.header?{}:[];for(r=0;r<e.length;r++){var n=r,s=e[r];m.header&&(n=r>=l.length?"__parsed_extra":l[r]),m.transform&&(s=m.transform(s,n)),s=v(n,s),"__parsed_extra"===n?(i[n]=i[n]||[],i[n].push(s)):i[n]=s}return m.header&&(r>l.length?k("FieldMismatch","TooManyFields","Too many fields: expected "+l.length+" fields but parsed "+r,f+t):r<l.length&&k("FieldMismatch","TooFewFields","Too few fields: expected "+l.length+" fields but parsed "+r,f+t)),i}var t=1;!c.data.length||Array.isArray(c.data[0])?(c.data=c.data.map(e),t=c.data.length):c.data=e(c.data,0);m.header&&c.meta&&(c.meta.fields=l);return f+=t,c}()}function _(){return m.header&&0===l.length}function v(e,t){return r=e,m.dynamicTypingFunction&&void 0===m.dynamicTyping[r]&&(m.dynamicTyping[r]=m.dynamicTypingFunction(r)),!0===(m.dynamicTyping[r]||m.dynamicTyping)?"true"===t||"TRUE"===t||"false"!==t&&"FALSE"!==t&&(function(e){if(s.test(e)){var t=parseFloat(e);if(n<t&&t<i)return!0}return!1}(t)?parseFloat(t):h.test(t)?new Date(t):""===t?null:t):t;var r}function k(e,t,r,i){var n={type:e,code:t,message:r};void 0!==i&&(n.row=i),c.errors.push(n)}this.parse=function(e,t,r){var i=m.quoteChar||'"';if(m.newline||(m.newline=function(e,t){e=e.substring(0,1048576);var r=new RegExp(Q(t)+"([^]*?)"+Q(t),"gm"),i=(e=e.replace(r,"")).split("\r"),n=e.split("\n"),s=1<n.length&&n[0].length<i[0].length;if(1===i.length||s)return"\n";for(var a=0,o=0;o<i.length;o++)"\n"===i[o][0]&&a++;return a>=i.length/2?"\r\n":"\r"}(e,i)),u=!1,m.delimiter)J(m.delimiter)&&(m.delimiter=m.delimiter(e),c.meta.delimiter=m.delimiter);else{var n=function(e,t,r,i,n){var s,a,o,u;n=n||[",","\t","|",";",b.RECORD_SEP,b.UNIT_SEP];for(var h=0;h<n.length;h++){var f=n[h],d=0,l=0,c=0;o=void 0;for(var p=new E({comments:i,delimiter:f,newline:t,preview:10}).parse(e),g=0;g<p.data.length;g++)if(r&&y(p.data[g]))c++;else{var _=p.data[g].length;l+=_,void 0!==o?0<_&&(d+=Math.abs(_-o),o=_):o=_}0<p.data.length&&(l/=p.data.length-c),(void 0===a||d<=a)&&(void 0===u||u<l)&&1.99<l&&(a=d,s=f,u=l)}return{successful:!!(m.delimiter=s),bestDelimiter:s}}(e,m.newline,m.skipEmptyLines,m.comments,m.delimitersToGuess);n.successful?m.delimiter=n.bestDelimiter:(u=!0,m.delimiter=b.DefaultDelimiter),c.meta.delimiter=m.delimiter}var s=w(m);return m.preview&&m.header&&s.preview++,a=e,o=new E(s),c=o.parse(a,t,r),g(),d?{meta:{paused:!0}}:c||{meta:{paused:!1}}},this.paused=function(){return d},this.pause=function(){d=!0,o.abort(),a=J(m.chunk)?"":a.substring(o.getCharIndex())},this.resume=function(){t.streamer._halted?(d=!1,t.streamer.parseChunk(a,!0)):setTimeout(t.resume,3)},this.aborted=function(){return e},this.abort=function(){e=!0,o.abort(),c.meta.aborted=!0,J(m.complete)&&m.complete(c),a=""}}function Q(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function E(j){var z,M=(j=j||{}).delimiter,P=j.newline,U=j.comments,q=j.step,N=j.preview,B=j.fastMode,K=z=void 0===j.quoteChar||null===j.quoteChar?'"':j.quoteChar;if(void 0!==j.escapeChar&&(K=j.escapeChar),("string"!=typeof M||-1<b.BAD_DELIMITERS.indexOf(M))&&(M=","),U===M)throw new Error("Comment character same as delimiter");!0===U?U="#":("string"!=typeof U||-1<b.BAD_DELIMITERS.indexOf(U))&&(U=!1),"\n"!==P&&"\r"!==P&&"\r\n"!==P&&(P="\n");var W=0,H=!1;this.parse=function(i,t,r){if("string"!=typeof i)throw new Error("Input must be a string");var n=i.length,e=M.length,s=P.length,a=U.length,o=J(q),u=[],h=[],f=[],d=W=0;if(!i)return L();if(j.header&&!t){var l=i.split(P)[0].split(M),c=[],p={},g=!1;for(var _ in l){var m=l[_];J(j.transformHeader)&&(m=j.transformHeader(m,_));var y=m,v=p[m]||0;for(0<v&&(g=!0,y=m+"_"+v),p[m]=v+1;c.includes(y);)y=y+"_"+v;c.push(y)}if(g){var k=i.split(P);k[0]=c.join(M),i=k.join(P)}}if(B||!1!==B&&-1===i.indexOf(z)){for(var b=i.split(P),E=0;E<b.length;E++){if(f=b[E],W+=f.length,E!==b.length-1)W+=P.length;else if(r)return L();if(!U||f.substring(0,a)!==U){if(o){if(u=[],I(f.split(M)),F(),H)return L()}else I(f.split(M));if(N&&N<=E)return u=u.slice(0,N),L(!0)}}return L()}for(var w=i.indexOf(M,W),R=i.indexOf(P,W),C=new RegExp(Q(K)+Q(z),"g"),S=i.indexOf(z,W);;)if(i[W]!==z)if(U&&0===f.length&&i.substring(W,W+a)===U){if(-1===R)return L();W=R+s,R=i.indexOf(P,W),w=i.indexOf(M,W)}else if(-1!==w&&(w<R||-1===R))f.push(i.substring(W,w)),W=w+e,w=i.indexOf(M,W);else{if(-1===R)break;if(f.push(i.substring(W,R)),D(R+s),o&&(F(),H))return L();if(N&&u.length>=N)return L(!0)}else for(S=W,W++;;){if(-1===(S=i.indexOf(z,S+1)))return r||h.push({type:"Quotes",code:"MissingQuotes",message:"Quoted field unterminated",row:u.length,index:W}),T();if(S===n-1)return T(i.substring(W,S).replace(C,z));if(z!==K||i[S+1]!==K){if(z===K||0===S||i[S-1]!==K){-1!==w&&w<S+1&&(w=i.indexOf(M,S+1)),-1!==R&&R<S+1&&(R=i.indexOf(P,S+1));var O=A(-1===R?w:Math.min(w,R));if(i.substr(S+1+O,e)===M){f.push(i.substring(W,S).replace(C,z)),i[W=S+1+O+e]!==z&&(S=i.indexOf(z,W)),w=i.indexOf(M,W),R=i.indexOf(P,W);break}var x=A(R);if(i.substring(S+1+x,S+1+x+s)===P){if(f.push(i.substring(W,S).replace(C,z)),D(S+1+x+s),w=i.indexOf(M,W),S=i.indexOf(z,W),o&&(F(),H))return L();if(N&&u.length>=N)return L(!0);break}h.push({type:"Quotes",code:"InvalidQuotes",message:"Trailing quote on quoted field is malformed",row:u.length,index:W}),S++}}else S++}return T();function I(e){u.push(e),d=W}function A(e){var t=0;if(-1!==e){var r=i.substring(S+1,e);r&&""===r.trim()&&(t=r.length)}return t}function T(e){return r||(void 0===e&&(e=i.substring(W)),f.push(e),W=n,I(f),o&&F()),L()}function D(e){W=e,I(f),f=[],R=i.indexOf(P,W)}function L(e){return{data:u,errors:h,meta:{delimiter:M,linebreak:P,aborted:H,truncated:!!e,cursor:d+(t||0)}}}function F(){q(L()),u=[],h=[]}},this.abort=function(){H=!0},this.getCharIndex=function(){return W}}function _(e){var t=e.data,r=a[t.workerId],i=!1;if(t.error)r.userError(t.error,t.file);else if(t.results&&t.results.data){var n={abort:function(){i=!0,m(t.workerId,{data:[],errors:[],meta:{aborted:!0}})},pause:y,resume:y};if(J(r.userStep)){for(var s=0;s<t.results.data.length&&(r.userStep({data:t.results.data[s],errors:t.results.errors,meta:t.results.meta},n),!i);s++);delete t.results}else J(r.userChunk)&&(r.userChunk(t.results,n,t.file),delete t.results)}t.finished&&!i&&m(t.workerId,t.results)}function m(e,t){var r=a[e];J(r.userComplete)&&r.userComplete(t),r.terminate(),delete a[e]}function y(){throw new Error("Not implemented.")}function w(e){if("object"!=typeof e||null===e)return e;var t=Array.isArray(e)?[]:{};for(var r in e)t[r]=w(e[r]);return t}function v(e,t){return function(){e.apply(t,arguments)}}function J(e){return"function"==typeof e}return o&&(f.onmessage=function(e){var t=e.data;void 0===b.WORKER_ID&&t&&(b.WORKER_ID=t.workerId);if("string"==typeof t.input)f.postMessage({workerId:b.WORKER_ID,results:b.parse(t.input,t.config),finished:!0});else if(f.File&&t.input instanceof File||t.input instanceof Object){var r=b.parse(t.input,t.config);r&&f.postMessage({workerId:b.WORKER_ID,results:r,finished:!0})}}),(l.prototype=Object.create(h.prototype)).constructor=l,(c.prototype=Object.create(h.prototype)).constructor=c,(p.prototype=Object.create(p.prototype)).constructor=p,(g.prototype=Object.create(h.prototype)).constructor=g,b});


// ======================
// == Main Body Source ==
// ======================
// Actual code for the polymers worker.

// Create a separate cache buster for the worker
const CACHE_BUSTER = Date.now();

// Define expected attributes of final products and their associated polymer pipeline types
const GOODS = [
    {"attr": "consumptionTransportationMT", "subtype": "transportation"},
    {"attr": "consumptionPackagingMT", "subtype": "packaging"},
    {"attr": "consumptionConstructionMT", "subtype": "building_construction"},
    {"attr": "consumptionElectronicMT", "subtype": "electrical_electronic"},
    {"attr": "consumptionHouseholdLeisureSportsMT", "subtype": "household_leisure_sports"},
    {"attr": "consumptionAgricultureMT", "subtype": "agriculture"},
    {"attr": "consumptionOtherMT", "subtype": "others"},
];

// Define mapping to levers which indicate the amount of additives
const ADDITIVES_KEYS = {
    "transportation": "PercentTransportationAdditives",
    "packaging": "PercentPackagingAdditives",
    "building_construction": "PercentConstructionAdditives",
    "electrical_electronic": "PercentElectronicAdditives",
    "household_leisure_sports": "PercentHouseholdLeisureSportsAdditives",
    "agriculture": "PercentAgricultureAdditives",
    "textiles": "PercentTextileAdditives",
    "others": "PercentOtherAdditives",
};

// Define expected resin subtypes which may contain multiple polymers.
const RESIN_SUBTYPES = [
    "pp",
    "ps",
    "pvc",
    "100% otp",
    "50% otp, 50% ots",
    "pet",
    "pur",
];

// Make mapping between polymers and the levers' names for those polymers with GHG intensities.
const GHGS = [
    {"leverName": "PET", "polymerName": "pet"},
    {"leverName": "HDPE", "polymerName": "hdpe"},
    {"leverName": "PVC", "polymerName": "pvc"},
    {"leverName": "LLDPE", "polymerName": "ldpe"},
    {"leverName": "PP", "polymerName": "pp"},
    {"leverName": "PS", "polymerName": "ps"},
    {"leverName": "PUR", "polymerName": "pur"},
    {"leverName": "PPA", "polymerName": "pp&a fibers"},
    {"leverName": "Additives", "polymerName": "additives"},
    {"leverName": "OtherThermoplastics", "polymerName": "other thermoplastics"},
    {"leverName": "OtherThermosets", "polymerName": "other thermosets"},
];

// Just the polymer names
const POLYMER_NAMES = GHGS.map((x) => x["polymerName"]);

// Get list of polymers expected recyclable
const RECYCLABLE_POLYMER_NAMES = POLYMER_NAMES.filter(
    (x) => x!== "other thermosets" && x !== "pur",
);

// Get lever names corresponding to expected recyclables
const RECYCLABLE_LEVER_NAMES = GHGS
    .filter((x) => RECYCLABLE_POLYMER_NAMES.indexOf(x["polymerName"]) != -1)
    .map((x) => x["leverName"]);

// Make mapping between the levers' names for EOL fates and the output attributes for those volumes.
const EOLS = [
    {"leverName": "Landfill", "attr": "eolLandfillMT"},
    {"leverName": "Incineration", "attr": "eolIncinerationMT"},
    {"leverName": "Recycling", "attr": "eolRecyclingMT"},
    {"leverName": "Mismanaged", "attr": "eolMismanagedMT"},
];

const EOL_LEVERS = EOLS.map((x) => x["leverName"]);

// Set max number of iterations for back-propagation to meet constraints.
const MAX_NORM_ITERATIONS = 20;

// Define expected polymer names and subtypes along with output attribute for textiles.
const TEXTILE_POLYMER = "pp&a fibers";
const TEXTILE_ATTR = "consumptionTextileMT";
const TEXTILES_SUBTYPE = "textiles";

// Expected additives polymer name
const ADDITIVES_POLYMER = "additives";


/**
 * Make a string key representing the identity of an object.
 *
 * @param pieces Pieces of the identity which are case insensitive.
 * @returns Uniquely identifying string.
 */
function makeKey(pieces) {
    const piecesStr = pieces.map((x) => x + "");
    const piecesLower = piecesStr.map((x) => x.toLowerCase());
    return piecesLower.join("\t");
}


/**
 * Information about a polymer (like ps) in a subtype (like transportation).
 */
class PolymerInfo {
    /**
     * Create a new polymer information record.
     *
     * @param subtype The type in which this polymer is found like packaging.
     * @param region The region for which this polymer record is provided like china.
     * @param polymer The name of the polymer that this record represents like pet.
     * @param percent The percent of plastic mass in this subtype in this region that this polymer
     *      represents.
     * @param series The subtype's series like goods.
     */
    constructor(subtype, region, polymer, percent, series) {
        const self = this;
        self._subtype = subtype;
        self._region = region;
        self._polymer = polymer;
        self._percent = percent;
        self._series = series;
    }

    /**
     * Get the subtype in which this polymer is found.
     *
     * @returns Subtype like "50% otp, 50% ots" or packaging.
     */
    getSubtype() {
        const self = this;
        return self._subtype;
    }

    /**
     * Get the name of the region for which this record is made.
     *
     * @returns Region name like china or nafta.
     */
    getRegion() {
        const self = this;
        return self._region;
    }

    /**
     * Get the name of the polymer that this record describes.
     *
     * @returns The polymer name like "pp" or "pet".
     */
    getPolymer() {
        const self = this;
        return self._polymer;
    }

    /**
     * Get the percent by mass that this record's polymer represents in this region and subtype.
     *
     * @returns The percent of plastic mass in this subtype in this region that this polymer
     *      represents.
     */
    getPercent() {
        const self = this;
        return self._percent;
    }

    /**
     * Get the series that this record is part of.
     *
     * @returns The series name like "goods" or "resin".
     */
    getSeries() {
        const self = this;
        return self._series;
    }

    /**
     * Get a string key uniquely identifying this record.
     *
     * @returns Key identifying the combination of region, subtype, and polymer.
     */
    getKey() {
        const self = this;
        return getPolymerKey(self._region, self._subtype, self._polymer);
    }
}


/**
 * Get the string key describing a combination of region, subtype, and polymer.
 *
 * @param region The region like china case insensitive.
 * @param subtype The subtype like packaging case insensitive.
 * @param polymer The polymer like pet case insensitive.
 * @returns String identifying a PolymerInfo.
 */
function getPolymerKey(region, subtype, polymer) {
    const pieces = [region, subtype, polymer];
    return makeKey(pieces);
}


/**
 * Information about a subtype of material to track.
 *
 * Information about a subtype of material to track including the volume ratio like between a type
 * of trade and overall trade within a region and year.
 */
class SubtypeInfo {
    /**
     * Create a new record of material subtype.
     *
     * @param year The year in which subtype information are available like 2050.
     * @param region The region like china in which the subtype information are available.
     * @param subtype The name of the subtype like transportation.
     * @param ratio The ratio of the subtype volume to the overall volume.
     */
    constructor(year, region, subtype, ratio) {
        const self = this;
        self._year = year;
        self._region = region;
        self._subtype = subtype;
        self._ratio = ratio;
    }

    /**
     * Get the year for which this information is available.
     *
     * @returns The year in which subtype information are available like 2050.
     */
    getYear() {
        const self = this;
        return self._year;
    }

    /**
     * Get the location for which this information is avilable.
     *
     * @returns The region like china in which the subtype information are available.
     */
    getRegion() {
        const self = this;
        return self._region;
    }

    /**
     * Get the type of volume described by this record.
     *
     * @returns The name of the subtype like transportation.
     */
    getSubtype() {
        const self = this;
        return self._subtype;
    }

    /**
     * Get the volume ratio for this subtype in this year / region.
     *
     * @returns The ratio of the subtype volume to the overall volume such as subtype trade ratio to
     *      overall net trade ratio.
     */
    getRatio() {
        const self = this;
        return self._ratio;
    }

    /**
     * Get a string uniquely identifying this record.
     *
     * @returns String uniquely identifying this combination of year, region, and subtype.
     */
    getKey() {
        const self = this;
        return getSubtypeKey(self._year, self._region, self._subtype);
    }
}


/**
 * Get a string uniquely identifying a subtype information record.
 *
 * @returns String uniquely identifying this combination of year, region, and subtype.
 */
function getSubtypeKey(year, region, subtype) {
    return year + "\t" + region + "\t" + subtype;
}


/**
 * Object describing an observed or predicted resin trade volume.
 */
class ResinTrade {
    /**
     * Create a new resin trade record.
     *
     * @param year The year for which this volume is provided like 2050.
     * @param region The region for which this volume is provided like eu30.
     * @param netImportResin The net amount of resin imported across all polymers.
     */
    constructor(year, region, netImportResin) {
        const self = this;
        self._year = year;
        self._region = region;
        self._netImportResin = netImportResin;
    }

    /**
     * Get the year for which this information is available.
     *
     * @returns The year for which this volume is provided like 2050.
     */
    getYear() {
        const self = this;
        return self._year;
    }

    /**
     * Get the location of this volume.
     *
     * @returns The region for which this volume is provided like eu30.
     */
    getRegion() {
        const self = this;
        return self._region;
    }

    /**
     * Get the net import of resin for this region / year as a sum across all polymers.
     *
     * @returns The net amount of resin imported across all polymers.
     */
    getNetImportResin() {
        const self = this;
        return self._netImportResin;
    }

    /**
     * Get a string uniquely identifying this resin trade record.
     *
     * @returns String describing this combination of year and region.
     */
    getKey() {
        const self = this;
        return getResinTradeKey(self._year, self._region);
    }
}


/**
 * Get a string uniquely describing this resin trade volume.
 *
 * @param year The year of the record.
 * @param region The region of the record.
 * @returns String uniquely describing the combination of year and region.
 */
function getResinTradeKey(year, region) {
    const pieces = [year, region];
    return makeKey(pieces);
}


/**
 * Collection of matricies for subtypes and their polymers.
 */
class PolymerMatricies {
    /**
     * Create a new empty set of matricies.
     */
    constructor() {
        const self = this;
        self._polymerInfos = new Map();
        self._subtypeInfos = new Map();
        self._resinTradeInfos = new Map();

        self._subtypes = new Set();
        self._years = new Set();
        self._regions = new Set();
        self._polymers = new Set();
        self._series = new Set();
    }

    /**
     * Add information about a polymer within a subtype.
     *
     * @param target New PolymerInfo object to register.
     */
    addPolymer(target) {
        const self = this;
        self._polymerInfos.set(target.getKey(), target);
        self._subtypes.add(target.getSubtype());
        self._regions.add(target.getRegion());
        self._polymers.add(target.getPolymer());
        self._series.add(target.getSeries());
    }

    /**
     * Get information on an individual polymer like ps within a subtype like packaging.
     *
     * @param region The region like eu30 case insensitive.
     * @param subtype The subtype like transportation case insensitive.
     * @param polymer The name of the polymer like pur case insensitive.
     * @returns Corresponding PolymerInfo object.
     */
    getPolymer(region, subtype, polymer) {
        const self = this;
        const key = getPolymerKey(region, subtype, polymer);
        return self._polymerInfos.get(key);
    }

    /**
     * Add information about a subtype.
     *
     * @param target New SubtypeInfo object to register.
     */
    addSubtype(target) {
        const self = this;
        self._subtypeInfos.set(target.getKey(), target);
        self._years.add(target.getYear());
        self._regions.add(target.getRegion());
        self._subtypes.add(target.getSubtype());
    }

    /**
     * Get information about a subtype.
     *
     * @param year The year for which subtype info is requested like 2050.
     * @param region The region in which subtype info is requested like nafta case insensitive.
     * @param subtype The subtype like transportation case insensitive.
     * @returns SubtypeInfo object.
     */
    getSubtype(year, region, subtype) {
        const self = this;
        const key = getSubtypeKey(year, region, subtype);
        return self._subtypeInfos.get(key);
    }

    /**
     * Add information about resin trade.
     *
     * @param target New ResinTrade object to register.
     */
    addResinTrade(target) {
        const self = this;
        self._resinTradeInfos.set(target.getKey(), target);
        self._years.add(target.getYear());
        self._regions.add(target.getRegion());
    }

    /**
     * Get information about resin trade.
     *
     * @param year The year for which net resin trade is desired like 2050.
     * @param region The region for which net resin trade is desired like row case insensitive.
     * @returns New ResinTrade object.
     */
    getResinTrade(year, region) {
        const self = this;
        const key = getResinTradeKey(year, region);
        return self._resinTradeInfos.get(key);
    }

    /**
     * Get the set of unique subtypes observed across matricies like packaging.
     *
     * @returns Set of strings representing unique subtypes observed. No order guaranteed.
     */
    getSubtypes() {
        const self = this;
        return self._subtypes;
    }

    /**
     * Get unique regions found within these matricies like eu30.
     *
     * @returns Set of strings representing unique regions observed. No order guaranteed.
     */
    getRegions() {
        const self = this;
        return self._regions;
    }

    /**
     * Get unique polymers found within these matricies like pur.
     *
     * @returns Set of strings representing unique polymers observed. No order guaranteed.
     */
    getPolymers() {
        const self = this;
        return self._polymers;
    }

    /**
     * Get unique series found within these matricies like goods or resin.
     *
     * @returns Set of strings representing unique series observed. No order guaranteed.
     */
    getSeries() {
        const self = this;
        return self._series;
    }
}


/**
 * A decorator for PolymerMatricies which makes it immutable.
 */
class ImmutablePolymerMatricies {
    /**
     * Decorate a polymer matricies set to make it immutable.
     *
     * @param inner The matricies to make immutable.
     */
    constructor(inner) {
        const self = this;
        self._inner = inner;
    }

    /**
     * Get information on an individual polymer like ps within a subtype like packaging.
     *
     * @param region The region like eu30 case insensitive.
     * @param subtype The subtype like transportation case insensitive.
     * @param polymer The name of the polymer like pur case insensitive.
     * @returns Corresponding PolymerInfo object.
     */
    getPolymer(region, subtype, polymer) {
        const self = this;
        return self._inner.getPolymer(region, subtype, polymer);
    }

    /**
     * Get information about a subtype.
     *
     * @param year The year for which subtype info is requested like 2050.
     * @param region The region in which subtype info is requested like nafta case insensitive.
     * @param subtype The subtype like transportation case insensitive.
     * @returns SubtypeInfo object.
     */
    getSubtype(year, region, subtype) {
        const self = this;
        return self._inner.getSubtype(year, region, subtype);
    }

    /**
     * Get information about resin trade.
     *
     * @param year The year for which net resin trade is desired like 2050.
     * @param region The region for which net resin trade is desired like row case insensitive.
     * @returns New ResinTrade object.
     */
    getResinTrade(year, region) {
        const self = this;
        return self._inner.getResinTrade(year, region);
    }

    /**
     * Get the set of unique subtypes observed across matricies like packaging.
     *
     * @returns Set of strings representing unique subtypes observed. No order guaranteed.
     */
    getSubtypes() {
        const self = this;
        return self._inner.getSubtypes();
    }

    /**
     * Get unique regions found within these matricies like eu30.
     *
     * @returns Set of strings representing unique regions observed. No order guaranteed.
     */
    getRegions() {
        const self = this;
        return self._inner.getRegions();
    }

    /**
     * Get unique polymers found within these matricies like pur.
     *
     * @returns Set of strings representing unique polymers observed. No order guaranteed.
     */
    getPolymers() {
        const self = this;
        return self._inner.getPolymers();
    }

    /**
     * Get unique series found within these matricies like goods or resin.
     *
     * @returns Set of strings representing unique series observed. No order guaranteed.
     */
    getSeries() {
        const self = this;
        return self._inner.getSeries();
    }
}


/**
 * Facade which modifies states to include polymers, ghg, and global values.
 */
class StateModifier {
    /**
     * Create a new modifier.
     *
     * @param matricies The matricies to use in modifying states.
     */
    constructor(matricies) {
        const self = this;
        self._matricies = matricies;
    }

    /**
     * Modify a state to include polymers, ghg, and global values.
     *
     * @param year The year that the state object represents.
     * @param state The state object (Map) to modify. This will be modified in place.
     * @param attrs The attributes to include in global calculation.
     * @returns Modified state object which is the input state modified in place.
     */
    modify(year, state, attrs) {
        const self = this;

        // Make override
        self._addOverrides(state, year);

        // Prepare polymers
        self._addDetailedTrade(year, state);
        self._normalizeDetailedTrade(year, state);
        self._calculatePolymers(year, state);

        // Prepare GHG
        self._makeGhgInState(state);
        self._calculateStartOfLifeGhg(state);
        self._calculateEndOfLifeGhg(state);

        // Create summation
        self._addOutputGlobalToStateAttrs(state, attrs);
        self._calculateOverallGhg(year, state);

        return state;
    }

    /**
     * Add polymer ratio overrides specific to this state / year.
     *
     * @param state The state object (Map) in which to add the overrides. Modified in place.
     * @param year The year that the state object represents.
     * @returns Modified state object (Map).
     */
    _addOverrides(state, year) {
        const self = this;
        const overrides = new Map();

        // Deal with PS in packaging
        const regions = Array.of(...state.get("out").keys());
        regions.forEach((region) => {
            const packagingPolymers = new Map();

            POLYMER_NAMES.forEach((polymer) => {
                const polymerPercent = self._getPolymerPercent(
                    state,
                    year,
                    region,
                    "packaging",
                    polymer,
                );
                packagingPolymers.set(polymer, polymerPercent);
            });

            const percentRemaining = self._getPercentPackagingPsRemaining(state, year, region);
            const newPs = packagingPolymers.get("ps") * percentRemaining;
            const changePs = packagingPolymers.get("ps") * (1 - percentRemaining);
            packagingPolymers.set("ps", newPs);

            const otherPolymers = POLYMER_NAMES.filter((x) => x !== "ps");
            const individualAdjValues = otherPolymers.map((x) => packagingPolymers.get(x));
            const otherTotal = individualAdjValues.reduce((a, b) => a + b);

            otherPolymers.forEach((x) => {
                const currentValue = packagingPolymers.get(x);
                const percentOfOther = currentValue / otherTotal;
                const offset = percentOfOther * changePs;
                packagingPolymers.set(x, offset + currentValue);
            });

            POLYMER_NAMES.forEach((polymer) => {
                const key = self._getOverrideKey(region, "packaging", polymer);
                overrides.set(key, packagingPolymers.get(polymer));
            });
        });

        state.set("polymerOverrides", overrides);

        return state;
    }

    /**
     * Get the percent of polystyrene remaining in packaging relative to BAU.
     *
     * Get the percent of polystyrene remaining in packaging relative to business as usual where
     * this percentage is modified by policies.
     *
     * @param state The state object (Map) from which the percentage should be derived.
     * @param year The year represented by the state object.
     * @param region The region like nafta for which the percentage is desired.
     * @returns Percentage (0 - 1) of the amount of polystyrene still in packaging relative to BAU.
     */
    _getPercentPackagingPsRemaining(state, year, region) {
        const self = this;
        const inputs = state.get("in");

        const startYear = inputs.get("startYear");
        const endYear = inputs.get("endYearImmediate");
        if (year < startYear) {
            return 1;
        }

        const percentReductionTarget = inputs.get(region + "PercentReducePs") / 100;
        const done = year >= endYear;
        const duration = endYear - startYear;
        const yearsEllapsed = year - startYear;
        const percentReductionInterpolate = yearsEllapsed / duration * percentReductionTarget;
        const percentReduction = done ? percentReductionTarget : percentReductionInterpolate;

        return 1 - percentReduction;
    }

    /**
     * Get the percent of additives remaining in all sectors relative to BAU.
     *
     * Get the percent of additives remaining in all sectors relative to business as usual where
     * this percentage is changed through policies.
     *
     * @param state The state object (Map) from which this percentage should be derived.
     * @param year The year represented by the state object.
     * @param region The region for which the percentage should be generated.
     * @returns Percentage of additives remaining as a number between 0 and 1.
     */
    _getAdditivesRemaining(state, year, region) {
        const self = this;
        const inputs = state.get("in");

        const startYear = inputs.get("startYear");
        const endYear = inputs.get("endYearImmediate");
        if (year < startYear) {
            return 1;
        }

        const key = region + "AdditivesPercentReduction";
        const testing = !inputs.has(key);
        if (testing) {
            return 1;
        }

        const percentReductionTarget = inputs.get(key) / 100;
        const done = year >= endYear;
        const duration = endYear - startYear;
        const yearsEllapsed = year - startYear;
        const percentReductionInterpolate = yearsEllapsed / duration * percentReductionTarget;
        const percentReduction = done ? percentReductionTarget : percentReductionInterpolate;

        return 1 - percentReduction;
    }

    /**
     * Create a new empty GHG record in the state object (Map).
     *
     * @param state The state in which to make the empty GHG record to be filled in further at later
     *      steps.
     */
    _makeGhgInState(state) {
        const self = this;
        const regions = Array.of(...state.get("out").keys());
        const ghgMap = new Map();
        regions.forEach((region) => {
            ghgMap.set(region, new Map());
        });
        state.set("ghg", ghgMap);
        return state;
    }

    /**
     * Add net trade at the subtype level into a state object.
     *
     * @param year The year represented by the given state object.
     * @param state The state object (Map) to modify in place to include detailed trade.
     * @returns The provided state object which was modified in place.
     */
    _addDetailedTrade(year, state) {
        const self = this;
        const subtypes = self._getAllSubtypes();
        const regions = Array.of(...state.get("out").keys());
        const tradeMap = new Map();
        regions.forEach((region) => {
            const out = state.get("out").get(region);
            const netTrade = self._getNetTrade(out);
            const regionMap = new Map();
            subtypes.forEach((subtype) => {
                const subtypeInfo = self._matricies.getSubtype(year, region, subtype);
                const ratio = subtypeInfo.getRatio();
                const subtypeVolume = ratio * netTrade;
                regionMap.set(subtype, subtypeVolume);
            });
            tradeMap.set(region, regionMap);
        });
        state.set("trade", tradeMap);
        return state;
    }

    /**
     * Calculate polymer levels (polymer-level volume by region) and put them in a state object.
     *
     * @param year The year for which the state object is provided.
     * @param state The state object (Map) in which to create the polymer counts. Modified in place.
     * @returns The input state object after in-place modification.
     */
    _calculatePolymers(year, state) {
        const self = this;

        const regions = Array.of(...state.get("out").keys());
        const polymerMap = new Map();
        regions.forEach((region) => {
            const goodsPolymers = self._getGoodsPolymers(region, state, year);
            const textilePolymers = self._getTextilePolymers(region, state, year);
            const consumptionPolymers = self._combinePolymerVectors(goodsPolymers, textilePolymers);

            const goodsSubtypes = GOODS.map((x) => x["subtype"]);
            const getTrade = (subtypes) => {
                return self._getTradePolymers(year, region, state, subtypes);
            };

            const goodsTradeSubtypes = [goodsSubtypes, [TEXTILES_SUBTYPE]];
            const goodsTradePolymersSeparate = goodsTradeSubtypes.map(getTrade);
            const goodsTradePolymers = goodsTradePolymersSeparate.reduce(
                (a, b) => self._combinePolymerVectors(a, b),
            );

            const resinTradePolymers = getTrade(RESIN_SUBTYPES);

            const productionRegionPolymers = self._makeEmptyPolymersVector();
            POLYMER_NAMES.forEach((polymerName) => {
                const totalTradePolymer = [
                    goodsTradePolymers,
                    resinTradePolymers,
                ].map((x) => x.get(polymerName)).reduce((a, b) => a + b);
                productionRegionPolymers.set(
                    polymerName,
                    consumptionPolymers.get(polymerName) - totalTradePolymer,
                );
            });

            const polymerSubmap = new Map();
            polymerSubmap.set("consumption", consumptionPolymers);
            polymerSubmap.set("goodsTrade", goodsTradePolymers);
            polymerSubmap.set("resinTrade", resinTradePolymers);
            polymerSubmap.set("production", productionRegionPolymers);

            polymerMap.set(region, polymerSubmap);
        });
        state.set("polymers", polymerMap);
        return state;
    }

    /**
     * Get all of the unique polymers like pur expected.
     *
     * @returns Set of unique polymers without order guarantee.
     */
    _getAllPolymers() {
        const self = this;
        const nativePolymers = self._matricies.getPolymers();
        return new Set([...nativePolymers, TEXTILE_POLYMER, ADDITIVES_POLYMER]);
    }

    /**
     * Get all of the unique subtypes like transportation expected.
     *
     * @returns Set of unique subtypes without order guarantee.
     */
    _getAllSubtypes() {
        const self = this;
        const nativeSubtypes = self._matricies.getSubtypes();
        return new Set([...nativeSubtypes, TEXTILES_SUBTYPE]);
    }

    /**
     * Get a vector describing the volume of polymers in goods based on consumption.
     *
     * Get a vector describing the volume of polymers in goods based on consumption excluding
     * textiles.
     *
     * @param region The region like row for which the polymer vector is desired.
     * @param state The state object (Map) from which the polymer vector should be derived.
     * @param year The year like 2040.
     * @returns Vector of polymer
     */
    _getGoodsPolymers(region, state, year) {
        const self = this;
        const out = state.get("out").get(region);
        const polymers = self._getAllPolymers();

        const vectors = GOODS.map((info) => {
            const vector = self._makeEmptyPolymersVector();
            const volume = out.get(info["attr"]);
            polymers.forEach((polymer) => {
                const percent = self._getPolymerPercent(
                    state,
                    year,
                    region,
                    info["subtype"],
                    polymer,
                );
                const polymerVolume = percent * volume;
                const newTotal = vector.get(polymer) + polymerVolume;
                vector.set(polymer, newTotal);
            });
            return vector;
        });
        return vectors.reduce((a, b) => self._combinePolymerVectors(a, b));
    }

    /**
     * Get a polymer vector describing textiles.
     *
     * @param region The region like china for which textile polymers are desired.
     * @param state The state object (Map) from which the vector should be derived.
     * @param year The year that the state object is for.
     * @returns Polymer vector describing textiles.
     */
    _getTextilePolymers(region, state, year) {
        const self = this;
        const out = state.get("out").get(region);
        const vector = self._makeEmptyPolymersVector();
        const volume = out.get(TEXTILE_ATTR);
        const newTotal = vector.get(TEXTILE_POLYMER) + volume;

        const additivesPercent = self._getPolymerPercent(
            state,
            year,
            region,
            TEXTILES_SUBTYPE,
            ADDITIVES_POLYMER,
        );
        const newAdditives = additivesPercent * volume;
        vector.set(ADDITIVES_POLYMER, vector.get(ADDITIVES_POLYMER) + newAdditives);

        vector.set(TEXTILE_POLYMER, newTotal - newAdditives);

        return vector;
    }

    /**
     * Get a polymer vector for trade.
     *
     * @param year The year like 2050 for which the polymer vector is requested.
     * @param region The region like china for which the vector is requested.
     * @param state The state object (Map) from which it should be derived.
     * @param subtypes The subtypes to include.
     * @returns Polymer vector describing trade where numbers are net trade per polymer.
     */
    _getTradePolymers(year, region, state, subtypes) {
        const self = this;
        const polymers = self._getAllPolymers();
        const tradeVolumes = state.get("trade").get(region);

        const vectors = subtypes.map((subtype) => {
            const subtypeVolume = tradeVolumes.get(subtype);

            const vector = self._makeEmptyPolymersVector();
            polymers.forEach((polymer) => {
                const percent = self._getPolymerPercent(state, year, region, subtype, polymer);
                const polymerVolume = percent * subtypeVolume;
                const newTotal = vector.get(polymer) + polymerVolume;
                vector.set(polymer, newTotal);
            });

            return vector;
        });
        return vectors.reduce((a, b) => self._combinePolymerVectors(a, b));
    }

    /**
     * Get net trade from a region's outputs.
     *
     * @param regionOutputs The regions outputs (state.get("out").get(region)).
     * @returns The net trade.
     */
    _getNetTrade(regionOutputs) {
        const self = this;
        return regionOutputs.get("netImportsMT") - regionOutputs.get("netExportsMT");
    }

    /**
     * Make an empty polymer vector with all polymers set to zero.
     *
     * @returns Map representing a polymer vector.
     */
    _makeEmptyPolymersVector() {
        const self = this;
        const vector = new Map();
        vector.set("ldpe", 0);
        vector.set("hdpe", 0);
        vector.set("pp", 0);
        vector.set("ps", 0);
        vector.set("pvc", 0);
        vector.set("pet", 0);
        vector.set("pur", 0);
        vector.set("pp&a fibers", 0);
        vector.set("additives", 0);
        vector.set("other thermoplastics", 0);
        vector.set("other thermosets", 0);
        return vector;
    }

    /**
     * Add two polymer vectors together.
     *
     * @param a The first vector to add.
     * @param b The second vector to add.
     * @returns The result of pairwise (polymer to same polymer) addition.
     */
    _combinePolymerVectors(a, b) {
        const self = this;
        const vector = new Map();
        const add = (key) => {
            vector.set(key, a.get(key) + b.get(key));
        };
        add("ldpe");
        add("hdpe");
        add("pp");
        add("ps");
        add("pvc");
        add("pet");
        add("pur");
        add("pp&a fibers");
        add("additives");
        add("other thermoplastics");
        add("other thermosets");
        return vector;
    }

    /**
     * Get the percent of subtype mass that is a specific polymer.
     *
     * @param state The state from which the percentage should be found.
     * @param year The year like 2050 for which the state is provided.
     * @param region The region for which the percentage is desired like row.
     * @param subtype The subtype like transportation.
     * @param polymer The polymer like PS.
     * @returns Percent by mass of subtype that is the given polymer.
     */
    _getPolymerPercent(state, year, region, subtype, polymer) {
        const self = this;

        const requestedAdditives = polymer === ADDITIVES_POLYMER;

        const getAdditivesPercent = () => {
            const testing = !state.has("in");
            if (testing) {
                return 0;
            }

            const additivesKey = region + ADDITIVES_KEYS[subtype];
            const inputs = state.get("in");
            if (!inputs.has(additivesKey)) {
                return 0;
            }

            const additivesTotalPercent = inputs.get(additivesKey) / 100;
            const additivesPercentRemain = self._getAdditivesRemaining(state, year, region);
            return additivesTotalPercent * additivesPercentRemain;
        };

        const getNonAdditivesPercent = () => {
            if (requestedAdditives) {
                return 0;
            }

            // Check for polymer overrides
            if (state.has("polymerOverrides")) {
                const overrides = state.get("polymerOverrides");
                const overrideKey = self._getOverrideKey(region, subtype, polymer);
                if (overrides.has(overrideKey)) {
                    return overrides.get(overrideKey);
                }
            }

            // Override for textiles
            if (subtype === TEXTILES_SUBTYPE) {
                if (polymer === TEXTILE_POLYMER) {
                    return 1;
                } else {
                    return 0;
                }
            } else {
                if (polymer === TEXTILE_POLYMER) {
                    return 0;
                } else {
                    const polymerInfo = self._matricies.getPolymer(region, subtype, polymer);
                    const percent = polymerInfo.getPercent();
                    return percent;
                }
            }
        };

        if (requestedAdditives) {
            return getAdditivesPercent();
        } else {
            const additivesPercent = getAdditivesPercent();
            const nonAdditivesPercentTotal = 1 - additivesPercent;
            const nonAdditivesPercentQuery = getNonAdditivesPercent();
            return nonAdditivesPercentTotal * nonAdditivesPercentQuery;
        }
    }

    /**
     * Normalize through back propagation the trade data to meet mass balance constraints.
     *
     * @param year The year for which the state object is provided.
     * @param state The state object (Map) in which to normalize. Modified in place.
     */
    _normalizeDetailedTrade(year, state) {
        const self = this;
        const regions = Array.from(self._matricies.getRegions());
        regions.sort();

        const out = state.get("out");

        const goodsTradeSubtypes = GOODS.map((x) => x["subtype"]);
        const goodsTradeTotals = new Map();
        regions.forEach((region) => {
            goodsTradeTotals.set(region, self._getNetTrade(out.get(region)));
        });
        self._normalizeDetailedTradeSeries(state, goodsTradeSubtypes, goodsTradeTotals, regions);

        const resinTradeTotals = new Map();
        regions.forEach((region) => {
            resinTradeTotals.set(
                region,
                self._matricies.getResinTrade(year, region).getNetImportResin(),
            );
        });
        self._normalizeDetailedTradeSeries(state, RESIN_SUBTYPES, resinTradeTotals, regions);
    }

    /**
     * Normalize trade for a specific subset (series) like resin or goods trade.
     *
     * Normalize trade for a specific subset (series) like resin or goods trade through back
     * propagation to meet mass balance constriants.
     *
     * @param state The state object in which to perform back propagation.
     * @param seriesSubtypes The subtypes to normalize together.
     * @param seriesTotals The total volumes (sum) to try to meet per subtype.
     * @param regions The region in which to perform the normalization.
     */
    _normalizeDetailedTradeSeries(state, seriesSubtypes, seriesTotals, regions) {
        const self = this;
        const tradeMap = state.get("trade");

        const getRegionTotal = (region) => {
            const regionTrade = tradeMap.get(region);
            const values = seriesSubtypes.map((subtype) => regionTrade.get(subtype));
            return values.reduce((a, b) => a + b);
        };

        const getSubtypeTotal = (subtype) => {
            const values = regions.map((region) => tradeMap.get(region).get(subtype));
            return values.reduce((a, b) => a + b);
        };

        const getScaling = (delta) => {
            const deltaAbs = Math.abs(delta);
            if (deltaAbs < 1) {
                return 0;
            } else if (deltaAbs < 10) {
                return deltaAbs / 10;
            } else {
                return 1;
            }
        };

        const smoothRegion = (region) => {
            const origTotal = seriesTotals.get(region);
            const newTotal = getRegionTotal(region);
            const delta = origTotal - newTotal;
            const scaling = getScaling(delta);

            if (scaling == 0) {
                return;
            }

            const values = seriesSubtypes.map((subtype) => tradeMap.get(region).get(subtype));
            const absTotal = values.map((x) => Math.abs(x)).reduce((a, b) => a + b);

            seriesSubtypes.forEach((subtype) => {
                const originalVal = tradeMap.get(region).get(subtype);
                const newVal = Math.abs(originalVal) / absTotal * delta * scaling + originalVal;
                tradeMap.get(region).set(subtype, newVal);
            });
        };

        const smoothSubtype = (subtype) => {
            const subtypeTotal = getSubtypeTotal(subtype);
            const scaling = getScaling(subtypeTotal);

            if (scaling == 0) {
                return;
            }

            const avg = subtypeTotal / seriesSubtypes.length;
            regions.forEach((region) => {
                const originalVal = tradeMap.get(region).get(subtype);
                const newVal = originalVal - avg * scaling;
                tradeMap.get(region).set(subtype, newVal);
            });
        };

        const getRegionError = (region) => {
            return Math.abs(getRegionTotal(region) - seriesTotals.get(region));
        };

        const getSubtypeError = (subtype) => {
            return Math.abs(getSubtypeTotal(subtype));
        };

        const getMaxError = () => {
            const regionErrors = regions.map(getRegionError);
            const maxRegionError = regionErrors.reduce((a, b) => a > b ? a : b);
            const subtypesErrors = seriesSubtypes.map(getSubtypeError);
            const maxSubtypesError = subtypesErrors.reduce((a, b) => a > b ? a : b);
            return maxSubtypesError > maxRegionError ? maxSubtypesError : maxRegionError;
        };

        const errors = [];
        for (let i = 0; i < MAX_NORM_ITERATIONS; i++) {
            const maxError = getMaxError();
            if (maxError <= 1) {
                return state;
            }
            errors.push(maxError);

            seriesSubtypes.forEach((subtype) => {
                smoothSubtype(subtype);
                regions.forEach((region) => {
                    smoothRegion(region);
                });
            });
        }

        return state;
    }

    /**
     * Calculate the GHG associated with production.
     *
     * @param state The state in which to calculate the start of life GHG emissions.
     * @returns The provided state object after in-place modification.
     */
    _calculateStartOfLifeGhg(state) {
        const self = this;
        const regions = Array.of(...state.get("out").keys());
        const polymerVolumes = state.get("polymers");
        const ghgMap = state.get("ghg");

        const getEmissionsForPolymers = (region, polymers) => {
            const emissions = GHGS.map((ghgInfo) => {
                const polymerName = ghgInfo["polymerName"];
                if (polymers.has(polymerName)) {
                    const volume = polymers.get(ghgInfo["polymerName"]);
                    const leverName = ghgInfo["leverName"];
                    return getGhg(state, region, volume, leverName);
                } else {
                    return 0;
                }
            });
            return emissions.reduce((a, b) => a + b);
        };

        regions.forEach((region) => {
            const regionGhgMap = ghgMap.get(region);
            const regionPolymerVolumes = polymerVolumes.get(region);

            const calculateForKey = (key) => {
                const polymerVolumes = regionPolymerVolumes.get(key);
                const ghgEmissions = getEmissionsForPolymers(region, polymerVolumes);
                regionGhgMap.set(key, ghgEmissions);
            };

            calculateForKey("consumption");
            calculateForKey("goodsTrade");
            calculateForKey("resinTrade");
        });

        return state;
    }

    /**
     * Calculate the GHG associated with waste management fate.
     *
     * @param state The state in which to calculate the end of life GHG emissions.
     * @returns The provided state object after in-place modification.
     */
    _calculateEndOfLifeGhg(state) {
        const self = this;
        const regions = Array.of(...state.get("out").keys());
        const inputs = state.get("in");
        const outputs = state.get("out");
        const ghgMap = state.get("ghg");

        regions.forEach((region) => {
            const regionGhgMap = ghgMap.get(region);
            const regionOutputs = outputs.get(region);
            const individualGhg = EOLS.map((eolInfo) => {
                const volume = regionOutputs.get(eolInfo["attr"]);
                const emissions = getGhg(state, region, volume, eolInfo["leverName"]);
                return emissions;
            });
            const totalGhg = individualGhg.reduce((a, b) => a + b);
            regionGhgMap.set("eol", totalGhg);
        });

        return state;
    }

    /**
     * Create global output values as the sum of regional values.
     *
     * @param state The state object (Map) to modify in place.
     * @param attrs The attributes to sum across regions.
     * @returns The state object after in-place modification.
     */
    _addOutputGlobalToStateAttrs(state, attrs) {
        const self = this;
        addGlobalToStateAttrs(state, attrs);
        return state;
    }

    /**
     * Calculate the global GHG levels.
     *
     * @param year The year for which a state object is provided.
     * @param state The state object (Map) in which to calculate global GHG emissions.
     * @returns The state object having been modified in place.
     */
    _calculateOverallGhg(year, state) {
        const self = this;

        const finalizer = new GhgFinalizer();
        finalizer.finalize(state);

        return state;
    }

    /**
     * Get the key for a polymer ratio override.
     *
     * Get the string that would be present in the overrides Map if a polymer ratio override is
     * present.
     *
     * @param region The region like china.
     * @param subtype The subtype like transportation.
     * @param polymer The polymer like PUR.
     * @returns The string key for the polymer ratio override.
     */
    _getOverrideKey(region, subtype, polymer) {
        const self = this;
        return [region, subtype, polymer].join("\t");
    }
}


/**
 * Get the GHG emissions for a subset of polymer volume in a region.
 *
 * @param state The state object (Map) from which to derive the GHG emissions.
 * @param region The region like china.
 * @param volume The volume of material of the polymer in MT.
 * @param leverName The name of the lever associated with the polymer.
 * @returns GHG emissions in metric megatons CO2 equivalent.
 */
function getGhg(state, region, volume, leverName) {
    const inputNameBase = region + leverName + "Emissions";
    const regionOut = state.get("out").get(region);
    const isTesting = !regionOut.has("primaryProductionMT");
    const isNotRecyclable = RECYCLABLE_LEVER_NAMES.indexOf(leverName) == -1;

    const getPercentRecyclable = () => {
        const regionPolymers = state.get("polymers").get(region).get("production");

        const getTotalPolymers = (names) => {
            return names.map((name) => regionPolymers.get(name)).reduce((a, b) => a + b);
        };
        const totalPolymers = getTotalPolymers(POLYMER_NAMES);
        const recyclingPolymers = getTotalPolymers(RECYCLABLE_POLYMER_NAMES);

        return recyclingPolymers / totalPolymers;
    };

    const getPrimaryPercent = () => {
        if (isTesting || isNotRecyclable) {
            return 1;
        }

        const primaryProduction = regionOut.get("primaryProductionMT");
        const secondaryProduction = regionOut.get("secondaryProductionMT");
        const naiveSecondary = secondaryProduction / (primaryProduction + secondaryProduction);
        const offsetSecondary = naiveSecondary / getPercentRecyclable();
        return 1 - offsetSecondary;
    };

    const getIntensity = () => {
        const isEol = EOL_LEVERS.indexOf(leverName) != -1;
        if (isEol) {
            return state.get("in").get(inputNameBase);
        } else {
            const inputNameProduction = inputNameBase + "Production";
            const intensityProduction = state.get("in").get(inputNameProduction);

            const inputNameConversion = inputNameBase + "Conversion";
            const intensityConversion = state.get("in").get(inputNameConversion);

            const productionPercent = getPrimaryPercent();

            return intensityProduction * productionPercent + intensityConversion;
        }
    };

    const intensity = getIntensity();

    // metric kiloton
    const emissionsKt = intensity * volume;

    // metric megatons
    const emissionsMt = emissionsKt * 0.001;

    return emissionsMt;
}


/**
 * Tool which transits GHG through trade.
 */
class GhgFinalizer {
    /**
     * Finalize GHG emissions by applying trade.
     */
    finalize(state) {
        const self = this;
        self._getFullyDomesticGhg(state);
        const tradeLedger = self._buildLedger(state);
        self._addTradeGhg(state, tradeLedger);
        self._addOverallGhg(state);
        self._addGlobalGhg(state);
    }

    /**
     * Calculate fully domestic GHG emissions within a state.
     *
     * Determine how much GHG emissions is associated with activity that stays entirelly within a
     * region.
     *
     * @param state The state object (Map) in which to determine GHG from fully domestic activity.
     */
    _getFullyDomesticGhg(state) {
        const self = this;
        const ghgInfo = state.get("ghg");
        const regions = self._getRegions(state);
        regions.forEach((region) => {
            const regionGhg = ghgInfo.get(region);
            const regionOut = state.get("out").get(region);

            const goodsTradeGhg = regionGhg.get("goodsTrade");
            const goodsImportGhg = goodsTradeGhg > 0 ? goodsTradeGhg : 0;
            const resinTradeGhg = regionGhg.get("resinTrade");
            const resinImportGhg = resinTradeGhg > 0 ? resinTradeGhg : 0;
            const importedProductGhg = goodsImportGhg + resinImportGhg;
            const fullyDomesticProductGhg = regionGhg.get("consumption") - importedProductGhg;

            const wasteGhg = regionGhg.get("eol");
            const eolVolumes = EOLS.map((x) => x["attr"]).map((attr) => regionOut.get(attr));
            const regionTotalWaste = eolVolumes.reduce((a, b) => a + b);
            const percentImportedWaste = regionOut.get("netWasteImportMT") / regionTotalWaste;
            const percentDomesticWaste = 1 - percentImportedWaste;
            const fullyDomesticWasteGhg = percentDomesticWaste * wasteGhg;

            regionGhg.set("fullyDomesticProductGhg", fullyDomesticProductGhg);
            regionGhg.set("fullyDomesticWasteGhg", fullyDomesticWasteGhg);
        });
    }

    /**
     * Build a trade ledger which tracks the exchange of volumes across regions.
     *
     * @param state The state object (Map) from which to derive the trade ledger.
     * @returns The ledger loaded with data from the state object.
     */
    _buildLedger(state) {
        const self = this;
        const tradeLedger = new GhgTradeLedger();
        const out = state.get("out");
        const regions = self._getRegions(state);
        regions.forEach((region) => {
            const regionOut = out.get(region);

            const regionPolymers = state.get("polymers").get(region);
            const productSeries = ["goodsTrade", "resinTrade"];
            productSeries.forEach((series) => {
                const seriesPolymers = regionPolymers.get(series);
                GHGS.forEach((ghgInfo) => {
                    const polymerName = ghgInfo["polymerName"];
                    const volume = seriesPolymers.get(polymerName);
                    const leverName = ghgInfo["leverName"];
                    const ghg = getGhg(state, region, volume, leverName);

                    if (volume > 0) {
                        tradeLedger.addImport(region, polymerName, volume, ghg);
                    } else if (volume < 0) {
                        tradeLedger.addExport(region, polymerName, volume * -1, ghg * -1);
                    }
                });
            });

            const totalWaste = EOLS.map((eolInfo) => eolInfo["attr"])
                .map((attr) => regionOut.get(attr))
                .reduce((a, b) => a + b);

            const totalExportVolume = regionOut.get("netWasteExportMT");
            const totalImportVolume = regionOut.get("netWasteImportMT");
            const hasExport = totalExportVolume > 0;
            const hasImport = totalImportVolume > 0;
            EOLS.forEach((eolInfo) => {
                const attr = eolInfo["attr"];
                const leverName = eolInfo["leverName"];

                const volumeFate = regionOut.get(attr);
                const fatePercent = volumeFate / totalWaste;

                const fateExportVolume = fatePercent * totalExportVolume;
                const fateImportVolume = fatePercent * totalImportVolume;

                const percentOfFateExported = hasExport ? fateExportVolume / totalExportVolume : 0;
                const percentOfFateImported = hasImport ? fateImportVolume / totalImportVolume : 0;

                const ghgFate = getGhg(state, region, volumeFate, leverName);
                const fateGhgExport = ghgFate * percentOfFateExported;
                const fateGhgImport = ghgFate * percentOfFateImported;

                if (hasExport) {
                    tradeLedger.addExport(region, leverName, fateExportVolume, fateGhgExport);
                }

                if (hasImport) {
                    tradeLedger.addImport(region, leverName, fateImportVolume, fateGhgImport);
                }
            });
        });

        return tradeLedger;
    }

    /**
     * Calculate GHG for trade attributed according to application configuration.
     *
     * @param state The state object (Map) from which to calculate GHG and in which to place trade
     *      GHG.
     * @param tradeLedger The ledger with trade information to use in determing how to attribute
     *      GHG.
     */
    _addTradeGhg(state, tradeLedger) {
        const self = this;

        const ghgInfo = state.get("ghg");
        const regions = self._getRegions(state);
        const inputs = state.get("in");
        const percentAttributeProductImporter = inputs.get("emissionPercentProductImporter") / 100;
        const percentAttributeWasteImporter = 1 - inputs.get("emissionPercentWasteExporter") / 100;

        regions.forEach((region) => {
            const regionGhg = ghgInfo.get(region);

            const productTradeGhg = GHGS.map((ghgInfo) => {
                const polymerName = ghgInfo["polymerName"];
                return tradeLedger.getGhg(region, polymerName, percentAttributeProductImporter);
            }).reduce((a, b) => a + b);

            const eolTradeGhg = EOLS.map((eolInfo) => {
                const name = eolInfo["leverName"];
                return tradeLedger.getGhg(region, name, percentAttributeWasteImporter);
            }).reduce((a, b) => a + b);

            regionGhg.set("productTradeGhg", productTradeGhg);
            regionGhg.set("eolTradeGhg", eolTradeGhg);
        });
    }

    /**
     * Calculate the overall GHG emissions for a region.
     *
     * @param state The state object (Map) from which to find GHG values and in which to place
     *      region totals, modifying in place.
     */
    _addOverallGhg(state) {
        const self = this;
        const regions = self._getRegions(state);
        const ghgInfo = state.get("ghg");
        regions.forEach((region) => {
            const regionGhg = ghgInfo.get(region);
            const ghgs = [
                regionGhg.get("fullyDomesticProductGhg"),
                regionGhg.get("fullyDomesticWasteGhg"),
                regionGhg.get("productTradeGhg"),
                regionGhg.get("eolTradeGhg"),
            ];
            const sumGhg = ghgs.reduce((a, b) => a + b);
            regionGhg.set("overallGhg", sumGhg);
        });
    }

    /**
     * Calculate global GHG emissions.
     *
     * @param state The state object (Map) from which to get regional GHG and in which to put global
     *      GHG, modifying in place.
     */
    _addGlobalGhg(state) {
        const self = this;
        const ghgInfo = state.get("ghg");

        const globalGhg = new Map();
        globalGhg.set("overallGhg", 0);

        const regions = self._getRegions(state);
        regions.forEach((region) => {
            const ghgRegion = ghgInfo.get(region);

            const addAttr = (attr) => {
                globalGhg.set(attr, globalGhg.get(attr) + ghgRegion.get(attr));
            };

            addAttr("overallGhg");
        });

        ghgInfo.set("global", globalGhg);
    }

    _getRegions(state) {
        return Array.of(...state.get("ghg").keys());
    }
}


/**
 * Ledger tracking regional trade volumes and GHG.
 *
 * Ledger which tracks the imports and export of plastic at material type level (like  polymer or
 * EOL fate) along with the associated GHG emissions.
 */
class GhgTradeLedger {
    /**
     * Create a new empty trade ledger.
     */
    constructor() {
        const self = this;

        self._importVolumes = new Map();
        self._exportVolumes = new Map();
        self._actualGhg = new Map();
        self._ghgToDistribute = new Map();

        self._regions = new Set();
        self._materialTypes = new Set();

        self._typesWithImporterSource = EOLS.map((x) => x["leverName"]);
    }

    /**
     * Report imports.
     *
     * @param region The region like china into which this volume was imported.
     * @param materialType The type of material like polymer or EOL fate.
     * @param newVolume The size of the volume in MMT.
     * @param newGhg The GHG in eCO2 megatons.
     */
    addImport(region, materialType, newVolume, newGhg) {
        const self = this;
        self._regions.add(region);
        self._materialTypes.add(materialType);

        self._checkVolumeAndGhg(newVolume, newGhg);

        const key = self._getCombineKey(region, materialType);
        self._addToMap(self._importVolumes, key, newVolume);

        if (!self._exportIsActualGhgSource(materialType)) {
            self._addToMap(self._ghgToDistribute, materialType, newGhg);
            self._addToMap(self._actualGhg, key, newGhg);
        }
    }

    /**
     * Report an export of a volume.
     *
     * @param region The region from which the volume was exported.
     * @param materialType The type of material like polymer or EOL fate.
     * @param newVolume The size of the volume in MMT.
     * @param newGhg The GHG in eCO2 megatons.
     */
    addExport(region, materialType, newVolume, newGhg) {
        const self = this;
        self._regions.add(region);
        self._materialTypes.add(materialType);

        const key = self._getCombineKey(region, materialType);

        self._checkVolumeAndGhg(newVolume, newGhg);

        self._addToMap(self._exportVolumes, key, newVolume);

        if (self._exportIsActualGhgSource(materialType)) {
            self._addToMap(self._ghgToDistribute, materialType, newGhg);
            self._addToMap(self._actualGhg, key, newGhg);
        }
    }

    /**
     * Get the GHG emissions to be attributed to a region.
     *
     * @param region The region like china.
     * @param materialType The type of material like polymer or EOL fate.
     * @param percentAttributeImporter The percent (0 - 1) of the GHG emissions to attribute to the
     *      importer of the volume. The remainder will be attributed to the exporter.
     */
    getGhg(region, materialType, percentAttributeImporter) {
        const self = this;
        if (self._exportIsActualGhgSource(materialType)) {
            return self._getGhgWithExporterOrigin(region, materialType, percentAttributeImporter);
        } else {
            return self._getGhgWithImporterOrigin(region, materialType, percentAttributeImporter);
        }
    }

    /**
     * Get the regions reported in this ledger.
     *
     * @returns Set of regions like eu30 not in a particular order.
     */
    getRegions() {
        const self = this;
        return self._regions;
    }

    /**
     * Get the material types reported in this ledger.
     *
     * @returns Set of material types like pur or landfill not in a particular order.
     */
    getMaterialTypes() {
        const self = this;
        return self._materialTypes;
    }

    /**
     * Get the key which can be used to determine how to combine volumes.
     *
     * @param region The region for which the key is generated like china.
     * @param materialType The type of material like a polymer or EOL fate.
     * @returns String key where volumes with the same key can be combined.
     */
    _getCombineKey(region, materialType) {
        const self = this;
        return [region, materialType].join("\t");
    }

    /**
     * Add a value to a vector element.
     *
     * @param target The vector as a Map.
     * @param key The key in which to add a value.
     * @param addValue The value to add. This will be added to the value currently at the key before
     *      being set with the same key.
     */
    _addToMap(target, key, addValue) {
        const self = this;
        const original = self._getIfAvailable(target, key);
        const newVal = original + addValue;
        target.set(key, newVal);
    }

    /**
     * Validate that the volume and GHG are valid.
     */
    _checkVolumeAndGhg(volume, ghg) {
        const self = this;
        if (volume < 0 || isNaN(volume)) {
            throw "Encountered invalid or negative volume.";
        }

        if (ghg < 0 || isNaN(volume)) {
            throw "Encountered invalid or negative ghg.";
        }
    }

    /**
     * Get a value from a Map if available or zero if the key is not present.
     *
     * @param target The Map from which to get the value.
     * @param key The key for the value to look for.
     * @returns The value from the Map if found or zero if not.
     */
    _getIfAvailable(target, key) {
        const self = this;
        if (target.has(key)) {
            return target.get(key);
        } else {
            return 0;
        }
    }

    /**
     * Get the exporter-associated GHG for a volume.
     *
     * @param region The region of the volume / the exporter to find the GHG for.
     * @param materialType The material type to get the GHG for like polymer or EOL fate.
     * @param percentAttributeImporter The percent to attribute to the importer between 0 and 1. The
     *      remainder is attributed to the exporter.
     * @returns The amount of GHG that should be associated with this region as exporter.
     */
    _getGhgWithExporterOrigin(region, materialType, percentAttributeImporter) {
        const self = this;

        const regions = Array.of(...self._regions);
        const getTotalVolume = (target) => {
            const individual = regions.map((innerRegion) => {
                const key = self._getCombineKey(innerRegion, materialType);
                return self._getIfAvailable(target, key);
            });
            return individual.reduce((a, b) => a + b);
        };

        const key = self._getCombineKey(region, materialType);
        const percentAttributeExporter = 1 - percentAttributeImporter;

        const totalImportVolume = getTotalVolume(self._importVolumes);
        const importVolume = self._getIfAvailable(self._importVolumes, key);
        const percentImport = totalImportVolume == 0 ? 0 : importVolume / totalImportVolume;
        const materialTypeGhg = self._getIfAvailable(self._ghgToDistribute, materialType);
        const importGhgTotal = percentImport * materialTypeGhg;
        const importGhgToAttribute = importGhgTotal * percentAttributeImporter;

        const exportGhgTotal = self._getIfAvailable(self._actualGhg, key);
        const exportGhgToAttribute = exportGhgTotal * percentAttributeExporter;

        return importGhgToAttribute + exportGhgToAttribute;
    }

    /**
     * Get the importer-associated GHG for a volume.
     *
     * @param region The region of the volume / the importer to find the GHG for.
     * @param materialType The material type to get the GHG for like polymer or EOL fate.
     * @param percentAttributeImporter The percent to attribute to the importer between 0 and 1. The
     *      remainder is attributed to the importer.
     * @returns The amount of GHG that should be associated with this region as importer.
     */
    _getGhgWithImporterOrigin(region, materialType, percentAttributeImporter) {
        const self = this;

        const regions = Array.of(...self._regions);
        const getTotalVolume = (target) => {
            const individual = regions.map((innerRegion) => {
                const key = self._getCombineKey(innerRegion, materialType);
                return self._getIfAvailable(target, key);
            });
            return individual.reduce((a, b) => a + b);
        };

        const key = self._getCombineKey(region, materialType);
        const percentAttributeExporter = 1 - percentAttributeImporter;

        const totalExportVolume = getTotalVolume(self._exportVolumes);
        const exportVolume = self._getIfAvailable(self._exportVolumes, key);
        const percentExport = totalExportVolume == 0 ? 0 : exportVolume / totalExportVolume;
        const materialTypeGhg = self._getIfAvailable(self._ghgToDistribute, materialType);
        const exportGhgTotal = percentExport * materialTypeGhg;
        const exportGhgToAttribute = exportGhgTotal * percentAttributeExporter;


        const importGhgTotal = self._getIfAvailable(self._actualGhg, key);
        const importGhgToAttribute = importGhgTotal * percentAttributeImporter;

        return importGhgToAttribute + exportGhgToAttribute;
    }

    /**
     * Determine if the actual GHG is emitted at the importer or exporter.
     *
     * @param materialType The type of material like polymer or EOL fate.
     * @returns True if the GHG is actually emitted by the exporter and false if emitted by
     *      importer.
     */
    _exportIsActualGhgSource(materialType) {
        const self = this;
        return self._typesWithImporterSource.indexOf(materialType) == -1;
    }
}


/**
 * Create a promise for a set of matricies required to calculate polymer and ghg level info.
 *
 * @returns Promise resolving to the matricies set.
 */
function buildMatricies() {
    const assertPresent = (row, key) => {
        const value = row[key];

        if (value === undefined) {
            throw "Could not find value for " + key;
        }

        if (value === null) {
            throw "Value null for " + key;
        }
    };

    const ignoreEmpty = (rows) => {
        return rows.filter((x) => x["region"] !== null).filter((x) => x["region"] !== undefined);
    };

    const subtypeRawFuture = new Promise((resolve) => {
        Papa.parse("/data/live_production_trade_subtype_ratios.csv?v=" + CACHE_BUSTER, {
            download: true,
            header: true,
            complete: (results) => resolve(results["data"]),
            dynamicTyping: true,
        });
    });

    const subtypeFuture = subtypeRawFuture.then((rows) => {
        return ignoreEmpty(rows).map((row) => {
            assertPresent(row, "year");
            assertPresent(row, "region");
            assertPresent(row, "subtype");
            assertPresent(row, "ratioSubtype");

            return new SubtypeInfo(
                row["year"],
                row["region"],
                row["subtype"],
                row["ratioSubtype"],
            );
        });
    });

    const polymerRawFuture = new Promise((resolve) => {
        Papa.parse("/data/live_polymer_ratios.csv?v=" + CACHE_BUSTER, {
            download: true,
            header: true,
            complete: (results) => resolve(results["data"]),
            dynamicTyping: true,
        });
    });

    const polymerFuture = polymerRawFuture.then((rows) => {
        return ignoreEmpty(rows).map((row) => {
            assertPresent(row, "subtype");
            assertPresent(row, "region");
            assertPresent(row, "polymer");
            assertPresent(row, "percent");
            assertPresent(row, "series");

            return new PolymerInfo(
                row["subtype"],
                row["region"],
                row["polymer"],
                row["percent"],
                row["series"],
            );
        });
    });

    const resinTradeRawFuture = new Promise((resolve) => {
        Papa.parse("/data/resin_trade_supplement.csv?v=" + CACHE_BUSTER, {
            download: true,
            header: true,
            complete: (results) => resolve(results["data"]),
            dynamicTyping: true,
        });
    });

    const resinTradeFuture = resinTradeRawFuture.then((rows) => {
        return ignoreEmpty(rows).map((row) => {
            assertPresent(row, "year");
            assertPresent(row, "region");
            assertPresent(row, "netImportResin");
            assertPresent(row, "netExportResin");

            return new ResinTrade(
                row["year"],
                row["region"],
                row["netImportResin"] - row["netExportResin"],
            );
        });
    });

    const componentFutures = [subtypeFuture, polymerFuture, resinTradeFuture];
    const matrixFuture = Promise.all(componentFutures).then((results) => {
        const subtypeInfos = results[0];
        const polymerInfos = results[1];
        const resinTradeInfos = results[2];

        const retMatricies = new PolymerMatricies();
        subtypeInfos.forEach((record) => retMatricies.addSubtype(record));
        polymerInfos.forEach((record) => retMatricies.addPolymer(record));
        resinTradeInfos.forEach((record) => retMatricies.addResinTrade(record));

        return retMatricies;
    });

    const immutableMatrixFuture = matrixFuture.then((x) => new ImmutablePolymerMatricies(x));

    return immutableMatrixFuture;
}


/**
 * Build a promise for a StateModifier pre-loaded with matricies.
 *
 * @returns Promise resolving to the preloaded modifier.
 */
function buildModifier() {
    const matrixFuture = buildMatricies();
    const stateModifierFuture = matrixFuture.then((matricies) => new StateModifier(matricies));
    return stateModifierFuture;
}


/**
 * Initialize the web worker.
 */
function init() {
    const modifierFuture = buildModifier();

    const onmessage = (event) => {
        const stateInfo = event.data;
        const year = stateInfo["year"];
        const requestId = stateInfo["requestId"];
        const state = stateInfo["state"];
        const attrs = stateInfo["attrs"];

        modifierFuture.then((modifier) => {
            modifier.modify(year, state, attrs);
            postMessage({"requestId": requestId, "state": state, "error": null, "year": year});
        });
    };

    addEventListener("message", onmessage);
}


const runningInWorker = typeof importScripts === "function";
if (runningInWorker) {
    init();
}
