let invalidPrototcolRegex = /^(%20|\s)*(javascript|data)/im
let ctrlCharactersRegex = /[^\x20-\x7E]/gmi
let urlSchemeRegex = /^([^:]+):/gm
let relativeFirstCharacters = ['.', '/']
let minute = 1000 * 60

var alarmInterval = minute * 3 // 3m by default

var favoriteBlockProducerName = 'eosswedenorg'
var favoriteBlockProducerRanking = 500

const ENUM_RANK_UP = 0,
    ENUM_RANK_DOWN = 1,
    ENUM_RANK_SAME = 2;

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

var eosAlarm = class {

    addTd(text) {
        let td = document.createElement('td')
        td.innerHTML = text
        return td
    }

    addImg(rankEnum) {
        let img = document.createElement('img');
        img.width = 24
        img.height = 24
        img.align = 'middle'
        img.display = 'block'

        switch (rankEnum) {
            case ENUM_RANK_UP:
                img.src = 'img/arrow-up.png'
                break
            case ENUM_RANK_DOWN:
                img.src = 'img/arrow-down.png'
                break
            case ENUM_RANK_SAME:
                img.src = 'img/minus.png'
                break
            default:
                console.log("Case not implemented for adding a rank image.")
        }
        return img
    }

    selectBlockProducer() {
        let follows = document.getElementsByName('bpFollow')

        for (let i = 0, length = follows.length; i < length; i++) {
            if (follows[i].checked) {
                let rank = i + 1
                document.getElementById("following").innerText = "Following: ".concat(follows[i].value).concat(" | ").concat("Current rank: " + rank)
                favoriteBlockProducerName = follows[i].value
                favoriteBlockProducerRanking = rank

                if (rank <= 21) {
                    document.getElementById("message").innerText = "Congratulations! Your favorite block producer is within the 21 elected"
                } else {
                    document.getElementById("message").innerText = "Your favorite block producer is in standby!"
                }
                break
            }
        }
    }

    refreshBlockProducers() {
        getEosTable("producers").then((result) => {
            console.log('Producers: ' + JSON.stringify(result))
            this.buildTable(result)
            clearError()
        }, handleError)
    }

    buildTable(result) {
        this.countTotalVotes(result)
        let table = document.getElementsByTagName('tbody')[0]
        let sorted = result.rows.sort((a, b) => Number(a.total_votes) > Number(b.total_votes) ? -1 : 1)

        for (let i = 0; i < sorted.length; i++) {
            let producer = sorted[i]
            let rowSanitized = sanitizeUrl(producer.url)
            let tr = document.createElement('tr')
            let rank = i + 1
            tr.setAttribute("id", 'row' + i)

            tr.append(this.addTd('<input name="bpFollow" type="radio" value="' + producer.owner + '" ' + (producer.owner === favoriteBlockProducerName ? 'checked' : '') + ' >'))
            tr.append(this.addTd(rank))
            tr.append(this.addImg(ENUM_RANK_UP))
            tr.append(this.addTd("<a href='" + rowSanitized + "'>" + producer.owner + "</a>"))
            tr.append(this.addTd((producer.total_votes / chainState.total_producer_vote_weight * 100).toFixed(3)))
            tr.append(this.addTd(numberWithCommas((producer.total_votes / calculateVoteWeight() / 10000).toFixed(0))))

            if (document.getElementById('row' + i) != null) {
                table.replaceChild(tr, table.childNodes[i])
            } else {
                table.append(tr)
            }

            if (producer.owner === favoriteBlockProducerName) checkRanking(rank)
        }

        document.getElementsByName("bpFollow").forEach(e => {
            e.onclick = this.selectBlockProducer
        })

        this.selectBlockProducer()
        return table
    }

    countTotalVotes(result) {
        this.votes = 0
        for (let i = result.rows.length - 1; i >= 0; i--) {
            this.votes += this.voteNumber(result.rows[i].total_votes)
        }
    }

    search() {
        let nameColumn = 2
        let input, filter, table, tr, td, i
        input = document.getElementById("search")
        filter = input.value.toLowerCase()
        table = document.getElementById("bps")
        tr = table.getElementsByTagName("tr")

        // Loop through all table rows, and hide those who don't match the search query
        for (i = 1; i < tr.length; i++) {
            td = tr[i].getElementsByTagName("td")[nameColumn]
            if (td) {
                if (td.innerHTML.toLowerCase().indexOf(filter) > -1) {
                    tr[i].style.display = ""
                } else {
                    tr[i].style.display = "none"
                }
            }
        }
    }

    voteNumber(total_votes) {
        return parseInt(parseInt(total_votes) / 1e10 * 2.8)
    }

}

function load() {
    getChainState()
    eosAlarm.refreshBlockProducers()
    setRefreshInterval(alarmInterval)
}

var interval

function setRefreshInterval(timeInterval) {
    interval = setInterval(() => eosAlarm.refreshBlockProducers(), timeInterval)
}

var eosAlarm = new eosAlarm()

function checkRanking(newRank) {
    if (newRank === favoriteBlockProducerRanking)
        return

    var audio

    if (newRank === 1) {
        audio = audios.fly
    } else if (newRank > 21) {
        audio = audios.standby
    } else if (favoriteBlockProducerRanking < newRank) {
        audio = audios.down
    } else if (favoriteBlockProducerRanking > newRank) {
        audio = newRank === 21 ? audios.powerUp : audios.levelUp
    }

    favoriteBlockProducerRanking = newRank
    playAudio(audio, newRank === 1)
    setLastUpdateTime()
}

function setLastUpdateTime() {
    document.getElementById("last-update").innerText = 'Last updated: ' + new Date().toLocaleString()
}

let refreshSlider = document.getElementById("refresh-slider");
let sliderOutput = document.getElementById("refresh-rate");
sliderOutput.innerHTML = `Refresh rate: ` + refreshSlider.value + ` min`;

refreshSlider.oninput = function () {
    sliderOutput.innerHTML = `Refresh rate: ` + this.value + ` min`;
    clearInterval(interval)
    interval = setRefreshInterval(minute * this.value)
    console.log(`refresh time set to ` + this.value + ` min`)
}