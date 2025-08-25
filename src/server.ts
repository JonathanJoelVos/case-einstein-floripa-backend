import express from "express"
import cors from "cors"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { resumesRouter } from "./infra/http/routes/resumes.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.resolve(__dirname, "../uploads")
const PUBLIC_BASE = process.env.PUBLIC_UPLOAD_BASE ?? "/uploads"

export const app = express()

app.use(express.json())
app.use(cors())

app.use(
  PUBLIC_BASE,
  cors(),
  express.static(UPLOAD_DIR, {
    index: false,              
    fallthrough: true,
    setHeaders(res) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin")
    },
  })
)

app.use("/api", resumesRouter)

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000")
  console.log(`📁 Uploads servidos em http://localhost:3000${PUBLIC_BASE}`)
})
