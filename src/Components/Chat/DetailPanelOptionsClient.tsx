/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import type { ClientResponseDTO } from "@/Interfaces/Crm/ClientInterface";
import { Check, Edit, X } from "lucide-react";
import {
  FaCloud,
  FaLaptopHouse,
  FaRegBuilding,
  FaRegClock,
  FaSync,
  FaTag,
  // FaBuilding,
  FaExclamationTriangle,
  FaFlag,
  FaMapMarkerAlt,
  FaHome,
  FaCalendarAlt,
  FaEnvelope,
  FaIdCard,
  FaUserTie,
  FaServer
} from "react-icons/fa";

import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { GrMoreVertical } from "react-icons/gr";
import ShowInformationExpanded from "@/Components/Chat/ShowInformationExpanded";
import "@/Styles/Chat/DetailPanel/DetailPanelOptionsClient.css";

interface Props {
  clientLocal: ClientResponseDTO | null;
  displayOrDash: (v?: string | number | null) => string;
  formatNiPhone: (value?: string | number | null) => string;
  formatDate: (v?: string | number | Date | null) => string;
  setClientEditOpen: (open: boolean) => void;
  setShowMore: (value: boolean) => void;
  isAdmin?: boolean
}

const DetailPanelOptionsClient: React.FC<Props> = ({
  clientLocal,
  displayOrDash,
  formatDate,
  setClientEditOpen,
  setShowMore,
  isAdmin
}) => {
  const [isshowInformationExpanded, setIsshowInformationExpanded] =
    useState<boolean>(false);
  const [content, setContent] = useState<string | null | undefined>("");
  const [title, setTitle] = useState<string>("");


  return (
    <>
      <div className="detailPanel-card">
        <header className="detailPanel-quick__header">
          <h5 className="detailPanel-content-header__title">
            Detalles del cliente
          </h5>

          
            <div className="detailPanel-clientHeaderActions">

              {isAdmin && (
              <button
                className="btn btn--secondary"
                onClick={() => setClientEditOpen(true)}
                type="button"
              >
                <Edit size={14} />
              </button>
              )}
              <button
                className="btn btn--primary"
                onClick={() => setShowMore(true)}
                type="button"
              >
                <GrMoreVertical />
              </button>
            </div>
          
        </header>

{/* PCG START*/}
          {/* <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">Razón social</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaBuilding className="detailPanel-icon" />
              {displayOrDash(clientLocal?.registeredName)}
            </span>
          </div> */}


        <div className="detailPanel-clientGrid">
          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">Nombre</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaRegBuilding className="detailPanel-icon" />
              {displayOrDash(clientLocal?.name)}
            </span>
          </div>
          
          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">Origen</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaServer className="detailPanel-icon" />
              {displayOrDash(clientLocal?.legacySourceSystem)}
            </span>
          </div>

          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">País de origen</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaFlag className="detailPanel-icon" />
              {displayOrDash(clientLocal?.homeCountry)}
            </span>
          </div>


          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">Email representante</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaUserTie className="detailPanel-icon" />
              {displayOrDash(clientLocal?.representativeEmail)}
            </span>
          </div>
          
          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">Email</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaEnvelope className="detailPanel-icon" />
              {displayOrDash(clientLocal?.email)}
            </span>
          </div>

          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">Dirección</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaHome className="detailPanel-icon" />
              {displayOrDash(clientLocal?.address)}
            </span>
          </div>

          <div className="detailPanel-contactGroup detailPanel-contactGroup__expanded"
          onClick={() => {
              setContent(clientLocal?.location);
              setTitle("Ubicación");
              setIsshowInformationExpanded(true);
            }}
            >
            <p className="detailPanel-clientGroup__title">Ubicación</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaMapMarkerAlt className="detailPanel-icon" />
              {displayOrDash(clientLocal?.location)}
            </span>
          </div>

          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">Fecha ingreso</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaCalendarAlt className="detailPanel-icon" />
              {displayOrDash(clientLocal?.activity?.toLocaleLowerCase())}
            </span>
          </div>

          {/* <div
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
                (clientLocal as any)?.workModel
              )}
            </span>
          </div> */}

          <div className="detailPanel-contactGroup detailPanel-contactGroup__expanded"
           onClick={() => {
              setContent(clientLocal?.ambiguity);
              setTitle("Observación");
              setIsshowInformationExpanded(true);
            }}>
            <p className="detailPanel-clientGroup__title">Observación</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaExclamationTriangle className="detailPanel-icon" />
              {clientLocal?.ambiguity}
            </span>
          </div>

          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">Identificación</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaIdCard className="detailPanel-icon" />
              {displayOrDash(clientLocal?.identificationTypeCode)}
            </span>
          </div>



            
          {/* PCG END */}

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