const { createClient } = require("@libsql/client");

const database = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const firstNotes = [
  [
    "Fazy rozwoju demograficznego",
    "Geografia",
    "W pierwszej fazie urodzenia i zgony są wysokie. W drugiej spada liczba zgonów, a ludność szybko rośnie. W trzeciej spada liczba urodzeń. W czwartej oba wskaźniki są niskie i liczba ludności jest stabilna.",
  ],
  [
    "Piramida wieku społeczeństwa",
    "Geografia",
    "Społeczeństwo młode ma piramidę szeroką u podstawy, bo rodzi się dużo dzieci. Społeczeństwo starzejące się ma wąską podstawę i dużo osób w starszym wieku.",
  ],
  [
    "Starzenie się społeczeństwa",
    "Geografia",
    "Przyczyny starzenia się społeczeństwa to mała liczba urodzeń i dłuższe życie. Skutki to większe wydatki na emerytury i leczenie oraz mniejsza liczba osób pracujących.",
  ],
  [
    "Eksplozja i regres demograficzny",
    "Geografia",
    "Eksplozja demograficzna to bardzo szybki wzrost liczby ludności. Regres demograficzny to spadek liczby ludności, gdy zgonów jest więcej niż urodzeń.",
  ],
  [
    "Etapy urbanizacji",
    "Geografia",
    "Urbanizacja obejmuje urbanizację wstępną, suburbanizację, dezurbanizację i reurbanizację. Na wykresie można je rozpoznać po zmianach liczby mieszkańców miasta i jego okolic.",
  ],
  [
    "Skutki urbanizacji",
    "Geografia",
    "Pozytywne skutki urbanizacji to więcej miejsc pracy, szkół i usług. Negatywne skutki to korki, hałas, zanieczyszczenia, drogie mieszkania i zabudowa terenów zielonych.",
  ],
];

async function startDatabase() {
  await database.execute(
    "CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, category TEXT NOT NULL, content TEXT NOT NULL)",
  );
  const count = await database.execute("SELECT COUNT(*) AS count FROM notes");
  if (Number(count.rows[0].count) === 0) {
    for (const note of firstNotes) {
      await database.execute({
        sql: "INSERT INTO notes (title, category, content) VALUES (?, ?, ?)",
        args: note,
      });
    }
  }
}

module.exports = async function (request, response) {
  await startDatabase();

  if (request.method === "GET") {
    const search = request.query.search || "";
    const result = await database.execute({
      sql: "SELECT id, title, category, content FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY id DESC",
      args: ["%" + search + "%", "%" + search + "%"],
    });
    response.json(result.rows);
    return;
  }

  if (request.method === "POST") {
    const title = (request.body.title || "").trim();
    const content = (request.body.content || "").trim();
    if (!title || !content) {
      response.status(400).json({ error: "Tytuł i treść są wymagane." });
      return;
    }
    const category = (request.body.category || "Geografia").trim();
    await database.execute({
      sql: "INSERT INTO notes (title, category, content) VALUES (?, ?, ?)",
      args: [title, category, content],
    });
    response.status(201).json({ title, category, content });
    return;
  }

  response.status(405).json({ error: "Nieobsługiwana metoda." });
};
