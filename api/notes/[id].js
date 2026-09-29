const { createClient } = require("@libsql/client");

const database = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

module.exports = async function (request, response) {
  if (request.method !== "DELETE") {
    response.status(405).json({ error: "Nieobsługiwana metoda." });
    return;
  }

  await database.execute({ sql: "DELETE FROM notes WHERE id = ?", args: [request.query.id] });
  response.json({ message: "Notatka usunięta." });
};