/* eslint-disable */
let invalidPrototcolRegex = /^(%20|\s)*(javascript|data)/im;
let ctrlCharactersRegex = /[^\x20-\x7E]/gmi;
let urlSchemeRegex = /^([^:]+):/gm;
let relativeFirstCharacters = ['.', '/']

var favoriteBlockProducerName = 'eosswedenorg'
var favoriteBlockProducerRanking = 500

function isRelativeUrl(url) {
    return relativeFirstCharacters.indexOf(url[0]) > -1;
}

function sanitizeUrl(url) {
    let urlScheme, urlSchemeParseResults;
    let sanitizedUrl = url.replace(ctrlCharactersRegex, '');

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

var eosAlarm = class {

    addTd(text) {
        var td = document.createElement('td');
        td.innerHTML = text;
        return td;
    }

    getSelectedBlockProducer() {
        document.getElementsByName("bpFollow").forEach(function (bp) {
            if (bp.checked) return bp.value;
        });
    }

    selectBlockProducer() {
        let bp = this.getSelectedBlockProducer()
        document.getElementById("following").innerText = "Following: ".concat(bp)
        favoriteBlockProducerName = bp
    }

    populateBlockProducers() {
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
        let config = {
            chainId: network.chainId, // 32 byte (64 char) hex string
            expireInSeconds: 60,
            httpEndpoint: "http" + (network.secured ? 's' : '') + '://' + network.host + ':' + network.port
        };

        this.eosPublic = new Eos(config);
        this.populateBlockProducers().then(res => {
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
            tr.append(this.addTd('<input name="bpVote" type="radio" value="' + row.owner + '" ' + (row.owner === favoriteBlockProducerName ? 'checked' : '') + ' >'));
            tr.append(this.addTd(i + 1));
            tr.append(this.addTd("<a href='" + rowSanitized + "'>" + row.owner + "</a>"));
            tr.append(this.addTd(this.cleanNumber(row.total_votes)));
            tr.append(this.addTd(this.createProgressBar(this.cleanPercent(this.voteNumber(row.total_votes) / this.votes))));

            if (row.owner === favoriteBlockProducerName) checkRanking(i + 1)
        }

        document.getElementsByName("bpFollow").forEach(e => {
            e.onclick = this.selectBlockProducer;
        });

        this.selectBlockProducer()
        return table;
    }

    countTotalVotes(res) {
        this.votes = 0;
        for (let i = res.rows.length - 1; i >= 0; i--) {
            this.votes += this.voteNumber(res.rows[i].total_votes);
        }
    }

    search() {
        let input, filter, table, tr, td, i;
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
}

function refresh() {
    eosAlarm.refreshBlockProducers();
}

var eosAlarm = new eosAlarm();
eosAlarm.refreshBlockProducers();

function checkRanking(rank) {
    var audio
    if (rank === 1) {
        audio = audios.fly
    } else if (favoriteBlockProducerRanking < rank) {
        audio = audios.down
    } else if (favoriteBlockProducerRanking > rank) {
        audio = audios.levelUp
    }

    playAudio(audio, rank === 1)
}

