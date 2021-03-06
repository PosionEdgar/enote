import { htmlToText, getValid } from '../tools'
import { promisifyAll } from '../promisify'
import docModel from '../models/doc'
import { LinvoDB } from '../index'
import noteCtr from './note'
import imgCtr from './img'

let Doc = {}

function createCollection (path) {
  LinvoDB.dbPath = path
  Doc = new LinvoDB(`doc`, {
    type: {
      type: String,
      default: 'doc'
    },
    remote_id: {
      type: String
    },
    note_id: String,
    remote_note_id: String,
    content: {
      type: String,
      default: ''
    },
    create_at: Date,
    update_at: Date,
    need_push: {
      type: Boolean,
      default: true
    }
  })
  promisifyAll(Doc)
}

// save
function saveAll (req) {
  const { data } = req

  return new Promise((resolve, reject) => {
    Doc.save(data).exec((err, docs) => {
      resolve(docs)
    })
  })
}

// add
function add (req) {
  let data = docModel(req)

  return new Promise((resolve, reject) => {
    Doc.insert(data, (err, docs) => {
      resolve(docs)
    })
  })
}

// remove
function removeAll () {
  return new Promise((resolve, reject) => {
    Doc.find({}).exec((err, docs) => {
      docs.forEach(doc => {
        doc.remove()
      })
      resolve(docs.length)
    })
  })
}

function removeById (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    Doc.findOne({ _id: id }).exec((err, doc) => {
      Doc.remove()
      resolve()
    })
  })
}

function removeByNoteId (req) {
  const { note_id } = req

  return new Promise((resolve, reject) => {
    Doc.findOne({ note_id: note_id }).exec((err, doc) => {
      doc && doc.remove()
      resolve()
    })
  })
}

function deleteAll () {
  return new Promise((resolve, reject) => {
    Doc.find({}).exec((err, docs) => {
      let p = docs.map(doc => {
        return update({
          id: doc._id,
          trash: 'DELETED'
        })
      })
      Promise.all(p).then(() => {
        resolve(docs.length)
      })
    })
  })
}

// update
function update (req) {
  const { id } = req
  req.update_at = new Date().valueOf()

  return new Promise((resolve, reject) => {
    Doc.findOne({ _id: id })
    .exec((err, doc) => {
      Doc.update(
        { _id: id },
        { $set: req },
        { multi: true },
        (err, num, newDoc) => {
          noteCtr.update({
            id: newDoc.note_id,
            size: newDoc.content.length,
            need_push: true
          }).then(note => {
            resolve(htmlToText(newDoc.content))
          })
        }
      )
    })
  })
}

function updateImg (reqs) {
  return new Promise((resolve, reject) => {
    let p = reqs.map((req, index) => {
        return new Promise((resolve, reject) => {
          Doc.findOne({ note_id: req.note_id }).exec((err, doc) => {
          if (!doc) resolve()
          let oldContent = doc.content
          let newContent = oldContent.replace(new RegExp(req.img.path,'gm'), req.img.url)
          let newReq = {
            id: doc._id,
            content: newContent
          }
          update(newReq).then((res) => {
            imgCtr.removeById({ id: req.img.id }).then(() => {
              resolve(res)
            })
          })
        })
      })
    })
    Promise.all(p).then((res) => {
      resolve(res)
    })
  })
}

// get
function getAll () {
  return new Promise((resolve, reject) => {
    Doc.find({}).exec((err, docs) => {
      resolve(docs)
    })
  })
}

function getByNoteId (req) {
  const { note_id } = req
  return new Promise((resolve, reject) => {
    Doc.findOne({ note_id: note_id }).exec((err, doc) => {
      resolve(doc)
    })
  })
}

function getById (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    Doc.findOne({ _id: id }).exec((err, doc) => {
      resolve(doc)
    })
  })
}

function getTrash () {
  return new Promise((resolve, reject) => {
    Doc.find({ trash: 'TRASH' }).exec((err, docs) => {
      resolve(docs)
    })
  })
}

export default {
  createCollection,
  saveAll,
  add,
  removeAll,
  removeById,
  removeByNoteId,
  deleteAll,
  update,
  updateImg,
  getAll,
  getByNoteId,
  getById,
  getTrash
}
