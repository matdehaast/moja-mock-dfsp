const axios = require("axios");
const express = require('express')
const app = express()
const dfspId = process.env.DFSP_ID
const port = process.env.MOCKDFSP_PORT ? process.env.MOCKDFSP_PORT : 3000
const headerPattern = RegExp('^application\\/vnd.interoperability.(transfers|quotes|parties)\\+json;version=1.0')
const bodyParser = require('body-parser')
const Logger = require('debug')('mock-dfsp')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json({ type: req => req.headers['content-type'] === 'application/json' || headerPattern.test(req.headers['content-type']) }))

const transfersEndpoint = process.env.MLAPI_URL ? process.env.MLAPI_URL : 'http://localhost:3000'
const quotesEndpoint = process.env.MLSWITCH_URL ? process.env.MLSWITCH_URL : 'http://localhost:3001'

app.get('/', (req, res) => res.send(`Hello World! from ${dfspId}`))

// Quotes
app.post( '/' + dfspId + '/quotes', async (req, res) => {

    Logger('Received quote request', req.body)
    const quoteRequest = req.body
    const quoteHeaders = req.headers

    // Accept Quote
    res.set('Content-Type', 'application/vnd.interoperability.quotes+json;version=1.0')
    res.sendStatus(202)

    await new Promise(resolve => setTimeout(resolve, 1000))
    const quoteResponse = {
        transferAmount: {
            amount: 100,
            currency: "USD"
        },
        expiration: new Date(Date.now() + (1000 /*sec*/ * 60 /*min*/ * 30)),
        ilpPacket: "AQAAAAAAAACWEHByaXZhdGUucGF5ZWVmc3CCAiB7InRyYW5zYWN0aW9uSWQiOiI3NDk3ZWY1Ni05ZWM1LTRiMjEtOWQ5Mi0xMDc4NjVmN2QwYjIiLCJxdW90ZUlkIjoiZThjMGU2YmUtN2Y2NS00ZjI2LWI3ZjktYjVlMDViYmQwY2I3IiwicGF5ZWUiOnsicGFydHlJZEluZm8iOnsicGFydHlJZFR5cGUiOiJNU0lTRE4iLCJwYXJ0eUlkZW50aWZpZXIiOiIyNzcxMzgwMzkxMiIsImZzcElkIjoicGF5ZWVmc3AifSwicGVyc29uYWxJbmZvIjp7ImNvbXBsZXhOYW1lIjp7fX19LCJwYXllciI6eyJwYXJ0eUlkSW5mbyI6eyJwYXJ0eUlkVHlwZSI6Ik1TSVNETiIsInBhcnR5SWRlbnRpZmllciI6IjI3NzEzODAzOTEwIiwiZnNwSWQiOiJwYXllcmZzcCJ9LCJwZXJzb25hbEluZm8iOnsiY29tcGxleE5hbWUiOnt9fX0sImFtb3VudCI6eyJjdXJyZW5jeSI6IlVTRCIsImFtb3VudCI6IjE1MCJ9LCJ0cmFuc2FjdGlvblR5cGUiOnsic2NlbmFyaW8iOiJERVBPU0lUIiwic3ViU2NlbmFyaW8iOiJERVBPU0lUIiwiaW5pdGlhdG9yIjoiUEFZRVIiLCJpbml0aWF0b3JUeXBlIjoiQ09OU1VNRVIiLCJyZWZ1bmRJbmZvIjp7fX19",
        condition: "3HNdw6LdPD4KASWijlNkvCJ0DmFz40aUeGZm1qNRy14"
    }

    const quoteResponseHeaders = {
        'Content-Type': 'application/vnd.interoperability.quotes+json;version=1.0',
        'fspiop-destination': quoteHeaders["fspiop-source"],
        'date' : new Date(),
        'fspiop-source': quoteHeaders["fspiop-destination"],
    }

    Logger('Making put request to ', quotesEndpoint + '/quotes/' + quoteRequest.quoteId)
    try{
        const response = await axios.put(quotesEndpoint + '/quotes/' + quoteRequest.quoteId, quoteResponse, {headers: quoteResponseHeaders})
        Logger('Received response', response)
    }
    catch(e){
        Logger('Error putting ', e)
    }
})

app.put('/' + dfspId + '/quotes/:quote_id', async (req, res) => {

    Logger('received quote put quoteId=', req.params.quote_id)
    Logger('headers', req.headers)
    Logger('body', req.body)

    res.set('Content-Type', 'application/vnd.interoperability.quotes+json;version=1.0')
    res.sendStatus(202)

})


// Transfers
app.post('/' + dfspId + '/transfers', async (req, res) => {

    console.log('Recieved transfer request', req.body)
    const transferRequest = req.body
    const transferHeaders = req.headers

    // Accept Quote
    res.set('Content-Type', 'application/vnd.interoperability.transfers+json;version=1.0')
    res.sendStatus(202)

    await new Promise(resolve => setTimeout(resolve, 1000))
    const transferResponse = {
        fulfilment: "uU0nuZNNPgilLlLX2n2r-sSE7-N6U4DukIj3rOLvzek",
        completedTimestamp: (new Date()).toISOString(),
        transferState: "COMMITTED"
    }

    const transferResponseHeaders = {
        'Content-Type': 'application/vnd.interoperability.transfers+json;version=1.0',
        'fspiop-destination': transferHeaders["fspiop-source"],
        'date' : transferHeaders.date,
        'fspiop-source': transferHeaders["fspiop-destination"],
    }

    try{
        await axios.put(transfersEndpoint + '/transfers/' + transferRequest.transferId, transferResponse, {headers: transferResponseHeaders})
    }
    catch(e){
        console.log('error', e)
    }
})

app.put('/' + dfspId + '/transfers/:transfer_id/error', async (req, res) => {

    console.log('Received transfer error. transferId=', req.params.transfer_id)
    console.log('headers:', req.headers)
    console.log('body:', req.body)

    res.status(202).end()
})

app.put('/' + dfspId + '/transfers/:transfer_id', async (req, res) => {

    console.log('received transfer put')
    console.log(req.body, req.headers)

    res.set('Content-Type', 'application/vnd.interoperability.transfers+json;version=1.0')
    res.sendStatus(200)

})

app.put('/' + dfspId + '/parties/:type/:type_id', async (req, res) => {

    console.log('received parties put req', req.body)

    res.status(202).end()

})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
