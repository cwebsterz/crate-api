require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT || 4000
const HTTPError = require('node-http-error')
const dal = require('./dal')
const { pathOr, keys, path } = require('ramda')
const bodyParser = require('body-parser')
const cors = require('cors')
const fetch = require('isomorphic-fetch')

const checkReqdFields = require('./lib/check-reqd-keys')
const checkAlbumReqdFields = checkReqdFields([
  `title`,
  `artist`,
  `genre`,
  `year`
])

const checkProfileReqdFields = checkReqdFields([`firstName`, `lastName`, `age`])

app.use(cors({ credentials: true }))
app.use(bodyParser.json())

////CREATE////
app.post('/crate/albums', function(req, res, next) {
  const a = pathOr(null, ['body'], req)
  console.log('body: ', a)
  const checkResults = checkAlbumReqdFields(a)
  if (checkResults.length > 0) {
    return next(
      new HTTPError(400, 'Bad request, missing required fields: ', {
        fields: checkResults
      })
    )
  }

  dal.createAlbum(a, callbackHelper(next, res))
})

////

app.post('/wishlist/albums', function(req, res, next) {
  const wa = pathOr(null, ['body'], req)
  const checkResults = checkAlbumReqdFields(wa)
  if (checkResults.length > 0) {
    return next(
      new HTTPError(400, 'Bad request, missing required fields: ', {
        fields: checkResults
      })
    )
  }

  dal.createWishlistAlbum(wa, callbackHelper(next, res))
})

////

app.post('/profiles', function(req, res, next) {
  const profile = pathOr(null, ['body'], req)
  const checkResults = checkProfileReqdFields(profile)
  if (checkResults.length > 0) {
    return next(
      new HTTPError(400, 'Bad request, missing required fields: ', {
        fields: checkResults
      })
    )
  }
  dal.createWishlistAlbum(profile, callbackHelper(next, res))
})

////READ////
app.get('/crate/albums/:id', function(req, res, next) {
  const albumId = pathOr(null, ['params', 'id'], req)
  dal.getAlbum(albumId, function(err, data) {
    if (err) return next(new HTTPError(err.status, err.message, err))
    if (albumId) {
      res.status(200).send(data)
    } else {
      return next(new HTTPError(400, 'Missing id in path'))
    }
  })
})

////

app.get('/wishlist/albums/:id', function(req, res, next) {
  const wishlistAlbumId = pathOr(null, ['params', 'id'], req)
  dal.getWishlistAlbum(wishlistAlbumId, function(err, data) {
    if (err) return next(new HTTPError(err.status, err.message, err))
    if (wishlistAlbumId) {
      res.status(200).send(data)
    } else {
      return next(new HTTPError(400, 'Missing id in path'))
    }
  })
})

////
app.get('/search', (req, res) => {
  console.log('text: ', req.query.text)
  fetch(
    process.env.DISCOG_SEARCH +
      req.query.text +
      '}&secret=' +
      process.env.DISCOGS_SECRET +
      '&key=' +
      process.env.DISCOGS_KEY,
    {
      headers: { 'Content-Type': 'application/json' }
    }
  )
    .then(r => r.json())
    .then(results => res.send(results))
})

////UPDATE////
app.put('/wishlist/albums/:id', function(req, res, next) {
  const wishlistAlbumId = pathOr(null, ['params', 'id'], req)
  const body = pathOr(null, ['body'], req)
  const checkResults = checkAlbumReqdFields(body)
  if (checkResults.length > 0) {
    return next(
      new HTTPError(400, 'Bad request, missing required fields: ', {
        fields: checkResults
      })
    )
  }

  if (!body || keys(body).length === 0)
    return next(new HTTPError(400, 'Missing album in request body.'))
  dal.updateWishlistAlbum(body, wishlistAlbumId, callbackHelper(next, res))
})

////DELETE////
app.delete('/crate/albums/:id', function(req, res, next) {
  const albumId = pathOr(null, ['params', 'id'], req)

  dal.deleteAlbum(albumId, callbackHelper(next, res))
})

////

app.delete('/wishlist/albums/:id', function(req, res, next) {
  const wishlistAlbumId = pathOr(null, ['params', 'id'], req)

  dal.deleteWishlistAlbum(wishlistAlbumId, callbackHelper(next, res))
})

////LIST////
app.get('/crate/albums', function(req, res, next) {
  const albumFilter = pathOr(null, ['query', 'filter'], req)
  const limit = pathOr(10, ['query', 'limit'], req)
  const lastItem = pathOr(null, ['query', 'lastItem'], req)

  dal.listAlbums(
    lastItem,
    albumFilter,
    Number(limit),
    callbackHelper(next, res)
  )
})

////

app.get('/wishlist/albums', function(req, res, next) {
  const albumFilter = pathOr(null, ['query', 'filter'], req)
  const limit = pathOr(10, ['query', 'limit'], req)
  const lastItem = pathOr(null, ['query', 'lastItem'], req)

  dal.listWishlistAlbums(
    lastItem,
    albumFilter,
    Number(limit),
    callbackHelper(next, res)
  )
})

////Callback Function////
const callbackHelper = (next, res) => (err, data) => {
  if (err) next(new HTTPError(err.status, err.message, err))
  res.status(200).send(data)
}

////Error Handler////
app.use(function(err, req, res, next) {
  console.log(req.method, req.path, err)
  res.status(err.status || 500)
  res.send(err)
})

////Shhhh, and...////

app.listen(port, () => console.log('API Running on port:', port))
