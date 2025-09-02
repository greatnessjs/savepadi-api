import express, { Request, Response } from 'express'
import bodyParser from 'body-parser'
import appRoutes from './routes'


const app = express()
const port = 3000


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded())

// parse application/json
app.use(bodyParser.json())

appRoutes(app)

app.listen(port, () => {
  console.info(`[SERVER] started at port ${process.env.PORT || port}`)
})
