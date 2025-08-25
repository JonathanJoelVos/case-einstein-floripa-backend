import multer from "multer"
import type { StorageEngine } from "multer"
import { Readable } from "node:stream"
import fs from "node:fs"
import { promises as fsp } from "node:fs"
import path from "node:path"
import type { Uploader, UploadParams } from "../../application/storage/uploader.js"

type MulterDiskStorageOpts = {
  dir: string
  publicBaseUrl?: string
  filename?: (fileName: string, fileType: string) => string | undefined
}

export class MulterDiskStorage implements Uploader {
  private storage: StorageEngine

  constructor(private opts: MulterDiskStorageOpts) {
    this.ensureDir()

    this.storage = multer.diskStorage({
      destination: (_req, _file, cb) => {
        try {
          this.ensureDir()
          cb(null, opts.dir)
        } catch (err) {
          cb(err as Error, opts.dir)
        }
      },
      filename: (_req, file, cb) => {
        const custom = opts.filename?.(file.originalname, file.mimetype)
        if (custom) return cb(null, custom)

        const ext =
          path.extname(file.originalname) || this.guessExt(file.mimetype) || ""

        const base = path
          .basename(file.originalname, ext)
          .replace(/[^\w\-]+/g, "_")
          .slice(0, 60)

        cb(null, `${base}-${Date.now()}${ext}`)
      },
    })
  }

  async upload({ body, fileName, fileType }: UploadParams): Promise<{ url: string }> {
    this.ensureDir()

    const stream = Readable.from(body)

    const fileLike: any = {
      fieldname: "cv",
      originalname: fileName,
      mimetype: fileType,
      stream,
    }

    const reqLike: any = {}

    const fileInfo = await new Promise<any>((resolve, reject) => {
      this.storage._handleFile(reqLike, fileLike, (err: any, out: any) => {
        if (err) return reject(err)
        resolve(out)
      })
    })

    const filename = fileInfo?.filename ?? path.basename(fileInfo?.path ?? fileName)
    const base = this.opts.publicBaseUrl ?? "/uploads"
    const url = this.joinUrl(base, filename)

    return { url }
  }

  async remove(url: string): Promise<void> {
    try {
      this.ensureDir() 

      const base = this.opts.publicBaseUrl ?? "/uploads"

      let rel = ""
      try {
        const u = new URL(url, "http://dummy.local")
        rel = u.pathname
      } catch {
        rel = url
      }

      if (rel.startsWith(base)) {
        rel = rel.slice(base.length)
      }

      const filename = path.basename(rel.replace(/^\/+/, ""))
      const absPath = path.join(this.opts.dir, filename)

      await fsp.unlink(absPath)
    } catch {
    }
  }


  private ensureDir() {
    fs.mkdirSync(this.opts.dir, { recursive: true })
  }

  private joinUrl(base: string, seg: string) {
    return `${base.replace(/\/$/, "")}/${seg.replace(/^\//, "")}`
  }

  private guessExt(mime: string): string | null {
    if (mime === "application/pdf") return ".pdf"
    if (mime === "application/msword") return ".doc"
    if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return ".docx"
    return null
  }
}
