const router = require('koa-router')()

router.prefix('/study')

router.get('/', function (ctx, next) {
  ctx.body = 'this is a study response!'
})

router.get('/bar', function (ctx, next) {
  ctx.body = 'this is a study/bar response'
})

module.exports = router
