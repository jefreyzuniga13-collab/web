/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import type { ClientResponseDTO } from "@/Interfaces/Crm/ClientInterface";
import { Check, Edit, X } from "lucide-react";
import {
  FaCloud,
  FaLaptopHouse,
  FaMapMarkerAlt,
  FaRegBuilding,
  FaRegClock,
  FaSync,
  FaTag,
} from "react-icons/fa";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { GrMoreVertical } from "react-icons/gr";
import { jwtDecode } from "jwt-decode";
import ShowInformationExpanded from "@/Components/Chat/ShowInformationExpanded";
import "@/Styles/Chat/DetailPanel/DetailPanelOptionsClient.css";

interface Props {
  clientLocal: ClientResponseDTO | null;
  displayOrDash: (v?: string | number | null) => string;
  formatNiPhone: (value?: string | number | null) => string;
  formatDate: (v?: string | number | Date | null) => string;
  setClientEditOpen: (open: boolean) => void;
  setShowMore: (value: boolean) => void;
}

interface JwtPayload {
  role: string;
}

interface AuthStorage {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  userId: number;
}

const DetailPanelOptionsClient: React.FC<Props> = ({
  clientLocal,
  displayOrDash,
  formatDate,
  setClientEditOpen,
  setShowMore,
}) => {
  const [isshowInformationExpanded, setIsshowInformationExpanded] =
    useState<boolean>(false);
  const [content, setContent] = useState<string | null | undefined>("");
  const [title, setTitle] = useState<string>("");

  const authRaw = localStorage.getItem("auth") || "{}";
  const { accessToken } = JSON.parse(authRaw) as AuthStorage;
  const { role } = jwtDecode<JwtPayload>(accessToken);
  const isAdmin = role.toLowerCase() === "admin";

  return (
    <>
      <div className="detailPanel-card">
        <header className="detailPanel-quick__header">
          <h5 className="detailPanel-content-header__title">
            Detalles del cliente
          </h5>

          {isAdmin && (
            <div className="detailPanel-clientHeaderActions">
              <button
                className="btn btn--secondary"
                onClick={() => setClientEditOpen(true)}
                type="button"
              >
                <Edit size={14} />
              </button>
              <button
                className="btn btn--primary"
                onClick={() => setShowMore(true)}
                type="button"
              >
                <GrMoreVertical />
              </button>
            </div>
          )}
        </header>

        <div className="detailPanel-clientGrid">
          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">Nombre</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaRegBuilding className="detailPanel-icon" />
              {displayOrDash(clientLocal?.name)}
            </span>
          </div>

          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">Dirección</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaMapMarkerAlt className="detailPanel-icon" />
              {displayOrDash(
                (clientLocal as any)?.direccion ??
                  (clientLocal as any)?.address
              )}
            </span>
          </div>

          <div
            className="detailPanel-contactGroup detailPanel-contactGroup__expanded"
            onClick={() => {
              setContent(clientLocal?.workModel);
              setTitle("Modelo de trabajo");
              setIsshowInformationExpanded(true);
            }}
          >
            <p className="detailPanel-clientGroup__title">Modelo Trabajo</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaLaptopHouse className="detailPanel-icon" />
              {displayOrDash(
                (clientLocal as any)?.workModel ??
                  (clientLocal as any)?.modeloTrabajo
              )}
            </span>
          </div>

          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">Prioridad</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaTag className="detailPanel-icon" />
              {displayOrDash((clientLocal as any)?.priority)}
            </span>
          </div>

          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">Tipo soporte</p>
            <span className="detailPanel-clientGroup__cliente">
              <IoChatboxEllipsesOutline className="detailPanel-icon" />
              {displayOrDash((clientLocal as any)?.supportType)}
            </span>
          </div>

          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">Entorno</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaCloud className="detailPanel-icon" />
              {displayOrDash((clientLocal as any)?.enviromentType)}
            </span>
          </div>

          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">
              Horas soporte por día
            </p>
            <span className="detailPanel-clientGroup__cliente">
              {clientLocal?.supportLimitTime}
            </span>
          </div>

          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">
              Horas soporte acumuladas
            </p>
            <span className="detailPanel-clientGroup__cliente">
              {clientLocal?.cumulativeTime}
            </span>
          </div>

          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">Recurrencia</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaSync className="detailPanel-icon" />
              {clientLocal?.recurrency}
            </span>
          </div>

          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">Soporte activo</p>
            <span
              className={`detailPanel-clientGroup__cliente detailPanel-status ${
                (clientLocal as any)?.isSupportActive
                  ? "status-true"
                  : "status-false"
              }`}
            >
              {(clientLocal as any)?.isSupportActive ? (
                <>
                  <Check
                    size={14}
                    className="detailPanel-statusIcon detailPanel-statusIcon--true"
                  />
                  Sí
                </>
              ) : (
                <>
                  <X
                    size={14}
                    className="detailPanel-statusIcon detailPanel-statusIcon--false"
                  />
                  No
                </>
              )}
            </span>
          </div>

          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">Franquicia</p>
            <span
              className={`detailPanel-clientGroup__cliente detailPanel-status ${
                (clientLocal as any)?.isFranchise
                  ? "status-true"
                  : "status-false"
              }`}
            >
              {(clientLocal as any)?.isFranchise ? (
                <>
                  <Check
                    size={14}
                    className="detailPanel-statusIcon detailPanel-statusIcon--true"
                  />
                  Sí
                </>
              ) : (
                <>
                  <X
                    size={14}
                    className="detailPanel-statusIcon detailPanel-statusIcon--false"
                  />
                  No
                </>
              )}
            </span>
          </div>

          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">Último contacto</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaRegClock className="detailPanel-icon" />
              {formatDate((clientLocal as any)?.lastContactDate)}
            </span>
          </div>
        </div>
      </div>

      {isshowInformationExpanded && (
        <ShowInformationExpanded
          title={title}
          content={content}
          setIsshowInformationExpanded={setIsshowInformationExpanded}
        />
      )}
    </>
  );
};

export default DetailPanelOptionsClient;