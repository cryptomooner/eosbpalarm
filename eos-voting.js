/* eslint-disable */
var invalidPrototcolRegex = /^(%20|\s)*(javascript|data)/im;
var ctrlCharactersRegex = /[^\x20-\x7E]/gmi;
var urlSchemeRegex = /^([^:]+):/gm;
var relativeFirstCharacters = ['.', '/']

function isRelativeUrl(url) {
    return relativeFirstCharacters.indexOf(url[0]) > -1;
}

function sanitizeUrl(url) {
    var urlScheme, urlSchemeParseResults;
    var sanitizedUrl = url.replace(ctrlCharactersRegex, '');

    if (isRelativeUrl(sanitizedUrl)) {
        return sanitizedUrl;
    }

    urlSchemeParseResults = sanitizedUrl.match(urlSchemeRegex);
    if (!urlSchemeParseResults) {
        return 'about:blank';
    }

    urlScheme = urlSchemeParseResults[0];
    if (invalidPrototcolRegex.test(urlScheme)) {
        return 'about:blank';
    }

    return sanitizedUrl;
}

const networks = [
    {
        name: "Main Net",
        host: "node2.liquideos.com",
        port: 80,
        chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
        secured: false
    },
    {
        name: "Main Net SSL",
        host: "node2.liquideos.com",
        port: 443,
        scatterPort: 80,
        chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
        secured: true
    },
    {
        name: "Main Net SSL - for scatter over ssl",
        host: "node2.liquideos.com",
        port: 443,
        chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
        secured: true
    },
    {
        name: "Jungle Testnet",
        host: "dolphin.eosblocksmith.io",
        chainId: "038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca",
        port: 8888
    }
];

var defaultIndex = 0;
if (this.location.protocol === "https:") {
    defaultIndex = 1;
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

var networkParam = getParameterByName('network');
if (networkParam)
    defaultIndex = networkParam;
const network = networks[defaultIndex];

var eosVoter = class {
    constructor() {
        this.eos = null;
    }

    addTd(text) {
        var td = document.createElement('td');
        td.innerHTML = text;
        return td;
    }

    getSelectedBlockProducer() {
        document.getElementsByName("bpVote").forEach(function (bp) {
            if (bp.checked) return bp.value;
        });
    }

    selectBlockProducer() {
        let bp = voter.getSelectedBlockProducer();
    }

    populateBPs() {
        // populate producer table
        return this.eosPublic.getTableRows({
            "json": true,
            "scope": 'eosio',
            "code": 'eosio',
            "table": "producers",
            "limit": 500
        });
    }

    refreshBlockProducers() {
        var eosOptions = {};
        var table;

        var config = {
            chainId: network.chainId, // 32 byte (64 char) hex string
            expireInSeconds: 60,
            httpEndpoint: "http" + (network.secured ? 's' : '') + '://' + network.host + ':' + network.port
        };

        this.eosPublic = new Eos(config);
        this.populateBPs().then(res => {
            this.buildTable(res);
        });
    }

    buildTable(res) {
        this.countTotalVotes(res);
        let table = document.getElementsByTagName('tbody')[0];
        let sorted = res.rows.sort((a, b) => Number(a.total_votes) > Number(b.total_votes) ? -1 : 1);

        for (let i = 0; i < sorted.length; i++) {
            let row = sorted[i];
            let rowSanitized = sanitizeUrl(row.url);
            let tr = document.createElement('tr');
            table.append(tr);
            tr.append(this.addTd('<input name="bpVote" type="radio" value="' + row.owner + '" ' + '' + ' >'));
            tr.append(this.addTd(i + 1));
            tr.append(this.addTd("<a href='" + rowSanitized + "'>" + row.owner + "</a>"));
            tr.append(this.addTd(this.cleanNumber(row.total_votes)));
            tr.append(this.addTd(this.createProgressBar(this.cleanPercent(this.voteNumber(row.total_votes) / this.votes))));
        }

        document.getElementsByName("bpVote").forEach(e => {
            e.onclick = this.selectBlockProducer;
        });
        return table;
    }

    countTotalVotes(res) {
        this.votes = 0;
        for (var i = res.rows.length - 1; i >= 0; i--) {
            this.votes += this.voteNumber(res.rows[i].total_votes);
        }
    }

    search() {
        var input, filter, table, tr, td, i;
        input = document.getElementById("search");
        filter = input.value.toUpperCase();
        table = document.getElementById("bps");
        tr = table.getElementsByTagName("tr");

        // Loop through all table rows, and hide those who don't match the search query
        for (i = 1; i < tr.length; i++) {
            td = tr[i].getElementsByTagName("td")[1];
            if (td) {
                if (td.innerHTML.toUpperCase().indexOf(filter) > -1) {
                    tr[i].style.display = "";
                } else {
                    tr[i].style.display = "none";
                }
            }
        }
    }

    voteNumber(total_votes) {
        return parseInt(parseInt(total_votes) / 1e10 * 2.8);
    }

    cleanNumber(num) {
        num = this.voteNumber(num);
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }

    createProgressBar(pct) {
        return '<div class="progress-bar active float-left" role="progressbar" style="width:' + pct + '">&nbsp;</div>' +
            '<span class="text-dark current-value">' + pct + '</span>';
    }

    cleanPercent(num) {
        return Math.round(num * 10000) / 100 + "%";
    }

    timeDifference(previous) {
        var msPerMinute = 60 * 1000;
        var msPerHour = msPerMinute * 60;
        var msPerDay = msPerHour * 24;
        var msPerMonth = msPerDay * 30;
        var msPerYear = msPerDay * 365;

        var elapsed = (new Date().getTime()) - previous;

        if (elapsed < msPerMinute) {
            return Math.round(elapsed / 1000) + ' seconds ago';
        }

        else if (elapsed < msPerHour) {
            return Math.round(elapsed / msPerMinute) + ' minutes ago';
        }

        else if (elapsed < msPerDay) {
            return Math.round(elapsed / msPerHour) + ' hours ago';
        }

        else if (elapsed < msPerMonth) {
            return 'approximately ' + Math.round(elapsed / msPerDay) + ' days ago';
        }

        else if (elapsed < msPerYear) {
            return 'approximately ' + Math.round(elapsed / msPerMonth) + ' months ago';
        }

        else {
            return 'approximately ' + Math.round(elapsed / msPerYear) + ' years ago';
        }
    }

    /*load() {
    }*/
}
var voter = new eosVoter();
voter.refreshBlockProducers();

