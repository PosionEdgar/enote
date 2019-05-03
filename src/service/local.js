import LocalDAO from '../../db/api'

// user
export function getAllLocalUser () {
  return LocalDAO.user.getAll()
}

export function getLocalUserById (params) {
  return LocalDAO.user.getById(params)
}

export function updateLocalUser (params) {
  return LocalDAO.user.update(params)
}

// folder
export function getAllLocalFolder () {
  return LocalDAO.folder.getAll()
}

export function getAllLocalFolderByQuery (params) {
  return LocalDAO.folder.getAllByQuery(params)
}

export function getLocalFolderByPid (params) {
  return LocalDAO.folder.getAllByPid(params)
}

export function getLocalTrashFolder () {
  return LocalDAO.folder.getTrash()
}

export function addLocalFolder (params) {
  return LocalDAO.folder.add(params)
}

export function updateLocalFolder (params) {
  return LocalDAO.folder.update(params)
}

// note
export function getAllLocalNote () {
  return LocalDAO.note.getAll()
}

export function getAllLocalNoteByQuery (params) {
  return LocalDAO.note.getAllByQuery(params)
}

export function getLocalNoteByPid (params) {
  return LocalDAO.note.getAllByPid(params)
}

export function getLocalTrashNote () {
  return LocalDAO.note.getTrash()
}

export function addLocalNote (params) {
  return LocalDAO.note.add(params)
}

export function updateLocalNote (params) {
  return LocalDAO.note.update(params)
}

export function removeLocalNote (params) {
  return LocalDAO.note.removeById(params)
}

// doc
export function getAllLocalDoc () {
  return LocalDAO.doc.getAll()
}

export function getLocalDoc (params) {
  return LocalDAO.doc.getByNoteId(params)
}

export function updateLocalDoc (params) {
  return LocalDAO.doc.update(params)
}

// bin
export function deleteAllTrash () {
  return new Promise((resolve, reject) => {
    LocalDAO.folder.updateByQuery({
      query: { trash: 'TRASH' },
      data: { trash: 'DELETED' }
    }).then(() => {
      LocalDAO.note.updateByQuery({
        query: { trash: 'TRASH' },
        data: { trash: 'DELETED' }
      }).then(() => {
        resolve()
      })
    })
  })
}

export function resumeAllTrash () {
  return new Promise((resolve, reject) => {
    LocalDAO.folder.updateByQuery({
      query: { trash: 'TRASH' },
      data: { trash: 'NORMAL' }
    }).then((folders) => {
      LocalDAO.note.updateByQuery({
        query: { trash: 'TRASH' },
        data: { trash: 'NORMAL' }
      }).then((notes) => {
        if (!folders) {
          folders = []
        }
        if (Object.prototype.toString.call(folders) !== `[object Array]`) {
          folders = [folders]
        }
        if (!notes) {
          notes = []
        }
        if (Object.prototype.toString.call(notes) !== `[object Array]`) {
          notes = [notes]
        }
        resolve(folders.concat(notes))
      })
    })
  })
}
