const User = require('../models/User')
const Post = require('../models/Post')

exports.mustBeLoggedIn = function(req, res, next){
  if(req.session.user){
    next()
  } else {
    req.flash('errors', 'you must be logged in to perform that actions')
    req.session.save(function(){
      res.redirect('/')
    })
  }
}

exports.register = function(req, res){
  let user = new User(req.body,)
  user.register().then(function(){
    req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id}
    req.session.save(function(){
      res.redirect('/')
    })
  }).catch(function(regErrors){
    regErrors.forEach(function(error){
      req.flash('errors', error)
    })
    req.session.save(function(){
      res.redirect('/')
    })
  })
}

exports.login = function(req, res){
  let user = new User(req.body)
  user.login().then((result) => {
    req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id}
    req.session.save(function(){
      res.redirect('/')
    })
  }).catch((error) => {
    req.flash('errors', error)
    req.session.save(function(){
      res.redirect('/')
    })
  })
}

exports.logout = function(req, res){
  req.session.destroy(function(){
    res.redirect('/')
  })
}

exports.home = function(req, res){
  if (req.session.user) {
    res.render('home-dashboard', {avatar: req.session.user.avatar, username: req.session.user.username})
  } else {
    res.render('home-guest', {regErrors: req.flash('regErrors')})
  }
}

exports.ifUserExists = function(req, res, next){
  User.findByUsername(req.params.username).then(function(userDocument){
    req.profileUser = userDocument
    next()
  }).catch(function(){
    res.render('404')
  })
}

exports.profileSCreen = async function(req, res){
  try {
    //tell our Post model to give us a list of posts by a authorid
    let posts = await Post.findByAuthorId(req.profileUser._id)
    res.render('view-profile', {
      posts: posts,
      profileUsername : req.profileUser.username,
      profileAvatar : req.profileUser.avatar
    })
  } catch {
    res.render('404')
  }
}