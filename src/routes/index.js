// import router
const siteRouter = require('./siteRouter')
const authRouter = require('./authRouter')
const searchRouter = require('./searchRouter')
const orderRouter = require('./orderRouter')
const accountRouter = require('./accountRouter')
const generalRouter = require('./generalRouter')
const notificationRouter = require('./notificationRouter')
const adminRouter = require('./adminRouter')
const cartRouter = require('./cartRouter')

function route(app) {

  app.use('/search', searchRouter)
  app.use('/auth', authRouter)
  app.use('/order', orderRouter)
  app.use('/account', accountRouter)
  app.use('/general', generalRouter)
  app.use('/notification', notificationRouter)
  app.use('/admin', adminRouter)
  app.use('/cart', cartRouter)
  app.use('/', siteRouter)

  // Add a new route for category type filtering
  app.get('/products/type/:type', (req, res) => {
      const type = req.params.type;
      res.redirect(`/product/filter?type=${encodeURIComponent(type)}`);
  });

  // Placeholder for other routes
  // These will be simple placeholders to get the app running
  app.get('/', (req, res) => {
    res.render('client/pages/home', { 
      title: { title: 'Trang chủ' }
    })
  })

  // 404 route - always keep this last
  app.use((req, res) => {
    res.status(404).render('client/pages/404', { 
      title: { title: 'Không tìm thấy trang' } 
    })
  })
}

module.exports = route