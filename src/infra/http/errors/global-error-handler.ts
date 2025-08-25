import type { ErrorRequestHandler } from "express"
import { ZodError } from "zod"

export const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({
      path: i.path.join("."),
      code: i.code,
      message: i.message,
    }))

    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Alguns campos são inválidos.",
      issues,
    })
  }

  return res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: "Ops! Algo deu errado.",
  })
}
