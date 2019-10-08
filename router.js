const express = require('express')
const router = express.Router()
const userController = require('./controllers/userController')
const postController = require('./controllers/postController')

router.get('/', userController.home)
router.post('/register', userController.register)
router.post('/login', userController.login)
router.post('/logout', userController.logout)

router.get('/profile/:username', userController.ifUserExists, userController.profileSCreen)


router.get('/create-post', postController.viewCreateSCreen)
router.post('/create-post', userController.mustBeLoggedIn, postController.createPost)
router.get('/post/:id', userController.mustBeLoggedIn, postController.viewSingle)
router.get('/post/:id/edit', userController.mustBeLoggedIn, postController.viwEditScreen)
router.post('/post/:id/edit', userController.mustBeLoggedIn, postController.edit)
router.post('/post/:id/delete', userController.mustBeLoggedIn, postController.delete)


module.exports = router