import {
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import type { NotificationEvent } from "@/Hooks/Hub/useNotificationsHub";

interface PopupState {
  /** Cola de eventos pendientes de mostrar. */
  queue: NotificationEvent[];
}

const initialState: PopupState = {
  queue: [],
};

/**
 * Genera una clave única por tipo de evento
 * y conversación o contacto relacionado.
 */
const getEventKey = (
  event: NotificationEvent
): string => {
  if (event.type === "newContactValidation") {
    return `${event.type}:${Number(event.payload.id ?? 0)}`;
  }

  return `${event.type}:${Number(
    event.payload.conversationId ?? 0
  )}`;
};

const popupSlice = createSlice({
  name: "popup",
  initialState,

  reducers: {
    /**
     * Añade el evento solamente si no existe
     * otro igual dentro de la cola.
     */
    enqueuePopup(
      state,
      action: PayloadAction<NotificationEvent>
    ) {
      const incomingEvent = action.payload;
      const incomingKey = getEventKey(incomingEvent);

      const alreadyQueued = state.queue.some(
        (queuedEvent) =>
          getEventKey(queuedEvent) === incomingKey
      );

      if (alreadyQueued) {
        console.warn(
          "[popupSlice] Evento duplicado ignorado:",
          incomingKey
        );

        return;
      }

      state.queue.push(incomingEvent);
    },

    /** Elimina el evento que se acaba de mostrar. */
    dequeuePopup(state) {
      state.queue.shift();
    },

    /** Limpia completamente la cola de popups. */
    clearPopupQueue(state) {
      state.queue = [];
    },
  },
});

export const {
  enqueuePopup,
  dequeuePopup,
  clearPopupQueue,
} = popupSlice.actions;

export default popupSlice.reducer;