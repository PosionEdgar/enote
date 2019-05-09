import { getValid } from '../tools'
import userModel from '../models/user'
import { LinvoDB } from '../index'

let User = {}

function createCollection (path) {
  LinvoDB.dbPath = path

  User = new LinvoDB('user', {
    username: String,
    password: String,
    oa_id: String,
    account_name_cn: String,
    image_url: String,
    position_id: String,
    position_name: String,
    department_id: String,
    department_name: String,
    friend_list: [String],
    is_sync: {
      type: Boolean,
      default: false
    },
    access_token: String,
    id_token: String
  })
}

// save
function saveAll (req) {
  const { data } = req

  return new Promise((resolve, reject) => {
    User.save(data).exec((err, users) => {
      resolve(users)
    })
  })
}

// add
function add (req) {
  console.log('add-user', req)
  let data = userModel(req)

  return new Promise((resolve, reject) => {
    User.insert(data, (err, users) => {
      resolve(users)
    })
  })
}

// remove
function removeAll () {
  return new Promise((resolve, reject) => {
    User.find({}).exec((err, users) => {
      users.forEach(user => {
        User.remove()
      })
      resolve(users.length)
    })
  })
}

function removeById (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    User.findOne({ _id: id }).exec((err, user) => {
      User.remove()
      resolve()
    })
  })
}

// update
function update (req) {
  const { usercode } = req
  console.log('update-user', req)

  return new Promise((resolve, reject) => {
    User.findOne({ usercode: usercode })
    .exec((err, user) => {
      console.log('update-user-111', user)
      if (!user) {
        add(req).then(user => {
          resolve(user)
        })
      } else {
        User.update(
          { usercode: usercode },
          { $set: req },
          { multi: true },
          (err, numReplaced, newUser) => {
            console.log('update-folder-111', numReplaced, newUser)
            resolve(newUser)
          }
        )
      }
    })
  })
}

// get
function getAll () {
  console.log('User', User)
  return new Promise((resolve, reject) => {
    User.find({}).exec((err, users) => {
      resolve(users)
    })
  })
}

function getById (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    User.findOne({ _id: id }).exec((err, doc) => {
      resolve(doc)
    })
  })
}

export default {
  createCollection,
  saveAll,
  add,
  removeAll,
  removeById,
  update,
  getAll,
  getById
}