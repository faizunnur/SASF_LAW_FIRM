const { neon } = require("@neondatabase/serverless");

function getSqlClient() {
  const { DATABASE_URL } = process.env;

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to your .env file.");
  }

  return neon(DATABASE_URL);
}

async function checkDatabase() {
  const sql = getSqlClient();
  const [result] = await sql`
    SELECT
      current_database() AS database_name,
      current_schema() AS schema_name,
      now() AS server_time
  `;

  return result;
}

module.exports = {
  checkDatabase,
  getSqlClient
};
