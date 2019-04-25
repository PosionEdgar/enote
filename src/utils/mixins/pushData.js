import pReduce from 'p-reduce'
import { mapGetters, mapActions } from 'vuex'
import { pushNotebook, pushNote, createTag, deleteTag, uploadFile } from '@/service'
import LocalDAO from '../../../db/api'
import { readFileSync, createReadStream, unlinkSync } from 'fs'

const mimes = ['image/png', 'image/gif','image/jpeg']

export default {
  data () {
    return {
    }
  },

  computed: {
    ...mapGetters({
      allFileMap: 'GET_FILES',
      allTagMap: 'GET_TAGS_MAP',
      isSyncing: 'GET_IS_SYNCING',
      tagsNeedPush: 'GET_TAGS_NEED_PUSH',
      filesNeedPush: 'GET_FILES_NEED_PUSH'
    })
  },

  methods: {
    ...mapActions([
      'SET_IS_SYNCING',
      'SET_FILE_PUSH_FINISHED'
    ]),

    tranData (file) {
      let parentFolder = this.allFileMap[file.parent_folder]

      if (file.type === 'folder') {
        return {
          noteBookId: file.remote_id || file.id,
          parentId: parentFolder ? parentFolder.remote_id : '/',
          seq: file.seq,
          title: file.title,
          trash: file.trash
        }
      } else if (file.type === 'doc') {
        console.log('doc-push', file)
        return {
          noteBookId: parentFolder ? parentFolder.remote_id : '/',
          noteContent: file.content,
          noteId: file.remote_id || file.id,
          title: file.title,
          trash: file.trash,
          top: file.top,
          tagId: file.tags.map(tagId => {
            let tag = this.allTagMap[tagId]
            return tag ? tag.remote_id : undefined
          }).filter(tag => tag)
        }
      }
    },

    createPromise (data, type) {
      if (type === 'folder') {
        return new Promise ((resolve, reject) => {
          pushNotebook(data).then(resp => {
            if (resp.data.returnCode === 200) {
              resolve(resp.data.body)
            } else {
              this.SET_IS_SYNCING(false)
              reject(resp.data.returnMsg)
            }
          })
        })
      } else if (type === 'doc') {
        return new Promise ((resolve, reject) => {
          pushNote(data).then(resp => {
            if (resp.data.returnCode === 200) {
              resolve(resp.data.body)
            } else {
              this.SET_IS_SYNCING(false)
              reject(resp.data.returnMsg)
            }
          })
        })
      } else if (type === 'tag') {
        return new Promise((resolve, reject) => {
          createTag(data).then(resp => {
            if (resp.data.returnCode === 200) {
              resolve(resp.data.body)
            } else {
              this.SET_IS_SYNCING(false)
              reject(resp.data.returnMsg)
            }
          })
        })
      } else if (type === 'deleteTag') {
        return new Promise((resolve, reject) => {
          console.log('deleteTag-data', data)
          deleteTag(data).then(resp => {
            if (resp.data.returnCode === 200) {
              resolve(resp.data.body)
            } else {
              this.SET_IS_SYNCING(false)
              reject(resp.data.returnMsg)
            }
          })
        })
      } else if (type === 'img') {
        return new Promise((resolve, reject) => {
          uploadFile(data.file).then(resp => {
            LocalDAO.files.getById({
              id: data.img.doc_id
            }).then(doc => {
              let oldContent = doc.content
              console.log('resp', resp)
              let newContent = doc.content.replace(new RegExp(data.img.path,'gm'), resp.data.body[0].url)
              console.log('newContent', newContent)
              LocalDAO.files.update({
                id: data.img.doc_id,
                data: {
                  content: newContent
                }
              }).then(() => {
                LocalDAO.img.removeById({
                  id: data.img._id
                }).then(() => {
                  unlinkSync(data.img.path.replace('file:///', ''))
                  resolve()
                })
              })
            })
          })
        })
      }
    },

    async runPushTasks (tagsNeedDelete, foldersNeedPushByDepth, foldersNeedPush, docsNeedPush) {
      let tagTrashPromises = null
      console.log('runPushTasks-2222', tagsNeedDelete)
      if (tagsNeedDelete.length > 0) {
        tagTrashPromises = this.createPromise({
          tags: tagsNeedDelete.map(item => item.remote_id)
        }, 'deleteTag')
      }

      let tagPromises = null
      if (this.tagsNeedPush.length > 0) {
        tagPromises = this.createPromise({
          tags: this.tagsNeedPush.map(item => item.name)
        }, 'tag')
      }

      let folderPromises = foldersNeedPushByDepth.map(files => {
        let data = files.map(file => {
          return this.tranData(file)
        })
        return this.createPromise(data, 'folder')
      })

      let docPromises = this.createPromise(
        docsNeedPush.map(file => {
          return this.tranData(file, 'doc')
        })
      , 'doc')

      let deleteTagRes = []
      if (tagTrashPromises) {
        deleteTagRes = await tagTrashPromises
      }

      let tagRes = []
      if (tagPromises) {
        tagRes = await tagPromises
      }

      await Promise.all(tagsNeedDelete.map(tag => {
        return LocalDAO.tag.removeById({
          id: tag._id
        })
      }))

      this.tagsNeedPush.forEach((item, index) =>{
        this.UPDATE_TAG({
          id: item._id,
          data: {
            remote_id: tagRes[index].tagId
          }
        })
      })

      let noteBookRes = await pReduce(folderPromises, async (total, res) => {
        if (total === 0) {
          total = []
        }
        console.log('folderPromises-res', res)
        return [...total, ...res]
      }, 0)

      console.log('noteBookRes', noteBookRes)

      foldersNeedPush.forEach((item, index) => {
        this.SET_FILE_PUSH_FINISHED({
          id: item.id,
          remote_id: noteBookRes[index].noteBookId
        })
      })

      let noteRes = await docPromises

      console.log('noteRes', noteRes)
      
      docsNeedPush.forEach((item, index) => {
        this.SET_FILE_PUSH_FINISHED({
          id: item.id,
          remote_id: noteRes[index].noteId
        })
      })

      let deleteFilePromise = this.filesNeedPush.filter(file => file.trash === 'DELETE')
        .map(file => {
          return LocalDAO.files.removeById({
            id: file.id
          })
        })

      await Promise.all(deleteFilePromise)

      this.SET_IS_SYNCING(false)
      return [tagRes, noteBookRes, noteRes]
    },

    pushData () {
      return new Promise((resolve, reject) => {
        LocalDAO.tag.getAllTrash().then(trashTagResp => {
          let tagsNeedDelete = trashTagResp.filter(item => item.remote_id)
          // tagsNeedDelete = []
          if (this.filesNeedPush.length + tagsNeedDelete.length === 0) {
            console.log('no-file-need-push')
            resolve()
            return
          }
          let foldersNeedPush = this.filesNeedPush
            .filter(item => item.type === 'folder')
            .sort((a, b) => a.depth - b.depth)
    
          let foldersNeedPushByDepth = []
    
          let docsNeedPush = this.filesNeedPush
            .filter(item => item.type === 'doc')
          // if (foldersNeedPush.length + docsNeedPush.length === 0) {
          //   console.log('pushData', foldersNeedPush.length, docsNeedPush.length)
          //   resolve()
          // }
          console.log('syncData', foldersNeedPush, docsNeedPush)
          this.SET_IS_SYNCING(true)
          if (foldersNeedPush.length > 0) {
            let minDepth = foldersNeedPush[0].depth
            let maxDepth = foldersNeedPush[foldersNeedPush.length - 1].depth
      
            for (let i = minDepth; i <= maxDepth; i++) {
              let arr = foldersNeedPush.filter(item => item.depth === i)
              if (arr.length > 0) {
                foldersNeedPushByDepth.push(arr)
              }
            }
          }
    
          let resps = this.runPushTasks(tagsNeedDelete, foldersNeedPushByDepth, foldersNeedPush, docsNeedPush)
          resolve(resps)
        })
      })
    },

    async pushImgs () {
      return new Promise((resolve, reject) => {
        LocalDAO.img.getAll().then(allImgs => {
          console.log('pushImgs-allImgs', allImgs)
          Promise.all(allImgs.filter(img => mimes.indexOf(img.mime) > -1 && img.path)
          .map(img => {
            let buffer = readFileSync(img.path.replace('file:///', ''))
            let blob = new Blob([buffer])
            let file = new window.File([blob], img.name, {type: img.mime})
            return this.createPromise({
              img: img,
              file: file
            }, 'img')
          })).then(imgResp => {
            console.log('imgResp', imgResp)
            resolve(imgResp)
          })
          // allImgs.forEach(img => {
          //   if (mimes.indexOf(img.mime) > -1 && img.path) {
          //     console.log('img', img)
          //     let buffer = readFileSync(img.path.replace('file:///', ''))
          //     let blob = new Blob([buffer])
          //     let file = new window.File([blob], img.name, {type: img.mime})
              
          //     uploadFile(file).then(resp => {
          //       LocalDAO.files.getById({
          //         id: img.doc_id
          //       }).then(doc => {
          //         let oldContent = doc.content
          //         let newContent = doc.content.replace(new RegExp(img.path,'gm'), resp.data.body[0].url)
          //         console.log('newContent', newContent)
          //         LocalDAO.files.update({
          //           id: img.doc_id,
          //           data: {
          //             content: newContent
          //           }
          //         }).then(() => {
          //           LocalDAO.img.removeById({
          //             id: img._id
          //           }).then(() => {
          //             unlinkSync(img.path.replace('file:///', ''))
          //             resolve()
          //           })
          //         })
          //       })
          //     })
          //   }
          // })
        })
      })
    },
  }
}
