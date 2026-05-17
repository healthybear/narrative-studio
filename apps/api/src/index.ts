import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
})

// Register plugins
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
})

await fastify.register(helmet)

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
})

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// API routes
fastify.get('/api/hello', async () => {
  return { message: 'Hello from Narrative Studio API' }
})

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001
    const host = process.env.HOST || '0.0.0.0'

    await fastify.listen({ port, host })
    console.log(`🚀 API server running at http://${host}:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
