let invalidPrototcolRegex = /^(%20|\s)*(javascript|data)/im
let ctrlCharactersRegex = /[^\x20-\x7E]/gmi
let urlSchemeRegex = /^([^:]+):/gm
let relativeFirstCharacters = ['.', '/']

function isRelativeUrl(url) {
    return relativeFirstCharacters.indexOf(url[0]) > -1
}

function sanitizeUrl(url) {
    let urlScheme, urlSchemeParseResults
    let sanitizedUrl = url.replace(ctrlCharactersRegex, '')

    if (isRelativeUrl(sanitizedUrl)) {
        return sanitizedUrl
    }

    urlSchemeParseResults = sanitizedUrl.match(urlSchemeRegex)
    if (!urlSchemeParseResults) {
        return 'about:blank'
    }

    urlScheme = urlSchemeParseResults[0]
    if (invalidPrototcolRegex.test(urlScheme)) {
        return 'about:blank'
    }

    return sanitizedUrl
}