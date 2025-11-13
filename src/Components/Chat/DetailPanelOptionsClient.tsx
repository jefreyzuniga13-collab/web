/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ClientResponseDTO } from '@/Interfaces/Crm/ClientInterface'
import { Check, Edit, X } from 'lucide-react'
import React, { useState } from 'react'
import { FaCloud, FaLaptopHouse, FaMapMarkerAlt, FaRegBuilding, FaRegClock, FaSync, FaTag } from 'react-icons/fa'
import { IoChatboxEllipsesOutline } from 'react-icons/io5'
import ShowInformationExpanded from './ShowInformationExpanded'
import { jwtDecode } from 'jwt-decode'

interface Props {
    clientLocal: ClientResponseDTO | null
    displayOrDash: (v?: string | number | null) => string;
    formatNiPhone: (value?: string | number | null) => string;
    formatDate: (v?: string | number | Date | null) => string;
    setClientEditOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setShowMore: React.Dispatch<React.SetStateAction<boolean>>;
}

interface JwtPayload {
  role: string
}

interface AuthStorage {
  accessToken: string
  refreshToken: string
  expiresAt: string
  userId: number
}

const DetailPanelOptionsClient: React.FC<Props> = ({
    clientLocal,
    displayOrDash,
    formatDate,
    setClientEditOpen,
    setShowMore
}) => {

    const [isshowInformationExpanded, setIsshowInformationExpanded] = useState<boolean>(false)
     const [content, setContent] = useState<string | null | undefined>("");
      const [title, setTitle] = useState<string>("")


        const authRaw = localStorage.getItem('auth') || '{}'
  const { accessToken } = JSON.parse(authRaw) as AuthStorage
  const { role } = jwtDecode<JwtPayload>(accessToken)
  const isAdmin = role.toLowerCase() === 'admin'

      
    return (
        <>
            <header
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingLeft:0,
                }}
            >
                <h5>Detalles del cliente</h5>
               {isAdmin && (

                 <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        className="btn btn--secondary"
                        onClick={() => setClientEditOpen(true)}
                    >
                        <Edit size={14} />
                    </button>
                    <button
                        className="btn btn--primary"
                        onClick={() => setShowMore(true)}
                    >
                        Ver más
                    </button>
                </div>
               )}
            </header>

            <div
                className="detailPanel-card"
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                    <div className="detailPanel-contactGroup">
                        <p className="detailPanel-clientGroup__title">Nombre</p>
                        <span className="detailPanel-clientGroup__cliente">
                            <FaRegBuilding style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            {displayOrDash(clientLocal?.name)}
                        </span>
                    </div>

                    {/* <div className="detailPanel-contactGroup">
                        <p className="detailPanel-clientGroup__title">Teléfono</p>
                        <span className="detailPanel-clientGroup__cliente">
                            <FaPhone style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            {formatNiPhone(clientLocal.) || '—'}
                        </span>
                    </div> */}

                    <div className="detailPanel-contactGroup">
                        <p className="detailPanel-clientGroup__title">Dirección</p>
                        <span className="detailPanel-clientGroup__cliente">
                            <FaMapMarkerAlt style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            {displayOrDash(
                                (clientLocal as any)?.direccion ??
                                (clientLocal as any)?.address
                            )}
                        </span>
                    </div>

                    <div className="detailPanel-contactGroup__expanded"  onClick={()=>{
                        setContent(clientLocal?.workModel)
                        setTitle("Nombre completo")
                        setIsshowInformationExpanded(true)
                        }}>
                        <p className="detailPanel-clientGroup__title">Modelo Trabajo</p>
                        <span className="detailPanel-clientGroup__cliente">
                            <FaLaptopHouse style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            {displayOrDash(
                                (clientLocal as any)?.workModel ??
                                (clientLocal as any)?.modeloTrabajo
                            )}
                        </span>
                    </div>

                    <div className="detailPanel-contactGroup">
                        <p className="detailPanel-clientGroup__title">Prioridad</p>
                        <span className="detailPanel-clientGroup__cliente">
                            <FaTag style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            {displayOrDash((clientLocal as any)?.priority)}
                        </span>
                    </div>

                    <div className="detailPanel-contactGroup">
                        <p className="detailPanel-clientGroup__title">Tipo soporte</p>
                        <span className="detailPanel-clientGroup__cliente">
                            <IoChatboxEllipsesOutline style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            {displayOrDash((clientLocal as any)?.supportType)}
                        </span>
                    </div>

                    <div className="detailPanel-contactGroup">
                        <p className="detailPanel-clientGroup__title">Entorno</p>
                        <span className="detailPanel-clientGroup__cliente">
                            <FaCloud style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            {displayOrDash((clientLocal as any)?.enviromentType)}
                        </span>
                    </div>
                            
                             <div className="detailPanel-contactGroup">
                        <p className="detailPanel-clientGroup__title">Horas soporte por dia</p>
                        <span className="detailPanel-clientGroup__cliente">
                            {clientLocal?.supportLimitTime}
                        </span>
                    </div>

                     <div className="detailPanel-contactGroup">
                        <p className="detailPanel-clientGroup__title">Hora soporte acumuladas</p>
                        <span className="detailPanel-clientGroup__cliente">
                            {clientLocal?.cumulativeTime}
                        </span>
                    </div>
                    <div className="detailPanel-contactGroup">
                        <p className="detailPanel-clientGroup__title">Recurrencia</p>
                        <span className="detailPanel-clientGroup__cliente">
                            <FaSync style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            {clientLocal?.recurrency}
                        </span>
                    </div>

                    <div className="detailPanel-contactGroup">
                        <p className="detailPanel-clientGroup__title">Soporte activo</p>
                        <span
                            className={`detailPanel-clientGroup__cliente ${(clientLocal as any)?.isSupportActive
                                ? 'status-true'
                                : 'status-false'
                                }`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                            {(clientLocal as any)?.isSupportActive ? (
                                <>
                                    <Check size={14} style={{ verticalAlign: 'middle', marginRight: 6, backgroundColor: "#2bc04bff", color: "#fff" }} /> Sí
                                </>
                            ) : (
                                <>
                                    <X size={14} style={{ verticalAlign: 'middle', marginRight: 6, backgroundColor: "#c02b2bff", color: "#fff" }} /> No
                                </>
                            )}
                        </span>
                    </div>

                    <div className="detailPanel-contactGroup">
                        <p className="detailPanel-clientGroup__title">Franquicia</p>
                        <span
                            className={`detailPanel-clientGroup__cliente ${(clientLocal as any)?.isFranchise ? 'status-true' : 'status-false'
                                }`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                            {(clientLocal as any)?.isFranchise ? (
                                <>
                                    <Check size={14} style={{ verticalAlign: 'middle', marginRight: 6, backgroundColor: "#2bc04bff", color: "#fff" }} /> Sí
                                </>
                            ) : (
                                <>
                                    <X size={14} style={{ verticalAlign: 'middle', marginRight: 6, backgroundColor: "#c02b2bff", color: "#fff" }} /> No
                                </>
                            )}
                        </span>
                    </div>

                    <div className="detailPanel-contactGroup">
                        <p className="detailPanel-clientGroup__title">Último contacto</p>
                        <span className="detailPanel-clientGroup__cliente">
                            <FaRegClock style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            {formatDate((clientLocal as any)?.lastContactDate)}
                        </span>
                    </div>

                    {/* <div className="detailPanel-contactGroup">
                        <p className="detailPanel-clientGroup__title">Último caso cerrado</p>
                        <span className="detailPanel-clientGroup__cliente">
                            <FaRegClock style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            {formatDate((clientLocal as any)?.lastClosedCase)}
                        </span>
                    </div> */}
                </div>

                {/* <div style={{ marginTop: 10 }}>
                    <p className="detailPanel-clientGroup__title">Observación</p>
                    <div
                        style={{
                            border: '1px solid #E5E7EB',
                            borderRadius: 8,
                            padding: 8,
                            minHeight: 40,
                            background: '#FAFAFA',
                        }}
                    >
                        <Trunc>{(clientLocal as any)?.observation}</Trunc>
                    </div>
                </div> */}
            </div>

{isshowInformationExpanded && (
          <ShowInformationExpanded 
              title={title}
              content={content}
              setIsshowInformationExpanded={setIsshowInformationExpanded}
            />
        )}

        </>
    )
}

export default DetailPanelOptionsClient