import 'dotenv/config'
import express, { Request, Response } from 'express'
import apiRoutes from './routes/api.routes.js'
import prisma from './services/prisma.service.js'

const app = express()
const port = process.env.PORT || 4000

// Middlewares
app.use(express.json())

// Api Routes
app.use('/api', apiRoutes)

app.get('/', (req: Request, res: Response) => {
  res.send('API is running!')
})

const startServer = async () => {
  try {
    await prisma.$connect()
    console.log('🚀 Conexión con la base de datos exitosa.')

    app.listen(port, () => {
      console.log(`✅ Servidor corriendo en el puerto ${port}`)
    })
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos.')
    console.error(error)
    process.exit(1)
  }
}

startServer()
