
---

# Case Einstein Floripa — Backend (API)

API em **Express** responsável por:

* receber **upload de currículos** (PDF/DOC/DOCX),
* salvar o arquivo,
* **extrair dados com IA (Gemini)**,
* persistir **análise**,
* expor **listas**, **sumários** e **séries temporais** para o painel.

---

# Base URL

https://case-einstein-floripa-backend.onrender.com

## Sumário

1. [Rotas](#rotas)

   * [POST `/resumes/upload`](#post-resumesupload)
   * [GET `/resumes/analyses`](#get-resumesanalyses)
   * [GET `/resumes/analyses/summary`](#get-resumesanalysessummary)
   * [GET `/resumes/analyses/timeseries`](#get-resumesanalysestimeseries)
   * [Arquivos estáticos `/uploads/*`](#arquivos-estáticos-uploads)
2. [Modelos de dados (resumo)](#modelos-de-dados-resumo)
3. [Erros e status](#erros-e-status)
4. [Como rodar localmente](#como-rodar-localmente)
5. [Variáveis de ambiente](#variáveis-de-ambiente)

---

## Rotas

### POST `/resumes/upload`

Recebe um arquivo **multipart** (campo `cv`) e dispara o fluxo:

1. upload para disco,
2. criação do registro `resumes`,
3. extração via **IA** (Gemini) e persistência em `resume_analyses`.

**Validações**

* Tipos aceitos: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
* Tamanho máximo: **8MB**
* Campo obrigatório: `cv`

**Request (multipart/form-data)**

```
cv: <arquivo .pdf | .doc | .docx>
```

**Responses**

* `201 Created`

  ```json
  { "url": "/uploads/seu-arquivo-1737912345.pdf" }
  ```
* `400 Bad Request` – erro de regra (ex.: falha IA com rollback)

  ```json
  { "error": { "code": "IA_EXTRACT_FAILED", "message": "Falha ao extrair dados do currículo via IA." } }
  ```
* `413 Payload Too Large`

  ```json
  { "error": "Arquivo maior que 8MB." }
  ```
* `415 Unsupported Media Type`

  ```json
  { "error": "Formato inválido. Use PDF/DOC/DOCX." }
  ```
* `400 Bad Request` — arquivo ausente

  ```json
  { "error": "Arquivo ausente (campo 'cv')." }
  ```

**cURL**

```bash
curl -X POST http://localhost:3000/api/resumes/upload \
  -F "cv=@./curriculo.pdf"
```

---

### GET `/resumes/analyses`

Lista análises paginadas.

**Query params**

* `page` (opcional, default `1`)
* `perPage` (opcional, default `20`, máx. `100`)

**Response `200 OK`**

```json
{
  "items": [
    {
      "id": "ana_01",
      "resumeId": "res_01",
      "name": "Fulana da Silva",
      "email": "fulana@email.com",
      "phone": "55 48 9xxxx-xxxx",
      "areas": ["Docencia","Hogwarts"],
      "cultureScore": 7,
      "cultureScoreDescription": "Evidências: monitoria em X; projeto social Y; estágio com responsabilidades claras.",
      "realExperience": true,
      "yearsOfExperience": 2,
      "summary": "Licenciada, experiência com monitoria e projeto social; interesse em docência e tecnologia.",
      "createdAt": "2025-01-23T14:12:00.000Z",
      "resume": {
        "id": "res_01",
        "fileName": "fulana-cv.pdf",
        "fileType": "application/pdf",
        "url": "/uploads/fulana-cv-1737912345.pdf"
      }
    }
  ],
  "page": 1,
  "perPage": 20
}
```

**cURL**

```bash
curl "http://localhost:3000/api/resumes/analyses?page=1&perPage=20"
```

---

### GET `/resumes/analyses/summary`

Retorna **indicadores agregados** para os cards do dashboard.

**Query params**

* `windowDays` (opcional, `1..90`, default `7`)
  Janela recente usada para comparar crescimento.

**Response `200 OK`**

```json
{
  "totalAnalyses": 128,                     // total de análises no banco
  "avgCultureScore": 6.4,                   // média geral (0–10)
  "shareRealExperience": 0.42,              // proporção 0..1 com experiência real
  "docenciaEnsinosCount": 57,               // Docência + Hogwarts
  "docenciaTopCooccurrence": {              // área que mais coocorre com Docência/Ensinos
    "area": "Vale do Silicio",
    "count": 18
  },
  "newAnalysesLastWindow": 23,              // novos na janela atual (ex.: últimos 7 dias)
  "newAnalysesPrevWindow": 20,              // novos na janela anterior
  "lastWindowChangePct": 15.0               // variação percentual vs. janela anterior
}
```

**cURL**

```bash
curl "http://localhost:3000/api/resumes/analyses/summary?windowDays=7"
```

---

### GET `/resumes/analyses/timeseries`

Série temporal diária (para gráficos). **Uma das duas** formas de janela:

* Por dias relativos:

  * `?days=30`
* Por intervalo absoluto:

  * `?start=2025-01-01&end=2025-01-31`

**Response `200 OK`**

```json
{
  "items": [
    {
      "date": "2025-01-15",
      "total": 6,               // análises totais no dia
      "docenciaEnsinos": 3,     // Docência + Hogwarts no dia
      "realExperience": 2       // com experiência real no dia
    }
  ]
}
```

**cURL**

```bash
curl "http://localhost:3000/api/resumes/analyses/timeseries?days=30"
# ou
curl "http://localhost:3000/api/resumes/analyses/timeseries?start=2025-01-01&end=2025-01-31"
```

> Se a query estiver inválida (ex.: não mandou `days` nem `start/end`), a API responde `400` com mensagem de validação.

---

### Arquivos estáticos `/uploads/*`

Os currículos salvos são servidos como estáticos.
No servidor, algo como:

```ts
app.use("/uploads", express.static(path.resolve("uploads")))
```

No front, o link final fica:

```
{VITE_API_BASE_URL}{resume.url}
# ex.: http://localhost:3000/uploads/fulana-cv-1737912345.pdf
```

---

## Modelos de dados (resumo)

**Resume (arquivo)**

```ts
{
  id: string
  fileName: string
  fileType: string
  url: string | null
  createdAt: Date
}
```

**ResumeAnalysis (resultado IA)**

```ts
{
  id: string
  resumeId: string
  name: string | null
  email: string | null
  phone: string | null
  areas: string[]                  // 1..3 dentre: Ministerio, Embaixada do Amor, Vale do Silicio, Time Square, Hogwarts, Docencia
  cultureScore: number             // 0..10 (inteiro)
  cultureScoreDescription: string | null
  realExperience: boolean
  yearsOfExperience: number | null // quando deduzido
  summary: string | null
  createdAt: Date
  resume: Resume                   // incluído no GET /resumes/analyses
}
```

---

## Erros e status

* **Validação do upload**:

  * `400` arquivo ausente (`cv`)
  * `415` tipo não suportado
  * `413` acima de 8MB
* **Falha na IA**:

  * `400` com `{ error: { code: "IA_EXTRACT_FAILED", ... } }`
  * **Rollback**: se a IA falhar, a API **remove o arquivo** salvo e **apaga o registro** do `resume` para manter consistência.

> Demais erros de validação (query/body) retornam `400` com uma mensagem objetiva.

---

## Como rodar localmente

**Requisitos**

* Node **22.x**
* Postgres (Docker recomendado)
* Prisma CLI

1. **Clonar e instalar**

```bash
git clone https://github.com/JonathanJoelVos/case-einstein-floripa-backend.git
cd case-einstein-back
npm i
```

2. **Subir Postgres (Docker Compose)**

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: postgres
    environment:
      POSTGRES_USER: dockeruser
      POSTGRES_PASSWORD: dockerpassword
      POSTGRES_DB: dockerdatabase
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```

```bash
docker compose up -d
```

3. **Criar `.env`**

```bash
cp .env.example .env
```

Exemplo:

```env
# Prisma
DATABASE_URL="postgresql://dockeruser:dockerpassword@localhost:5432/dockerdatabase?schema=public"

# Upload
UPLOAD_DIR=./uploads
PUBLIC_UPLOAD_BASE=/uploads

# IA (Gemini)
GEMINI_API_KEY=coloque_sua_chave_aqui
GEMINI_MODEL=gemini-2.5-flash
```

4. **Prisma (migrations + client)**

```bash
npx prisma migrate dev
npx prisma generate
```

5. **Criar diretório de uploads (se não existir)**

> Em tempo de execução a implementação já cria, mas você pode garantir com:

```bash
mkdir -p uploads
```

6. **Rodar**

```bash
npm run dev
# Server: http://localhost:3000
# Rotas em /api
```

> **Dica**: se for servir os arquivos estáticos, confirme que o server tem:
>
> ```ts
> app.use("/uploads", express.static(path.resolve("uploads")))
> ```

---
Feito com 💙 por Jojo :)

## Variáveis de ambiente

| Nome                 | Obrigatória   | Exemplo / Observação                                          |
| -------------------- | ------------- | ------------------------------------------------------------- |
| `DATABASE_URL`       | ✅             | `postgresql://user:pass@localhost:5432/db?schema=public`      |
| `UPLOAD_DIR`         | ✅             | `./uploads` (pasta onde os arquivos serão gravados)           |
| `PUBLIC_UPLOAD_BASE` | ✅             | `/uploads` (prefixo público exposto pelo `express.static`)    |
| `GEMINI_API_KEY`     | ✅             | Chave da API do Google Generative AI                          |
| `GEMINI_MODEL`       | ⛔️ (opcional) | Default interno (ex.: `gemini-2.5-flash` ou `gemini-1.5-pro`) |

---
