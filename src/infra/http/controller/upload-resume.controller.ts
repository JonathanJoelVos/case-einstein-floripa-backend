import type { Request, Response } from "express";
import type { UploadResumeUseCase } from "../../../application/use-cases/upload-resume-use-case.js";


const ALLOWED = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ])
  
  const MAX_SIZE = 8 * 1024 * 1024 

export class UploadResumeController {
    constructor(private uploadResumeUseCase: UploadResumeUseCase){ }
    async handle(req: Request, res: Response){
        const file = req.file

        if (!file) {
            return res.status(400).json({ error: "Arquivo ausente (campo 'cv')." })
        }

        if (!ALLOWED.has(file.mimetype)) {
            return res.status(415).json({ error: "Formato inválido. Use PDF/DOC/DOCX." })
        }

        if (file.size > MAX_SIZE) {
            return res.status(413).json({ error: "Arquivo maior que 8MB." })
        }

        const result = await this.uploadResumeUseCase.execute({
            body: file.buffer,
            fileName: file.originalname,
            fileType: file.mimetype
        })

        if (result.isError()){
            return res.status(400).json({
                error: result.value
            });
        }

        return res.status(201).json(result.value);
    }
}