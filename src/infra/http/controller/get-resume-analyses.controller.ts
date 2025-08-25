import type { Request, Response } from "express"
import z from "zod"
import type { GetResumeAnalysesUseCase } from "../../../application/use-cases/get-resume-analyses-use-case"

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
})

export class GetResumeAnalysesController {
  constructor(private useCase: GetResumeAnalysesUseCase) {}

  async handle(req: Request, res: Response) {
    const { page, perPage } = querySchema.parse(req.query)
    const result = await this.useCase.execute({ page, perPage })

    if (result.isError()) {
      return res.status(400).json({ error: result.value })
    }
    return res.status(200).json(result.value)
  }
}
