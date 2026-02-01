import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import apiRoutes from './routes/api.routes.js'
import prisma from './services/prisma.service.js'
import { corsConfig } from './config/cors.config.js'

const app = express()
const port = process.env.PORT || 4000

// Apply CORS middleware
app.use(cors(corsConfig))

// CORS error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
      origin: req.headers.origin,
    })
  }
  next(err)
})

// Middlewares
app.use(express.json({ limit: '10mb' })) // Increase limit for file uploads
app.use(express.urlencoded({ extended: true }))

// Api Routes
app.use('/api', apiRoutes)

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  })
})

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
