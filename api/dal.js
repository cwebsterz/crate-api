const PouchDB = require('pouchdb')
PouchDB.plugin(require('pouchdb-find'))
const db = new PouchDB(process.env.COUCHDB_URL + process.env.COUCHDB_NAME)

const bldPrimaryKey = require('./lib/primary-key-generator')
const albumPKGenerator = bldPrimaryKey('album_')
const wishlistAlbumPKGenerator = bldPrimaryKey('wishlist_album_')
const profilePKGenerator = bldPrimaryKey('profile_')

const { assoc, split, head, last, compose } = require('ramda')

////CREATE////
function createAlbum(a, callback) {
  const pk = albumPKGenerator(a.title)
  a = compose(assoc('_id', pk), assoc('type', 'album'))(a)
  addDoc(a, callback)
}

////

function createWishlistAlbum(wa, callback) {
  const pk = wishlistAlbumPKGenerator(wa.title)
  wa = compose(assoc('_id', pk), assoc('type', 'wishlist_album'))(wa)
  addDoc(wa, callback)
}

////

function createProfile(profile, callback) {
  const pk = albumPKGenerator(a.title)
  profile = compose(assoc('_id', pk), assoc('type', 'profile'))(profile)
  addDoc(profile, callback)
}

////READ////
function getAlbum(albumId, callback) {
  db.get(albumId, function(err, doc) {
    if (err) return callback(err)

    doc.type === 'album'
      ? callback(null, doc)
      : callback(new HTTPError(400, 'Bad request, ID must be an album'))
  })
}

////

function getWishlistAlbum(wishlistAlbumId, callback) {
  db.get(wishlistAlbumId, function(err, doc) {
    if (err) return callback(err)

    doc.type === 'wishlist_album'
      ? callback(null, doc)
      : callback(new HTTPError(400, 'Bad request, ID must be an album'))
  })
}

////UPDATE////
function updateWishlistAlbum(wa, albumId, callback) {
  wa = assoc('type', 'wishlist_album', wa)
  db.put(wa, function(err, doc) {
    if (err) callback(err)
    callback(null, doc)
  })
}

////DELETE////
function deleteAlbum(albumId, callback) {
  db
    .get(albumId)
    .then(function(doc) {
      return db.remove(doc)
    })
    .then(function(result) {
      callback(null, result)
    })
    .catch(function(err) {
      callback(err)
    })
}

////

function deleteWishlistAlbum(wishlistAlbumId, callback) {
  db
    .get(wishlistAlbumId)
    .then(function(doc) {
      return db.remove(doc)
    })
    .then(function(result) {
      callback(null, result)
    })
    .catch(function(err) {
      callback(err)
    })
}

////LIST////
const listAlbums = (lastItem, albumFilter, limit, callback) => {
  var query = {}
  if (albumFilter) {
    const arrFilter = split(':', albumFilter)
    const filterField = head(arrFilter)
    const filterValue = last(arrFilter)
    const selectorValue = {}
    selectorValue[filterField] = Number(filterValue)
      ? Number(filterValue)
      : filterValue

    query = { selector: selectorValue, limit }
  } else if (lastItem) {
    query = { selector: { _id: { $gt: lastItem }, type: 'album' }, limit }
  } else {
    query = { selector: { _id: { $gte: null }, type: 'album' }, limit }
  }

  finder(query, callback)
}

////

const listWishlistAlbums = (lastItem, albumFilter, limit, callback) => {
  var query = {}
  if (albumFilter) {
    const arrFilter = split(':', albumFilter)
    const filterField = head(arrFilter)
    const filterValue = last(arrFilter)
    const selectorValue = {}
    selectorValue[filterField] = Number(filterValue)
      ? Number(filterValue)
      : filterValue

    query = { selector: selectorValue, limit }
  } else if (lastItem) {
    query = {
      selector: { _id: { $gt: lastItem }, type: 'wishlist_album' },
      limit
    }
  } else {
    query = { selector: { _id: { $gte: null }, type: 'wishlist_album' }, limit }
  }

  finder(query, callback)
}

////Helper(s)////
const finder = (query, cb) => {
  query
    ? db.find(query).then(res => cb(null, res.docs)).catch(err => cb(err))
    : cb(null, [])
}

function addDoc(doc, callback) {
  db.put(doc, function(err, doc) {
    if (err) callback(err)
    callback(null, doc)
  })
}

const dal = {
  createAlbum,
  createWishlistAlbum,
  getAlbum,
  getWishlistAlbum,
  updateWishlistAlbum,
  deleteAlbum,
  deleteWishlistAlbum,
  listAlbums,
  listWishlistAlbums
}

module.exports = dal
