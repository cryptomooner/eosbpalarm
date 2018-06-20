//See: https://github.com/EOSIO/eosjs-api/blob/master/src/api/v1/chain.json

let chainId = "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906"
let networkName = "Main Net"

const networks = [
    {
        name: networkName,
        host: "eos.greymass.com",
        port: 443,
        chainId: chainId,
        secured: true
    },
    {
        name: networkName,
        host: "fn.eossweden.se",
        port: 443,
        chainId: chainId,
        secured: true
    },
    {
        name: networkName,
        host: "br.eosrio.io",
        port: 8080,
        chainId: chainId,
        secured: false
    },
    {
        name: networkName,
        host: "nodes.eos42.io",
        port: 80,
        chainId: chainId,
        secured: false
    },
    {
        name: networkName,
        host: "api.hkeos.com",
        port: 80,
        chainId: chainId,
        secured: false
    },
]
const network = networks[0]

let config = {
    chainId: network.chainId, // 32 byte (64 char) hex string
    expireInSeconds: 60,
    httpEndpoint: "http" + (network.secured ? 's' : '') + '://' + network.host + ':' + network.port
}

/**
 * Gets an instance of Eos.
 * */
function getEos() {
    return new Eos(config)
}

function getEosTable(table, limit = 500, index = "", tableKey = "") {
    const eos = getEos()
    if (!eos) return null

    return eos.getTableRows({
        "json": true,
        "scope": 'eosio',
        "code": 'eosio',
        "table": table,
        "limit": limit,
        "table_key": tableKey,
        "lower_bound": index,
        "upper_bound": typeof index === "string" ? "" : index + limit
    })
}

var chainState

/**
 * Gets the state of the chain.
 * */
function getChainState() {
    getEosTable("global", 1).then((result) => {
        console.log('ChainState: ' + JSON.stringify(result.rows[0]))
        chainState = result.rows[0]
    }, handleError)
}

/**
 * Refreshes block producers table.
 * */
function refreshBlockProducers() {
    getEosTable("producers").then((result) => {
        console.log('Producers: ' + JSON.stringify(result))
        this.buildTable(result.rows.filter((producer) => producer.is_active))
        clearError()
    }, handleError)
}

/**
 * Converts the given number to a string separated by commas.
 *
 * @param number number to be transformed.
 * */
// Kudods to eosportal
function numberWithCommas(number) {
    number = number.toString()
    let pattern = /(-?\d+)(\d{3})/
    while (pattern.test(number))
        number = number.replace(pattern, "$1,$2")
    return number
}

/**
 * Calculates the vote weight for the chain.
 * */
// Kudos to CryptoLions
function calculateVoteWeight() {

    //time epoch:
    //https://github.com/EOSIO/eos/blob/master/contracts/eosiolib/time.hpp#L160

    //stake to vote
    //https://github.com/EOSIO/eos/blob/master/contracts/eosio.system/voting.cpp#L105-L109

    let timestamp_epoch = 946684800000;
    let dates_ = (Date.now() / 1000) - (timestamp_epoch / 1000);
    let weight_ = Math.floor(dates_ / (86400 * 7)) / 52;  //86400 = seconds per day 24*3600
    return Math.pow(2, weight_);
}