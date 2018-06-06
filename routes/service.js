const router = require('koa-router')()

router.prefix('/service')

router.get('/', function (ctx, next) {
  ctx.body = 'this is a service response!'
})

router.get('/bar', function (ctx, next) {
  ctx.body = 'this is a service/bar response'
})

module.exports = router
