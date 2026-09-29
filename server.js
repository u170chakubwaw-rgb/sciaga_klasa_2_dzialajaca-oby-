const path = require("path");
const fs = require("fs");
const express = require("express");
const initSqlJs = require("sql.js");

const app = express();
const port = process.env.PORT || 3000;
const databaseFile = path.join(__dirname, "notatki.db");
let database;

app.use(express.json());

const defaultNotes = [
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

function saveDatabase() {
  const data = database.export();
  fs.writeFileSync(databaseFile, Buffer.from(data));
}

function setupDatabase(SQL) {
  if (fs.existsSync(databaseFile)) {
    database = new SQL.Database(fs.readFileSync(databaseFile));
  } else {
    database = new SQL.Database();
  }

  database.run(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
  `);

  const oldNotes = database.exec(
    "SELECT COUNT(*) FROM notes WHERE title = 'HTML' OR title = 'SQL'",
  )[0].values[0][0];
  if (oldNotes > 0) {
    database.run("DELETE FROM notes");
  }

  const notesCount = database.exec("SELECT COUNT(*) AS count FROM notes")[0]
    .values[0][0];
  if (notesCount === 0) {
    defaultNotes.forEach(function (note) {
      database.run(
        "INSERT INTO notes (title, category, content) VALUES (?, ?, ?)",
        note,
      );
    });
  }
  saveDatabase();
}

app.get("/api/notes", function (request, response) {
  const search = request.query.search || "";
  const category = request.query.category || "Wszystkie";
  let query = "SELECT id, title, category, content FROM notes WHERE 1 = 1";
  const values = [];

  if (search) {
    query += " AND (title LIKE ? OR content LIKE ?)";
    values.push("%" + search + "%", "%" + search + "%");
  }

  if (category !== "Wszystkie") {
    query += " AND category = ?";
    values.push(category);
  }

  query += " ORDER BY id DESC";
  const result = database.exec(query, values);
  const notes =
    result.length === 0
      ? []
      : result[0].values.map(function (row) {
          return {
            id: row[0],
            title: row[1],
            category: row[2],
            content: row[3],
          };
        });
  response.json(notes);
});

app.post("/api/notes", function (request, response) {
  const title = (request.body.title || "").trim();
  const category = (request.body.category || "Inne").trim();
  const content = (request.body.content || "").trim();

  if (!title || !content) {
    response.status(400).json({ error: "Tytuł i treść są wymagane." });
    return;
  }

  database.run(
    "INSERT INTO notes (title, category, content) VALUES (?, ?, ?)",
    [title, category, content],
  );
  const result = database.exec(
    "SELECT id, title, category, content FROM notes WHERE id = last_insert_rowid()",
  )[0].values[0];
  const note = {
    id: result[0],
    title: result[1],
    category: result[2],
    content: result[3],
  };
  saveDatabase();
  response.status(201).json(note);
});

app.delete("/api/notes/:id", function (request, response) {
  const oldCount = database.exec(
    "SELECT COUNT(*) FROM notes WHERE id = " + Number(request.params.id),
  )[0].values[0][0];
  database.run("DELETE FROM notes WHERE id = ?", [request.params.id]);

  if (oldCount === 0) {
    response.status(404).json({ error: "Nie znaleziono notatki." });
    return;
  }

  saveDatabase();
  response.json({ message: "Notatka usunięta." });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "dist")));
  app.use(function (request, response) {
    response.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

initSqlJs().then(function (SQL) {
  setupDatabase(SQL);
  app.listen(port, function () {
    console.log("Aplikacja działa na http://localhost:" + port);
  });
});
