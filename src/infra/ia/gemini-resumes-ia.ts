import { GoogleGenerativeAI } from "@google/generative-ai"
import z from "zod"
import type { ResumesIA } from "../../application/ia/resumes-ia.js"

const AREAS = [
  "Ministerio",
  "Embaixada do Amor",
  "Vale do Silicio",
  "Time Square",
  "Hogwarts",
  "Docencia",
] as const

const AiSchema = z.object({
  name: z.string().default("").nullable(),
  email: z.string().email().or(z.string().default("")).transform((v) => v?.trim() ?? "").nullable(),
  phone: z.string().default("").nullable(),
  areas: z.array(z.string()).transform((arr) => {
    const norm = new Set(
      arr
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => normalizeArea(s))
        .filter((s): s is typeof AREAS[number] => !!s)
    )
    return Array.from(norm).slice(0, 3)
  }),
  culture_score: z.coerce.number().min(0).max(10),
  real_experience: z.coerce.boolean(),
  culture_score_description: z.string().default("").nullable(),
  summary: z.string().default("").nullable(),
})

function normalizeArea(s: string): typeof AREAS[number] | null {
  const key = s.toLowerCase()
  if (key.includes("finance") || key.includes("jur")) return "Ministerio"
  if (key.includes("pessoas") || key.includes("gest")) return "Embaixada do Amor"
  if (key.includes("tec") || key.includes("inova") || key.includes("dev") || key.includes("ti")) return "Vale do Silicio"
  if (key.includes("marketing") || key.includes("capta")) return "Time Square"
  if (key.includes("ensino") || key.includes("academ")) return "Hogwarts"
  if (key.includes("docen") || key.includes("prof") || key.includes("monitor")) return "Docencia"
  return AREAS.find((a) => a.toLowerCase() === key) ?? null
}

export class GeminiResumesIA implements ResumesIA {
  private modelId: string

  constructor(
    private apiKey: string,
    opts?: { model?: string }
  ) {
    this.modelId = opts?.model ?? "gemini-1.5-pro"
  }

  async extractDataFromResume(fileName: string, fileType: string, body: Buffer) {
    const genAI = new GoogleGenerativeAI(this.apiKey)
    const model = genAI.getGenerativeModel({
      model: this.modelId,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
        topP: 0.9,
      },
    })

    const base64 = body.toString("base64")

    const system = [
      "Você é um assistente de triagem de currículos do Einstein Floripa (ONG).",
      "Retorne EXATAMENTE um JSON com os campos solicitados, sem texto extra.",
      "NÃO invente dados: se não houver evidência clara, deixe vazio ou null conforme apropriado.",
    ].join(" ")

    const institution = [
      "Contexto da instituição:",
      "- Cursinho pré-vestibular social e gratuito, gerido por voluntários.",
      "- Departamentos (escolha 1 a 3 em 'areas'):",
      "  Ministerio (Financeiro/Jurídico), Embaixada do Amor (Gestão de Pessoas),",
      "  Vale do Silicio (Tecnologia e Inovação), Time Square (Captação/Marketing),",
      "  Hogwarts (Ensinos), Docencia (professores/monitores).",
      "- Valores culturais: Profissionalismo, Protagonismo, Compromisso, Parceria, Força de Vontade.",
    ].join("\n")

    const strictRubric = [
      "Calcule 'culture_score' (0–10) com base em evidências. Base inicial = 0.",
      "",
      "A) Valores culturais (0–5 no total): para CADA valor abaixo, pontue:",
      "   0 (nenhuma evidência), 0.5 (indício fraco), 1 (evidência clara/forte).",
      "   - Profissionalismo: resultados, prêmios, responsabilidades formais.",
      "   - Protagonismo: liderança, iniciativas próprias, projetos fundados/conduzidos.",
      "   - Compromisso: permanência prolongada, constância em voluntariado/estágios.",
      "   - Parceria: trabalho em equipe, mentoria, colaboração entre áreas.",
      "   - Força de Vontade: superação de dificuldades, conquistas apesar de barreiras.",
      "",
      "B) Experiência real (0–2):",
      "   0 = sem evidência; 1 = estágio/voluntariado curto; 2 = emprego/estágio consistente, funções claras.",
      "",
      "C) Causa social/impacto (0–1):",
      "   0 = nenhuma; 0.5 = participação pontual; 1 = envolvimento consistente/impacto claro.",
      "",
      "D) Educação/docência (0–1):",
      "   0 = nenhuma; 0.5 = tutoria/monitoria esporádica; 1 = docência/monitoria/mentoria consistente.",
      "",
      "E) Penalizações:",
      "   -1 por contradições/afirmações genéricas sem respaldo; limite mínimo final é 0.",
      "",
      "Finalize: some A+B+C+D, aplique penalizações, ARREDONDE para inteiro, TRUNQUE em [0,10].",
      "",
      "Distribuição esperada (rígida):",
      "- 9–10: raríssimo; múltiplas evidências fortes, histórico robusto e coerente.",
      "- 7–8: evidências boas e consistentes em várias frentes.",
      "- 4–6: evidências parciais/pontuais; pouca consistência.",
      "- 0–3: pouca ou nenhuma evidência concreta.",
    ].join("\n")

    const instruction = [
      "Extraia os campos do currículo fornecido.",
      "Formato de saída (JSON):",
      JSON.stringify(
        {
          name: "string | null",
          email: "string | null",
          phone: "string | null",
          areas: ["Docencia"],
          culture_score: 0,
          culture_score_description:
            "string (<= 400 chars; explique claramente de onde vieram os pontos e/ou penalizações; cite 2–5 evidências curtas do currículo como 'monitoria X', 'estágio Y', 'projeto social Z', etc.)",
          real_experience: true,
          summary:
            "string (<= 300 chars; resumo objetivo do perfil: formação/stack/interesses + 1–2 destaques concretos).",
        },
        null,
        2
      ),
      "",
      "Regras adicionais:",
      "- 'areas' deve conter 1 a 3 valores do conjunto permitido (sem sinônimos fora da lista).",
      "- 'real_experience' = true somente se houver experiência real (emprego/estágio/voluntariado com responsabilidades claras).",
      "- Se algum campo não puder ser determinado, retorne vazio ('') ou null.",
      "- Não inclua explicações fora do JSON.",
    ].join("\n")

    const result = await model.generateContent([
      { text: system },
      { text: institution },
      { text: strictRubric },
      { inlineData: { data: base64, mimeType: fileType || "application/pdf" } },
      { text: `Arquivo: ${fileName}` },
      { text: instruction },
    ])

    const text = (await result.response.text()).trim()
    const jsonText = text.replace(/^```json\s*/i, "").replace(/```$/i, "")
    const parsed = JSON.parse(jsonText)
    const validated = AiSchema.parse(parsed)

    const score = Math.max(0, Math.min(10, Math.round(Number(validated.culture_score))))

    return {
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      areas: validated.areas,
      culture_score: score,
      real_experience: validated.real_experience,
      culture_score_description: (validated.culture_score_description ?? ""),
      summary: (validated.summary ?? ""),
    }
  }
}
