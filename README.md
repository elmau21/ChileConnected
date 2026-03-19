# ChileConnected

Plataforma web para centralizar beneficios sociales de Chile (scraping + base MongoDB + recomendaciones) con chatbot inteligente (Groq) y RAG.

## Requisitos

- Node.js 22+
- MongoDB local o Atlas

## Configuración

1) Copia variables de entorno:

```bash
copy .env.example .env
```

2) Instala dependencias:

```bash
npm install
```

## Desarrollo

### API

```bash
npm run dev:api
```

### Web

```bash
npm run dev:web
```

## Pipeline de datos

- Scraping:

```bash
npm run scrape
```

- Instalar browsers de Playwright (requerido para scraping):

```bash
npx playwright install
```

- Backfill embeddings (si no se generan en el scraping):

```bash
npm run embed:backfill
```

## Atlas Vector Search

Este repo soporta:

- **Atlas Vector Search (preferido)**: requiere crear un índice vectorial en Atlas.
- **Fallback cosine**: si `USE_ATLAS_VECTOR=false`, se calcula similitud en la app.

### Ejemplo de índice (Atlas)

- **Colección**: `beneficios`
- **Campo vectorial**: `embedding`
- **Dimensión**: 384 (para `Xenova/all-MiniLM-L6-v2`)
- **Similarity**: cosine

