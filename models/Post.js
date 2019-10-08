const postsCollection = require('../db').db().collection('posts')
const ObjectID = require('mongodb').ObjectID
const User = require('./User')
const sanitizeHTML = require('sanitize-html')


const Post = function(data, userid, requestedPostId){
  this.data = data
  this.errors = []
  this.userid = userid
  this.requestedPostId = requestedPostId
}

Post.prototype.cleanUp = function(){
  if(typeof(this.data.title) !== 'string'){this.data.title = ''}
  if(typeof(this.data.body) !== 'string'){this.data.body = ''}

  this.data = {
    title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
    body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),
    createdDate: new Date(),
    author: ObjectID(this.userid)
  }
}

Post.prototype.validate = function(){

}

Post.prototype.create = function(){
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    if(!this.errors.length){
     postsCollection.insertOne(this.data).then(function(info){
      resolve(info.ops[0]._id)
     }).catch(function(){
      reject()
     })
      
    } else {
      reject(this.errors)
    }
  })
}

Post.prototype.update = function(){
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(this.requestedPostId, this.userid)
    if(post.isVisitorOwner){
     let status = await this.actuallyUpdate()
      resolve(status)
    } else {
      reject()
    }
    } catch  {
      reject()
    }
  })
}


Post.prototype.actuallyUpdate = function(){
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    if(!this.errors.length){
      await postsCollection.findOneAndUpdate({_id: new ObjectID(this.requestedPostId)}, {$set: {title: this.data.title, body: this.data.body}})
      resolve('success')
    } else {
      resolve('failure')
    }
  })
}



Post.reusablePostQuery = function(uniqueOperations, visitorId){
  return new Promise(async function(resolve, reject){
    let aggOperations = uniqueOperations.concat([
      {$lookup: {from: 'users', localField: 'author', foreignField: '_id', as: 'authorDocument'}},
      {$project: {
        title: 1,
        body: 1,
        createdDate: 1,
        authorId: '$author',
        author: {$arrayElemAt: ['$authorDocument', 0]}
      }}
    ])

    let posts = await postsCollection.aggregate(aggOperations).toArray()

    //clean authorDocument
    posts = posts.map(function(post){
      post.isVisitorOwner = post.authorId.equals(visitorId)
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar
      }
      return post
    })
    
    resolve(posts)
  })
}


Post.findSingleById = function(id, visitorId){
  return new Promise(async function(resolve, reject){
    if(typeof(id) !== 'string' || !ObjectID.isValid(id)){
      reject()
      return
    }
    let posts = await Post.reusablePostQuery([
      {$match: {_id: new ObjectID(id)}}
    ], visitorId)
    
    if(posts.length){
      // console.log(posts[0])
      resolve(posts[0])
    } else {
      reject()
    }
  })
}


Post.findByAuthorId = function(authorId){
  return Post.reusablePostQuery([
    {$match: {author: authorId}},
    {$sort: {createdDate: -1}}
  ])
}

Post.deletePost = function(postIdToDelete, currentUserId){
  return new Promise( async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(postIdToDelete, currentUserId)
      if(post.isVisitorOwner){
        await postsCollection.deleteOne({_id: new ObjectID(postIdToDelete)})
        resolve()
      } else {
        reject()
      }
    } catch  {
      reject()
    }
  })
}


module.exports = Post