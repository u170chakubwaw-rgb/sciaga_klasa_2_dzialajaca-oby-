import { useEffect, useState } from "react";

const categories = ["Wszystkie", "Geografia"];

function App() {
  const [notes, setNotes] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [chosenCategory, setChosenCategory] = useState("Wszystkie");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", category: "Geografia", content: "" });

  function getNotes() {
    const url = "/api/notes?search=" + encodeURIComponent(searchText) +
      "&category=" + encodeURIComponent(chosenCategory);

    fetch(url)
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        setNotes(data);
      })
      .catch(function () {
        setError("Nie działa serwer Node.");
      });
  }

  useEffect(function () {
    getNotes();
  }, [searchText, chosenCategory]);

  function changeForm(event) {
    const name = event.target.name;
    const value = event.target.value;
    setForm({ ...form, [name]: value });
  }

  function addNote(event) {
    event.preventDefault();
    const enteredPassword = prompt("Podaj hasło:");
    if (!enteredPassword) {
      return;
    }
    setError("");

    fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, password: enteredPassword }),
    }).then(function (response) {
      if (!response.ok) {
        setError(response.status === 401 ? "Złe hasło." : "Uzupełnij tytuł i treść.");
        return;
      }

      return response.json();
    }).then(function (note) {
      if (!note) return;
      setNotes(function (oldNotes) {
        return [note].concat(oldNotes);
      });
      setForm({ title: "", category: "Geografia", content: "" });
      setShowModal(false);
    }).catch(function () {
      setError("Nie działa serwer Node.");
    });
  }

  function deleteNote(id) {
    if (!confirm("Usunąć tę notatkę?")) return;
    const enteredPassword = prompt("Podaj hasło:");
    if (!enteredPassword) {
      return;
    }

    fetch("/api/notes/" + id, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: enteredPassword }),
    }).then(function (response) {
      if (response.ok) getNotes();
      else alert("Złe hasło.");
    });
  }

  return (
    <main className="layout">
      <aside className="sidebar">
        <nav className="categories">
          {categories.map(function (category) {
            return (
              <button
                className={chosenCategory === category ? "category active" : "category"}
                onClick={function () { setChosenCategory(category); }}
                key={category}
              >
                {category}
                {category === "Wszystkie" && <strong>{notes.length}</strong>}
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <h1>Geografia</h1>
          <button className="add-button" onClick={function () { setShowModal(true); }}><span>+</span> Dodaj notatkę</button>
        </header>

        <section className="toolbar">
          <label className="search"><span>⌕</span><input value={searchText} onChange={function (event) { setSearchText(event.target.value); }} placeholder="Szukaj w notatkach..." /></label>
          <span className="result-count">{notes.length} notatek</span>
        </section>

        <section className="notes-grid">
          {notes.map(function (note) {
            return (
              <article className="note-card" key={note.id}>
                <div className="note-top"><span className="tag">{note.category}</span><button className="delete-button" onClick={function () { deleteNote(note.id); }}>×</button></div>
                <h2>{note.title}</h2><p>{note.content}</p>
              </article>
            );
          })}
        </section>

      </section>

      {showModal && <div className="modal-backdrop" onClick={function (event) { if (event.target === event.currentTarget) setShowModal(false); }}>
        <form className="modal" onSubmit={addNote}>
          <button type="button" className="close-button" onClick={function () { setShowModal(false); }}>×</button>
          <p className="eyebrow">NOWA NOTATKA</p><h2>Dodaj coś od siebie</h2>
          <label>Tytuł<input name="title" value={form.title} onChange={changeForm} required /></label>
          <label>Kategoria<select name="category" value={form.category} onChange={changeForm}><option>Geografia</option></select></label>
          <label>Treść<textarea name="content" value={form.content} onChange={changeForm} required rows="5" /></label>
          <p className="form-error">{error}</p><button className="save-button">Zapisz notatkę</button>
        </form>
      </div>}
    </main>
  );
}

export default App;
