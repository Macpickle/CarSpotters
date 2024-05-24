const badWords = require('bad-words'); 

function autoModerate(text, cleanReturn) {
    const filter = new badWords();
    const cleanText = filter.clean(text);

    //depending on request, will return the cleaned text or a boolean value
    if (cleanReturn) return cleanText;
    return !(filter.isProfane(text));
}

module.exports = autoModerate;