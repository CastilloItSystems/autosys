import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import apiRoutes from './routes/api.routes.js'
import prisma from './services/prisma.service.js'
import { corsConfig } from './config/cors.config.js'

const app = express()
const port = process.env.PORT || 4000

// Create HTTP server
const server = createServer(app)

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: corsConfig.origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

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

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log('🔌 Usuario conectado:', socket.id)

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('🔌 Usuario desconectado:', socket.id)
      })

      // Join room
      socket.on('join-room', (roomId: string) => {
        socket.join(roomId)
        console.log(`📍 Usuario ${socket.id} se unió a la sala: ${roomId}`)
      })

      // Leave room
      socket.on('leave-room', (roomId: string) => {
        socket.leave(roomId)
        console.log(`📍 Usuario ${socket.id} salió de la sala: ${roomId}`)
      })
    })

    server.listen(port, () => {
      console.log(`✅ Servidor corriendo en el puerto ${port}`)
      console.log(`🔌 WebSockets habilitados en el puerto ${port}`)
    })
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos.')
    console.error(error)
    process.exit(1)
  }
}

// Export io for use in other modules
export { io }

startServer()
