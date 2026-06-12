import { useEffect, useMemo, useRef } from "react";
import {TextField } from "@mui/material";
import { ImWhatsapp } from "react-icons/im";
import { RiMessengerLine } from "react-icons/ri";
import { FaInstagram } from "react-icons/fa6";
import { MdOutlineCalendarMonth } from "react-icons/md";
import useContactClassificationKanban from "@/Hooks/Auth/useContactClassificationKanban";
import type {
  ContactClassificationGroupProj,
  ContactLogProj,
} from "@/Interfaces/Auth/ContactLogProj";
import "@/Styles/Auth/ContactKanbanPage.css";

function getDisplayName(contact: ContactLogProj) {
  return (
    contact.fullName ||
    contact.waName ||
    contact.companyName ||
    contact.phone ||
    "Contacto sin nombre"
  );
}

function getPhone(phone?: string | null) {
  if (!phone) return "-";

  const clean = phone.toString().replace(/\D/g, "");

  if (!clean) return "-";

  if (clean.startsWith("505")) {
    return `505-${clean.slice(3)}`;
  }

  return `505-${clean}`;
}

function getToday() {
  return new Date().toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
        function renderSocialIcon(contact: ContactLogProj) {
  if (contact.waId || contact.waUserId) {
    return <ImWhatsapp className="contact-kanban-card__social contact-kanban-card__social--whatsapp" />;
  }

  if (contact.psid) {
    return <RiMessengerLine className="contact-kanban-card__social contact-kanban-card__social--messenger" />;
  }

  return <FaInstagram className="contact-kanban-card__social contact-kanban-card__social--instagram" />;
}

function ContactCard({
  contact,
  color,
}: {
  contact: ContactLogProj;
  color: string;
}) {
  return (
    <article
      className="contact-kanban-card"
    >
      <div className="contact-kanban-card__top">
        <div className="contact-kanban-card__main">
          <h3 style={{
        color: color,
      }}>{getDisplayName(contact)}</h3>
          <p style={{
        color: color,
      }}>{getPhone(contact.phone)}</p>
        </div>

        <div 
        className="contact-kanban-card__social"
        >
          {renderSocialIcon(contact)}
        </div>
      </div>
    </article>
  );
}

function KanbanColumn({
  column,
  color,
  onLoadMore,
  loadingColumnId,
}: {
  column: ContactClassificationGroupProj;
  color: string;
  onLoadMore: (column: ContactClassificationGroupProj) => void;
  loadingColumnId: number | null;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const isLoadingThisColumn = loadingColumnId === column.contactClassificationId;

  useEffect(() => {
    const el = listRef.current;

    if (!el) return;

    const handleScroll = () => {
      const bottom = el.scrollHeight - el.scrollTop - el.clientHeight;

      if (bottom <= 90 && column.hasMore && !isLoadingThisColumn) {
        onLoadMore(column);
      }
    };

    el.addEventListener("scroll", handleScroll);

    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, [
    column.contactClassificationId,
    column.hasMore,
    column.pageNumber,
    column.items.length,
    isLoadingThisColumn,
    onLoadMore,
  ]);

  return (
    <section
      className="contact-kanban-column"
      style={{
        borderColor: color,
      }}
    >
      <header
        className="contact-kanban-column__header"
        style={{
          backgroundColor: color,
        }}
      >
    
        <div className="contact-kanban-column__title">
          <h2>{column.classification || "Sin clasificación"}</h2>
          <p>{column.items.length} de {column.total} contactos</p>
        </div>
      </header>

      <div
        ref={listRef}
        className="contact-kanban-column__body"
        style={{
          scrollbarColor: `${color} #f1f5f9`,
        }}
      >
        {column.items.length === 0 ? (
          <div className="contact-kanban-column__empty">
            Sin contactos
          </div>
        ) : (
          column.items.map(contact => (
            <ContactCard
              key={contact.id}
              contact={contact}
              color={color}
            />
          ))
        )}

        {isLoadingThisColumn && (
          <div className="contact-kanban-column__loading">
            Cargando más...
          </div>
        )}

        {!column.hasMore && column.items.length > 0 && (
          <div className="contact-kanban-column__end">
            No hay más contactos
          </div>
        )}
      </div>
    </section>
  );
}

export default function ContactKanbanPage() {
  const {
    columns,
    globalFilter,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    itemsPerColumn,
    loading,
    loadingColumnId,
    error,
    setGlobalFilter,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setItemsPerColumn,
    loadMoreColumn,
  } = useContactClassificationKanban();

  const totalContacts = useMemo(
    () => columns.reduce((acc, col) => acc + col.total, 0),
    [columns]
  );

  return (
    <div className="contact-kanban-page">
     <div className="contact-kanban-page__header">
         <section className="contact-kanban-hero">

        <div className="contact-kanban-hero__info">
          <h2>Contactos y clasificaciones</h2>

          <div className="contact-kanban-hero__date">
            <MdOutlineCalendarMonth />
            <span>Fecha: {getToday()}</span>
          </div>

          <p>
            Visualiza los contactos agrupados por clasificación.
          </p>
        </div>
      </section>

      <section className="contact-kanban-toolbar">
        <div className="contact-kanban-toolbar__search">
          <TextField
            label="Buscar contacto"
            variant="outlined"
            size="medium"
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            fullWidth
          />
        </div>
        <div className="contact-kanban-toolbar__total">
          <strong>{totalContacts}</strong>
          <span>contactos</span>
        </div>
      </section>
     </div>

      {error && (
        <div className="contact-kanban-error">
          Error: {error.message}
        </div>
      )}

      {loading ? (
        <div className="contact-kanban-loading">
          Cargando tablero...
        </div>
      ) : (
        <section className="contact-kanban-board">
          {columns.length === 0 ? (
            <div className="contact-kanban-empty">
              No hay contactos para mostrar.
            </div>
          ) : (
            columns.map((column) => (
              <KanbanColumn
                key={column.contactClassificationId}
                column={column}
                color={column.bgColor}
                loadingColumnId={loadingColumnId}
                onLoadMore={loadMoreColumn}
              />
            ))
          )}
        </section>
      )}
    </div>
  );
}