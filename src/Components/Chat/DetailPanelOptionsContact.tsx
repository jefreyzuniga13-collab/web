/* eslint-disable @typescript-eslint/no-explicit-any */
import ShowInformationExpanded from '@/Components/Chat/ShowInformationExpanded';
import type { ContactLogInterface } from '@/Interfaces/Auth/ContactInterface';
import { Check, X } from 'lucide-react'
import React, { useState } from 'react'
import { FaCalendarAlt, FaPhone, FaRegClock, 
  FaUserAlt, FaUserCheck, FaWhatsapp } from 'react-icons/fa'

interface Props
{
  selectedData: ContactLogInterface | null;
  displayOrDash: (v?: string | number | null) => string;
  formatNiPhone: (value?: string | number | null) => string;
  formatDate: (v?: string | number | Date | null) => string;
}

const DetailPanelOptionsContact: React.FC<Props> = ({
  selectedData, displayOrDash, formatNiPhone, formatDate
}) => {
  const [isshowInformationExpanded, setIsshowInformationExpanded] = useState<boolean>(false)
  const [content, setContent] = useState<string | null | undefined>("");
  const [title, setTitle] = useState<string>("")
    
  const Trunc = ({ children }: { children?: React.ReactNode }) => (
      <span
        title={children ? String(children) : '---'}
        style={{
          maxWidth: '100%',
          display: 'inline-block',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          verticalAlign: 'bottom',
        }}
      >
        {displayOrDash(children as any)}
      </span>
    )

  return (
    <section>
       <header className="detailPanel-content-header">
        <h5 className='detailPanel-content-header__title'>Detalles del contacto</h5>
      </header>

      <div
        className="detailPanel-card"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          <div className="detailPanel-contactGroup"
                      // Onclick, funcional, Pero se deve de aplicar a todas las filas
            onClick={()=>{
              setContent(selectedData?.fullName)
              setTitle("Nombre completo")
              setIsshowInformationExpanded(true)
              }}>
            <p className="detailPanel-clientGroup__title">Nombre</p>
            <p className="detailPanel-clientGroup__cliente"
                >
              <FaUserAlt style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {displayOrDash(selectedData?.fullName)}
            </p>
          </div>

          <div className="detailPanel-contactGroup"
          onClick={()=>{
              setContent(formatNiPhone(selectedData?.phone))
              setTitle("Telefono")
              setIsshowInformationExpanded(true)
              }}>
            <p className="detailPanel-clientGroup__title">Teléfono</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaPhone style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {formatNiPhone(selectedData?.phone)}
            </span>
          </div>

          <div className="detailPanel-contactGroup"
          onClick={()=>{
              setContent(selectedData?.waName)
              setTitle("WhatsApp Nickname")
              setIsshowInformationExpanded(true)
              }}>
            <p className="detailPanel-clientGroup__title">WhatsApp</p>
            <span className="detailPanel-clientGroup__cliente" title={displayOrDash(selectedData?.waName)}>
              <FaWhatsapp style={{ verticalAlign: 'middle', marginRight: 6 }} />
              <Trunc>{selectedData?.waName}</Trunc>
            </span>
          </div>

          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">Verificado</p>
            <span
              className={`detailPanel-clientGroup__cliente ${(selectedData as any)?.isVerified ? 'status-true' : 'status-false'
                }`}
            >
              {(selectedData as any)?.isVerified ? (
                <>
                  <Check size={14} style={{ verticalAlign: 'middle', marginRight: 6, backgroundColor: "#2bc04bff", color: "#fff" }} />
                  Verificado
                </>
              ) : (
                <>
                  <X size={14} style={{ verticalAlign: 'middle', marginRight: 6, backgroundColor: "#c02b2bff", color: "#fff" }} />
                  No Verificado
                </>
              )}
            </span>
          </div>

          <div className="detailPanel-contactGroup">
            <p className="detailPanel-clientGroup__title">Activo</p>
            <span
              className={`detailPanel-clientGroup__cliente ${(selectedData as any)?.isActive ? 'status-true' : 'status-false'
                }`}
            >
              {(selectedData as any)?.isActive ? (
                <>
                  <Check size={14} style={{ verticalAlign: 'middle', marginRight: 6, backgroundColor: "#2bc04bff", color: "#fff" }} />
                  Activo
                </>
              ) : (
                <>
                  <X size={14} style={{ verticalAlign: 'middle', backgroundColor: "#c02b2bff", color: "#fff", marginRight: 6 }} />
                  No Activo
                </>
              )}
            </span>
          </div>

          <div className="detailPanel-contactGroup"
          onClick={()=>{
              setContent(selectedData?.verifiedBy?.fullName)
              setTitle("Verificado por")
              setIsshowInformationExpanded(true)
              }}>
            <p className="detailPanel-clientGroup__title">Verificado por</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaUserCheck style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {displayOrDash((selectedData as any)?.verifiedBy?.fullName)}
            </span>
          </div>

          <div className="detailPanel-contactGroup"
          onClick={()=>{
              if(selectedData?.createdAt ){
                  setContent(formatDate(selectedData.verifiedAt))
                  setTitle("Fecha Creado")
                  setIsshowInformationExpanded(true)
                }
              }}>
            <p className="detailPanel-clientGroup__title">Creado</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaRegClock style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {formatDate((selectedData as any)?.createdAt)}
            </span>
          </div>

          <div className="detailPanel-contactGroup"
            onClick={()=>{
              if(selectedData?.updatedAt ){
                  setContent(formatDate(selectedData.updatedAt))
                  setTitle("Fecha Actualizado")
                  setIsshowInformationExpanded(true)
                }
              }}>
            <p className="detailPanel-clientGroup__title">Actualizado</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaRegClock style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {formatDate((selectedData as any)?.updatedAt)}
            </span>
          </div>

          <div className="detailPanel-contactGroup"
          onClick={()=>{
            if(selectedData?.verifiedAt ){
                  setContent(formatDate(selectedData.verifiedAt))
                  setTitle("Fecha verificado")
                  setIsshowInformationExpanded(true)
                }}} 
              >

            <p className="detailPanel-clientGroup__title">VerifiedAt</p>
            <span className="detailPanel-clientGroup__cliente">
              <FaCalendarAlt style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {formatDate((selectedData as any)?.verifiedAt)}
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
    </section>
  )
}

export default DetailPanelOptionsContact;