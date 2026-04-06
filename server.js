require("dotenv").config();

const path = require("path");
const express = require("express");
const { checkDatabase } = require("./db");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const rootDir = __dirname;

app.use(express.json());
app.use(express.static(rootDir));

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    runtime: "node",
    service: "sasf-law-firm",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/db-check", async (_request, response) => {
  try {
    const result = await checkDatabase();

    response.json({
      ok: true,
      provider: "neon",
      database: result.database_name,
      schema: result.schema_name,
      serverTime: result.server_time
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      provider: "neon",
      error: error.message
    });
  }
});

app.use((_request, response) => {
  response.sendFile(path.join(rootDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`SASF Law Firm server running at http://localhost:${PORT}`);
});
