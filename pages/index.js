"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { supabase } from "../lib/supabaseClient";
import Image from "next/image";

const THEME = {
  radius: 12,
  colors: {
    text: "#1d2a3a",
    white: "#ffffff",
    grayBg: "rgba(255,255,255,0.9)",
    graySoft: "rgba(255,255,255,0.4)",
    grayBorder: "#e3e6ea",
    primary: "#2f80ed",
    primaryOn: "#ffffff",
    danger: "#e5484d",
    columnBg: "rgba(225,215,240,0.55)",
    cardBg: "rgba(107,84,134,0.95)",
    cardText: "#f6f7fb",
    columnTitle: "#5b2c6f",
  },
  shadow: {
    sm: "0 6px 16px rgba(0,0,0,.10)",
    lg: "0 24px 60px rgba(0,0,0,.25)",
  },
};

function Navbar({ onAddCard, onGenerateAI }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 70,
        background: "rgba(255,255,255,0.9)",
        borderBottom: `1px solid ${THEME.colors.grayBorder}`,
        boxShadow: THEME.shadow.sm,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 32px",
        zIndex: 1000,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative", width: 40, height: 28 }}>
          <Image
            src="/trellologo.png"
            alt="Logo"
            fill
            style={{ objectFit: "contain" }}
            sizes="(max-width: 600px) 32px, 40px"
            priority
          />
        </div>
        <h2 style={{ color: THEME.colors.text, fontSize: 22 }}>Trello Clone</h2>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onAddCard}
          style={{
            padding: "8px 14px",
            background: THEME.colors.white,
            color: THEME.colors.text,
            border: `1px solid ${THEME.colors.grayBorder}`,
            borderRadius: THEME.radius,
            cursor: "pointer",
          }}
        >
          + Add a Card
        </button>
        <button
          onClick={onGenerateAI}
          style={{
            padding: "8px 14px",
            background: THEME.colors.primary,
            color: THEME.colors.primaryOn,
            border: "none",
            borderRadius: THEME.radius,
            cursor: "pointer",
          }}
        >
          ✨ Create with AI
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   MODAL
   ============================================================ */
