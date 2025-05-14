
import React, { useEffect, useState } from 'react';
import { getConversation } from '@/Utils/ApiConfig';
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces';
import { User, Clock, AlertCircle, SquareMousePointer } from 'lucide-react';
import '@/Styles/Chat/ContactDetail.css';

interface Props {
  conversationId?: number;
}

export const ContactDetail: React.FC<Props> = ({ conversationId }) => {
  const [conv, setConv] = useState<ConversationDto | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    
    getConversation(conversationId)
      .then(res => setConv(res.data.data))
      .catch(console.error);
  }, [conversationId]);

  if (!conv) {
    return (
      <div className="contact-detail__empty">
        <SquareMousePointer />
       <span> Selecciona una conversación para ver los detalles del contacto</span>
      </div>
    );
  }

  const formattedDate = new Date(conv.createdAt).toLocaleString();

  return (
    <div className="contact-detail">
      <div className="contact-header">
        <div className="contact-avatar">
          {conv.contactName?.charAt(0).toUpperCase() || 'U'}
        </div>
        <h3 className="contact-name">{conv.contactName || 'Usuario'}</h3>
        <p className="contact-email">{conv.contactNumber || '—'}</p>
      </div>

      <div className="contact-detail__section">
        <div className="section-header">
          <h4 className="section-title">Información principal</h4>
        </div>
        <ul className="info-list">
          <li className="info-item">
            <div className="info-icon">
              <AlertCircle size={24} />
            </div>
            <div className="info-content">
              <span className="info-label">Estado</span>
              <span className="info-value">{conv.status || 'Sin estado'}</span>
            </div>
          </li>
          <li className="info-item">
            <div className="info-icon">
              <Clock size={24} />
            </div>
            <div className="info-content">
              <span className="info-label">Creado</span>
              <span className="info-value">{formattedDate}</span>
            </div>
          </li>
          {conv.updatedAt && (
            <li className="info-item">
              <div className="info-icon">
                <Clock size={24} />
              </div>
              <div className="info-content">
                <span className="info-label">Última actualización</span>
                <span className="info-value">
                  {new Date(conv.updatedAt).toLocaleString()}
                </span>
              </div>
            </li>
          )}
          {conv.assignedAgent && (
            <li className="info-item">
              <div className="info-icon">
                <User size={24} />
              </div>
              <div className="info-content">
                <span className="info-label">Agente asignado</span>
                <span className="info-value">{conv.assignedAgentName ? conv.assignedAgentName : "---"}</span>
              </div>
            </li>
          )}
          <li className="info-item">
            <div className="info-icon">
              <Clock size={24} />
            </div>
            <div className="info-content">
              <span className="info-label">Duración</span>
              <span className="info-value">{conv.duracion}</span>
            </div>
          </li>
        </ul>
      </div>

      <div className="contact-detail__section">
        <div className="section-header">
          <h4 className="section-title">Etiquetas</h4>
          <button className="section-action">Editar</button>
        </div>
        <div className="tag-list">
          <span className="tag">chat</span>
          <span className="tag">soporte</span>
          <span className="tag">nuevo</span>
        </div>
      </div>
    </div>
  );
};