import React, { useEffect, useRef, useState} from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/Context";
import { dequeuePopup } from "@/Context/Slices/Chat/popupSlice";
import {ModalPopup,type ModalAction,} from "@/Services/Components/Hub/ModalPopup";
import { respondAssignment } from "@/Services/chat/ConversationService";
import "@/Styles/Hub/SupportRequestedPopup.css";
type SubmittingAction =
  | "accept"
  | "reject"
  | null;

interface ConversationAssignedPayload {
  conversationId: number;
  clientContactName?: string | null;
  systemDefinedCompanyName?: string | null;
  contactNumber?: string | null;
  assignedAt?: string | null;
}

export const ConversationAssignedPopup: React.FC = () => {
  const dispatch = useDispatch();

  const { queue } = useSelector(
    (state: RootState) => state.popup
  );

  const current = queue[0];

  const [comment, setComment] =
    useState<string>("");

  const [error, setError] =
    useState<string>("");

  /**
   * Identifica cuál acción se está procesando
   * para mostrar el texto correspondiente.
   */
  const [
    submittingAction,
    setSubmittingAction,
  ] = useState<SubmittingAction>(null);

  /**
   * Bloqueo síncrono para impedir dos respuestas
   * antes de que React actualice el estado visual.
   */
  const submittingRef = useRef(false);

  const isSubmitting =
    submittingAction !== null;

  /**
   * Limpia el formulario cuando cambia
   * la notificación actual de la cola.
   */
  useEffect(() => {
    setComment("");
    setError("");
    setSubmittingAction(null);
    submittingRef.current = false;
  }, [current]);

  if (
    !current ||
    current.type !== "ConversationAssigned"
  ) {
    return null;
  }

  const convo =
    current.payload as ConversationAssignedPayload;

  /**
   * Impide cerrar el popup mientras
   * se está enviando la respuesta.
   */
  const handleClose = (): void => {
    if (submittingRef.current) {
      return;
    }

    dispatch(dequeuePopup());
  };

  /**
   * Acepta o rechaza la asignación.
   *
   * submittingRef evita dobles clics inmediatos
   * y el backend protege contra respuestas repetidas.
   */
  const handleSubmit = async (
    accepted: boolean
  ): Promise<void> => {
    if (
      submittingRef.current ||
      isSubmitting
    ) {
      return;
    }

    const normalizedComment =
      comment.trim();

    if (
      !accepted &&
      normalizedComment === ""
    ) {
      setError(
        "La justificación es obligatoria al rechazar."
      );

      return;
    }

    submittingRef.current = true;

    setSubmittingAction(
      accepted ? "accept" : "reject"
    );

    setError("");

    try {
      await respondAssignment(
        convo.conversationId,
        accepted,
        normalizedComment || undefined
      );

      dispatch(dequeuePopup());
    } catch (responseError) {
      console.error(
        "Error al responder la asignación:",
        responseError
      );

      setError(
        "Error al procesar tu respuesta. Intenta nuevamente."
      );
    } finally {
      submittingRef.current = false;
      setSubmittingAction(null);
    }
  };

  const actions: ModalAction[] = [
    {
      label:
        submittingAction === "accept"
          ? "Aceptando..."
          : "Aceptar",

      onClick: () => {
        void handleSubmit(true);
      },

      variant: "primary",
      disabled: isSubmitting,
    },
    {
      label:
        submittingAction === "reject"
          ? "Rechazando..."
          : "Rechazar",

      onClick: () => {
        void handleSubmit(false);
      },

      variant: "danger",
      disabled: isSubmitting,
    },
  ];

  const companyName =
    convo.systemDefinedCompanyName?.trim();

  const contactName =
    convo.clientContactName?.trim();

  return (
    <ModalPopup
      title={`Conversación asignada.${
        companyName
          ? ` Cliente ${companyName}`
          : ""
      }`}
      closeDisabled={isSubmitting}
      message={
        <>
          <p>
            Se te ha asignado la conversación de{" "}
            <strong>
              {contactName || "un contacto"}
            </strong>
            .
          </p>

          {convo.contactNumber && (
            <p>
              Contacto:{" "}
              {convo.contactNumber}
            </p>
          )}

          <div>
            <textarea
              className="modal-popup__textarea"
              placeholder="Motivo de rechazo..."
              value={comment}
              disabled={isSubmitting}
              onChange={(event) => {
                setComment(
                  event.target.value
                );

                if (
                  event.target.value.trim()
                ) {
                  setError("");
                }
              }}
            />

            {error && (
              <p className="modal-popup__error">
                {error}
              </p>
            )}
          </div>
        </>
      }
      actions={actions}
      isOpen={true}
      onClose={handleClose}
      systemDefinedCompanyName={
        contactName
      }
      timestamp={
        convo.assignedAt ?? undefined
      }
      icon="👥"
    />
  );
};