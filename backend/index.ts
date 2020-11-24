import '../service-loader'
import express, { NextFunction, Request, Response } from 'express'
import { WServer } from '../my-framework'

const app = express()

const services = WServer(8082)

app.get('/', (request, response, next) => {
    response.send(`
    <DOCTYPE html>
    <html>
        <head>
            <script src="/bundle.js"></script>
        </head>
        <body>

        </body>
    </html>
`)
})

app.use(express.static('../frontend/dist'))

app.listen(8081)