function Modal({ title, children, onClose, actions }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(6px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          background: THEME.colors.grayBg,
          borderRadius: THEME.radius * 1.5,
          boxShadow: THEME.shadow.lg,
          padding: 24,
          border: `1px solid ${THEME.colors.grayBorder}`,
          animation: "popIn 0.2s ease-out",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 12,
            fontSize: 20,
            fontWeight: 700,
            color: THEME.colors.text,
            textAlign: "center",
          }}
        >
          {title}
        </h3>
        <div style={{ marginBottom: 20 }}>{children}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          {actions}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes popIn {
          from {
            transform: translateY(10px);
            opacity: 0.9;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   APP PRINCIPAL
   ============================================================ */
const COLUMNS = [
  { id: "todo", name: "To Do" },
  { id: "doing", name: "Doing" },
  { id: "done", name: "Done" },
];

function reindex(list, columnId) {
  return list.map((item, idx) => ({
    ...item,
    column: columnId,
    position: idx,
  }));
}

export default function Home() {
  const [columns, setColumns] = useState({ todo: [], doing: [], done: [] });
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState(null);
  const [currentCard, setCurrentCard] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    loadCards();
  }, []);

  async function loadCards() {
    const { data } = await supabase
      .from("cards")
      .select("*")
      .order("position", { ascending: true });
    const grouped = { todo: [], doing: [], done: [] };
    for (const c of data || []) (grouped[c.column] ??= []).push(c);
    setColumns(grouped);
    setLoading(false);
  }

  // ======== CRIAR =========
  async function handleAddCard() {
    setTitle("");
    setContent("");
    setModalType("create");
  }

  async function saveNewCard() {
    if (!title.trim()) return;
    await supabase.from("cards").insert({
      title,
      content,
      column: "todo",
      position: columns.todo.length,
    });
    await loadCards();
    setModalType(null);
  }

  // ======== GERAR COM IA =========
  async function handleGenerateAI() {
    setTitle("");
    setModalType("ai");
  }

  async function generateAIContent() {
    if (!title.trim()) return;

    const r = await fetch("/api/ai-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    const { description } = await r.json();

    await supabase.from("cards").insert({
      title,
      content: description,
      column: "todo",
      position: columns.todo.length,
    });

    await loadCards();
    setModalType(null);
  }

  // ======== EDITAR / EXCLUIR =========
  function openEdit(card) {
    setCurrentCard(card);
    setTitle(card.title);
    setContent(card.content || "");
    setModalType("edit");
  }

  async function saveEdit() {
    await supabase
      .from("cards")
      .update({ title, content })
      .eq("id", currentCard.id);
    await loadCards();
    setModalType(null);
  }

  function openDelete(card) {
    setCurrentCard(card);
    setModalType("delete");
  }

  async function confirmDelete() {
    await supabase.from("cards").delete().eq("id", currentCard.id);
    await loadCards();
    setModalType(null);
  }

  // ======== DRAG & DROP =========
  async function onDragEnd(result) {
    const { source, destination } = result;
    if (!destination) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    const start = Array.from(columns[sourceCol]);
    const finish = sourceCol === destCol ? start : Array.from(columns[destCol]);
    const [moved] = start.splice(source.index, 1);
    finish.splice(destination.index, 0, moved);

    const newState = { ...columns };
    newState[sourceCol] = reindex(start, sourceCol);
    newState[destCol] = reindex(finish, destCol);
    setColumns(newState);

    await supabase
      .from("cards")
      .update({ column: destCol, position: destination.index })
      .eq("id", moved.id);
  }

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 40, fontSize: 18 }}>
        Carregando...
      </div>
    );

  return (
    <>
      <Navbar onAddCard={handleAddCard} onGenerateAI={handleGenerateAI} />

      {/* BOARD */}
      <div style={{ paddingTop: 100, paddingBottom: 60 }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 24,
            }}
          >
            {COLUMNS.map((col) => (
              <Droppable key={col.id} droppableId={col.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      background: THEME.colors.columnBg,
                      borderRadius: THEME.radius,
                      padding: 16,
                      width: 300,
                      minHeight: 420,
                      boxShadow: THEME.shadow.sm,
                    }}
                  >
                    <h3
                      style={{
                        textAlign: "center",
                        color: THEME.colors.columnTitle,
                        marginBottom: 10,
                      }}
                    >
                      {col.name}
                    </h3>

                    {columns[col.id].map((card, index) => (
                      <Draggable
                        key={String(card.id)}
                        draggableId={String(card.id)}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              background: THEME.colors.cardBg,
                              borderRadius: THEME.radius,
                              padding: 12,
                              marginBottom: 8,
                              color: THEME.colors.cardText,
                              boxShadow: THEME.shadow.sm,
                              ...provided.draggableProps.style,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <strong>{card.title}</strong>
                              <div style={{ display: "flex", gap: 4 }}>
                                <button
                                  onClick={() => openEdit(card)}
                                  style={{
                                    background: "#fff",
                                    border: "none",
                                    borderRadius: 6,
                                    cursor: "pointer",
                                  }}
                                >
                                  📝
                                </button>
                                <button
                                  onClick={() => openDelete(card)}
                                  style={{
                                    background: "#ffecec",
                                    border: "none",
                                    borderRadius: 6,
                                    cursor: "pointer",
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                            {card.content && (
                              <p
                                style={{
                                  marginTop: 6,
                                  fontSize: 14,
                                  lineHeight: 1.4,
                                }}
                              >
                                {card.content}
                              </p>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* ========== MODAIS ========== */}

      {/* Novo Card */}
      {modalType === "create" && (
        <Modal
          title="New Card"
          onClose={() => setModalType(null)}
          actions={
            <>
              <button onClick={() => setModalType(null)}>Cancel</button>
              <button
                onClick={saveNewCard}
                style={{
                  background: THEME.colors.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: THEME.radius,
                  padding: "8px 12px",
                }}
              >
                Save
              </button>
            </>
          }
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title..."
            style={{
              width: "100%",
              padding: 10,
              borderRadius: THEME.radius,
              border: `1px solid ${THEME.colors.grayBorder}`,
              marginBottom: 10,
            }}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Description..."
            rows={4}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: THEME.radius,
              border: `1px solid ${THEME.colors.grayBorder}`,
            }}
          />
        </Modal>
      )}

      {/* Gerar com IA */}
      {modalType === "ai" && (
        <Modal
          title="Create Card with AI 🤖"
          onClose={() => setModalType(null)}
          actions={
            <>
              <button onClick={() => setModalType(null)}>Cancel</button>
              <button
                onClick={generateAIContent}
                style={{
                  background: THEME.colors.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: THEME.radius,
                  padding: "8px 12px",
                }}
              >
                Create
              </button>
            </>
          }
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title to generate with AI..."
            style={{
              width: "100%",
              padding: 10,
              borderRadius: THEME.radius,
              border: `1px solid ${THEME.colors.grayBorder}`,
            }}
          />
        </Modal>
      )}

      {/* Editar */}
      {modalType === "edit" && (
        <Modal
          title="Edit Card"
          onClose={() => setModalType(null)}
          actions={
            <>
              <button onClick={() => setModalType(null)}>Cancel</button>
              <button
                onClick={saveEdit}
                style={{
                  background: THEME.colors.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: THEME.radius,
                  padding: "8px 12px",
                }}
              >
                Save
              </button>
            </>
          }
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título..."
            style={{
              width: "100%",
              padding: 10,
              borderRadius: THEME.radius,
              border: `1px solid ${THEME.colors.grayBorder}`,
              marginBottom: 10,
            }}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Descrição..."
            rows={4}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: THEME.radius,
              border: `1px solid ${THEME.colors.grayBorder}`,
            }}
          />
        </Modal>
      )}

      {/* Excluir */}
      {modalType === "delete" && (
        <Modal
          title="Delete Card"
          onClose={() => setModalType(null)}
          actions={
            <>
              <button onClick={() => setModalType(null)}>Cancel</button>
              <button
                onClick={confirmDelete}
                style={{
                  background: THEME.colors.danger,
                  color: "#fff",
                  border: "none",
                  borderRadius: THEME.radius,
                  padding: "8px 12px",
                }}
              >
                Delete
              </button>
            </>
          }
        >
          <p style={{ textAlign: "center" }}>
            Are you sure you want to delete this card?{" "}
            <strong>{currentCard?.title}</strong>?
          </p>
        </Modal>
      )}
    </>
  );
}
