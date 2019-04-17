import File from './file'

export default class FileTree {
  constructor (options) {
    for (let name in options) {
      if (options.hasOwnProperty(name)) {
        this[name] = options[name]
      }
    }

    this.map = {}
    this.remote_map = {}
    this.arr = []
    this.flat_map = {}
    // this.isInit = true
    this.root = new File({
      data: {
        title: '我的文件夹',
        type: 'folder',
        depth: 0
      },
      store: this
    })
  }

  init (data) {
    data.forEach(item => {
      this.addFile(item, true)
    })

    for (let i in this.map) {
      let file = this.map[i]
      console.log('init-file', file.title, file.parent_folder)
      if (file.parent_folder !== '/' && !this.map[file.parent_folder]) {
        if (this.remote_map[file.parent_folder]) {
          file.data.parent_folder = this.remote_map[file.parent_folder].id
        } else {
          file.update({
            parent_folder: '/'
          }, true)
        }
      }
    }
    this.root.getAncestorFolders()
    console.log('init-0', this.root)
    return this
  }

  addFile (data, isExist) {
    console.log('addFile', data.title, data.seq, data.parent_folder, data.remote_id, data._id)
    // return
    let newFile = new File({
      id: data.remote_id || data._id,
      data: data,
      seq: data.seq,
      need_push_remotely: data.need_push,
      store: this,
      isExist: isExist
    })
    this.map[data._id] = newFile
    if (data.remote_id) {
      this.remote_map[data.remote_id] = newFile
    }
    this.arr.push(newFile)
    return this
  }

  updateFile (data, lazy) {
    // console.log('updateFile', data)
    let file = this.map[data.id]
    file.update(data)
    if (!lazy) {
      this.updateFlatMap()
    }
    return this
  }

  appendFile (data) {
    let { id, targetId } = data
    let file = this.map[id]
    let targetFolder = this.map[targetId] || this.root
    let oldParentFolder = this.map[file.parent_folder] || this.root

    if (targetFolder.type !== 'folder') {
      console.error('target should not be a folder')
      return
    }

    if (file === targetFolder || file.child_folders.indexOf(targetFolder.id) > -1) {
      console.error('target should not be a child')
      return
    }

    let oldSeq = file.seq

    oldParentFolder._child_folders.splice(file.seq, 1)
    targetFolder._child_folders.push(file.id)

    for (let i = file.seq, len = oldParentFolder._child_folders.length; i < len; i++) {
      this.map[oldParentFolder._child_folders[i]].update({
        seq: i
      })
    }

    file.update({
      parent_folder: targetFolder.data.depth === 0 ? '/' : targetId,
      seq: targetFolder._child_folders.length - 1
    }, true)
  
    return this
  }

  moveFile (data) {
    let { id, broId, type } = data
    let file = this.map[id]
    let broFile = this.map[broId]
    let targetFolder = this.map[broFile.parent_folder] || this.root
    let oldParentFolder = this.map[file.parent_folder] || this.root

    console.log('moveFile', targetFolder, oldParentFolder, file.seq)

    if (targetFolder === file || file._child_folders.indexOf(targetFolder.id) > -1) {
      console.error('target should not be a child')
      return
    }

    let pos = 0
   
    if (targetFolder.id !== oldParentFolder.id) {
      pos = type === 'before'
        ? broFile.seq
        : broFile.seq + 1

      oldParentFolder._child_folders.splice(file.seq, 1)
      targetFolder._child_folders.splice(pos, 0, file.id)

      oldParentFolder._child_folders.forEach(item => {
        let child = this.map[item]
        let newSeq = oldParentFolder._child_folders.indexOf(item)
        if (child.seq !== newSeq) {
          child.update({
            seq: newSeq
          })
        }
      })

      targetFolder._child_folders.forEach(item => {
        let child = this.map[item]
        let newSeq = targetFolder._child_folders.indexOf(item)
        if (child.id === id) {
          child.update({
            parent_folder: targetFolder.data.depth === 0 ? '/' : targetFolder.id,
            seq: newSeq
          })
        } else if (child.seq !== newSeq) {
          child.update({
            seq: newSeq
          })
        }
      })
    } else {
      pos = type === 'before'
        ? (broFile.seq === 0 ? 0 : broFile.seq - 1)
        : broFile.seq + 1
      move(targetFolder._child_folders, file.seq, pos)

      targetFolder._child_folders.forEach(item => {
        let child = this.map[item]
        let newSeq = targetFolder._child_folders.indexOf(item)
        if (child.seq !== newSeq) {
          child.update({
            seq: newSeq
          })
        }
      })
    }

    return this
  }

  updateFlatMap (isLazy) {
    // this.flat_map = {}
    console.log('updateFlatMap', isLazy)
    // this.root.getAncestorFolders()
    // let map = this.map
    let arr = isLazy ? this.arr.filter(item => item.need_push_locally) : this.arr
    // console.log('updateFlatMap-00000', arr)
    // for (let i in this.arr) {
    //   let item = this.arr[i]
    //   if (item.need_push_locally) {
    //     this.flat_map[item.id] = createFlatFile(item)
    //   }
    // }
    arr.forEach(item => {
      // console.log('2222222', item)
      this.flat_map[item.id] = createFlatFile(item)
    })
    // let map = !isLazy ? this.map : this.needUpdateFiles.map(item => this.map[item])
    // console.log('updateFlatMap', map)
    // for (let i in map) {
    //   let flat_file = createFlatFile(map[i])
    //   this.flat_map[i] = flat_file
    // }
    // if (this.isInit) {
    //   this.isInit = false
    // }
  }

  finishPushLocally (id) {
    this.map[id].need_push_locally = false
  }
}

function createFlatFile (file) {
  // console.log('createFlatFile', file.title, file.id)
  // file.getAncestorFolders()
  return {
    id: file.data._id,
    remote_id: file.data.remote_id,
    cache_id: file.cache_id,
    type: file.type,
    seq: file.seq,
    title: file.title,
    parent_folder: file.parent_folder,
    ancestor_folders: file.ancestor_folders,
    trash: file.trash,
    link: file.link,
    create_at: file.create_at,
    update_at: file.update_at,
    need_push_locally: file.need_push_locally,
    need_push_remotely: file.need_push_remotely,
    // children: file.children,
    child_folders: file.child_folders,
    _child_folders: file._child_folders,
    child_docs: file.child_docs,
    content: file.content,
    file_size: file.file_size
  }
}

function move (arr, pos, toPos) {
  [].splice.apply(
    arr,
    [].concat.apply(
      [toPos, 0],
      arr.splice(pos, 1)
    )
  )
}