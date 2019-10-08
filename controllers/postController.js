const Post = require('../models/Post')
const User = require('../models/User')


exports.viewCreateSCreen = function(req, res){
  res.render('create-post')
}

exports.createPost = function(req, res){
  let post = new Post(req.body, req.session.user._id)
  post.create().then(function(newId){
    req.flash('success', 'post successfully created')
    req.session.save(() => res.redirect(`/post/${newId}`))
  }).catch(function(error){
    errors.forEach(error => req.flash('errors', error))
    req.session.save(() => res.redirect('/'))
  })
}

exports.viewSingle = async function(req, res){
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    res.render('view-single', {post: post})
  } catch  {
    res.render('404')
  }
}

exports.viwEditScreen = async function(req, res){
   Post.findSingleById(req.params.id).then(function(post){
    if(post.authorId == req.visitorId){
    res.render('edit-post', {post: post})
    } else {
      req.flash(() => res.redirect('/'))
    }
   }).catch(function(){
     res.render('404')
   })
}

exports.edit = function(req, res){
  let post = new Post(req.body, req.visitorId, req.params.id)
  post.update().then((status) => {
    if(status == 'success'){
      req.flash('success', 'post updated successfully')
      req.session.save(function(){
        res.redirect(`/post/${req.params.id}/edit`)
      })
    }else {
      post.errors.forEach(function(error){
        req.flash('errors', error)
      })
      req.session.save(function(){
        res.redirect(`/post/${req.params.id}/edit`)
      })
    }
  }).catch(() => {
    req.flash('errors', 'you are not permitted to perform that action')
    req.session.save(function(){
      res.redirect('/')
    })
  })
}

exports.delete = function(req, res){
  Post.deletePost(req.params.id, req.visitorId).then(() => {
    req.flash('success', 'post successfully deleted')
    req.session.save(() => res.redirect(`/profile/${req.session.user.username}`))
  }).catch(() => {
    req.flash('errors', 'you dont have permission to perform that action')
    req.session.save(() => res.redirect('/'))
  })
}
