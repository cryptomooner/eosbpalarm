/**
 * Handles errors.
 *
 * @param error Error to be handled.
 * */
function handleError(error) {
    document.getElementById('error').innerText = error.message
}

/**
 * Clears error messages.
 * */
function clearError() {
    document.getElementById('error').innerText = ''
}

/**
 * Updates the last time the data was refreshed.
 * */
function setLastUpdateTime() {
    document.getElementById("last-update").innerText = 'Last updated: ' + new Date().toLocaleString()
}

/**
 * Creates a td element.
 *
 * @param text Content to create the td element with.
 * */
function addTd(text = "", id = "") {
    let td = document.createElement('td')
    td.innerHTML = text
    td.setAttribute("id", id)
    return td
}

/**
 * Creates an img element.
 *
 * @param src Content to create the img element with.
 * */
function addImg(src) {
    let img = document.createElement('img');
    img.width = 24
    img.height = 24
    img.align = 'middle'
    img.display = 'block'
    img.src = src

    return img
}

/**
 * Sets the rank icon for the favorite block producer.
 *
 * @param newRank is the rank of the block producer after the refresh interval got triggered.
 * */
function setRankIcon(newRank) {
    var rankIcon
    if (newRank === favoriteBlockProducerCurrentRanking) {
        rankIcon = rankIcons.minus
    } else if (favoriteBlockProducerCurrentRanking < newRank) { //went down in rank
        rankIcon = rankIcons.arrowDown
    } else if (favoriteBlockProducerCurrentRanking > newRank) { //went up in rank
        rankIcon = rankIcons.arrowUp
    }

    document.getElementById("rankIcon").appendChild(addImg(rankIcon))
}

/**
 * Selects a block producer, updating the ui elements showing its ranking.
 * */
function selectBlockProducer() {
    let follows = document.getElementsByName('bpFollow')

    for (let i = 0, length = follows.length; i < length; i++) {
        if (follows[i].checked) {
            let rank = i + 1
            document.getElementById("following").innerText = "Following: ".concat(follows[i].value).concat(" | ").concat("Current rank: " + rank)
            favoriteBlockProducerName = follows[i].value
            favoriteBlockProducerCurrentRanking = rank

            follows[i].parentElement.parentElement.className = 'selected'

            if (rank <= SELECTED_BP_LIMIT) {
                document.getElementById("message").innerText = "Congratulations! Your favorite block producer is within the 21 elected"
            } else {
                document.getElementById("message").innerText = "Your favorite block producer is in standby!"
            }
            break
        }
    }
}

/**
 * Searches among the list of block producers.
 * */
function search() {
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

/**
 * Builds the block producers table.
 *
 * @param producers list of active block producers.
 * */
function buildTable(producers) {
    let table = document.getElementsByTagName('tbody')[0]
    let sortedProducers = producers.sort((a, b) => Number(a.total_votes) > Number(b.total_votes) ? -1 : 1)

    for (let i = 0; i < sortedProducers.length; i++) {
        let producer = sortedProducers[i]
        let rowSanitized = sanitizeUrl(producer.url)
        let tr = document.createElement('tr')
        let rank = i + 1
        tr.setAttribute("id", 'row' + i)

        tr.append(addTd('<input name="bpFollow" type="radio" value="' + producer.owner + '" ' + (producer.owner === favoriteBlockProducerName ? 'checked' : '') + ' >'))
        tr.append(addTd(rank))
        tr.append(addTd("", producer.owner === favoriteBlockProducerName ? "rankIcon" : ""))
        tr.append(addTd("<a href='" + rowSanitized + "'>" + producer.owner + "</a>"))
        tr.append(addTd((producer.total_votes / chainState.total_producer_vote_weight * 100).toFixed(3)))
        tr.append(addTd(numberWithCommas((producer.total_votes / calculateVoteWeight() / 10000).toFixed(0))))

        if (document.getElementById('row' + i) != null) {
            table.replaceChild(tr, table.childNodes[i])
        } else {
            table.append(tr)
        }

        if (producer.owner === favoriteBlockProducerName) {
            checkRanking(rank)
            setRankIcon(rank)
            favoriteBlockProducerCurrentRanking = rank
        }
    }

    document.getElementsByName("bpFollow").forEach(e => {
        e.onclick = selectBlockProducer
    })

    selectBlockProducer()
    return table
}

//Sets up refresh interval slider
let refreshSlider = document.getElementById("refresh-slider");
let sliderOutput = document.getElementById("refresh-rate");
sliderOutput.innerHTML = `Refresh rate: ` + refreshSlider.value + ` min`;

refreshSlider.oninput = function () {
    sliderOutput.innerHTML = `Refresh rate: ` + this.value + ` min`;
    clearInterval(refreshInterval)
    refreshInterval = setRefreshInterval(minute * this.value)
    console.log(`refresh time set to ` + this.value + ` min`)
}