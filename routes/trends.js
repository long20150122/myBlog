const router = require('koa-router')()

router.prefix('/trends')

router.get('/', function (ctx, next) {
  ctx.body = 'this is a trends response!'
})

router.get('/bar', function (ctx, next) {
  ctx.body = 'this is a trends/bar response'
})

module.exports = router
