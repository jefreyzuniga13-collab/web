import React, { useState, useEffect, useMemo } from 'react'
import {jwtDecode} from 'jwt-decode'
import { useDispatch } from 'react-redux'
import { InboxList } from '@/Components/Chat/InboxList'
import { ChatWindow } from '@/Components/Chat/ChatWindow'
import { ContactDetail } from '@/Components/Chat/ContactDetail'
import { ConversationHistoryModal } from '@/Components/Chat/ConversationHistoryModal'
import { getConversation, closeConversation } from '@/Services/ConversationService'
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'
import { openAssignModal } from '@/Context/Slices/assignModalSlice'
import '@/Styles/Chat/SupportPage.css'
import { FaFilter } from "react-icons/fa";
import { RiChatHistoryFill } from 'react-icons/ri'
import { FaUserAlt, FaClipboard } from 'react-icons/fa'
import Button from '@/Components/Common/Button'

interface AuthStorage {
  accessToken: string
  refreshToken: string
  expiresAt: string
  userId: number
}

interface JwtPayload {
  role: string
}

// Tipo de cada opción de filtro
type FilterOption = { label: string; value: string; content: string }

const FILTER_ORDER_STORAGE_KEY = 'filterOrder'

const SupportPage: React.FC = () => {
  const dispatch = useDispatch()
  const [convId, setConvId] = useState<number | null>(null)
  const [conversation, setConversation] = useState<ConversationDto | null>(null)
  
  const [filter, setFilter] = useState<string>(
    () => localStorage.getItem("selectedFilter") || "all"
  );

  const [selectedFilter, setSelectedFilter] = useState<string>(
  () => localStorage.getItem("selectedFilter") || "all"
);
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [contactDetailToggle, setContactDetailToggle] = useState(false)
  const [orderModalVisible, setOrderModalVisible] = useState(false)

  const authRaw = localStorage.getItem('auth') || '{}'
  const { accessToken, userId } = JSON.parse(authRaw) as AuthStorage
  const { role } = jwtDecode<JwtPayload>(accessToken)
  const isAdmin = role.toLowerCase() === 'admin'
  let DEFAULT_OPTIONS: FilterOption[];

  if(isAdmin) {
    DEFAULT_OPTIONS = [
    { label: 'Todos', value: 'all', content: 'Todos' },
    { label: 'Nuevo', value: 'new', content: 'Nuevo' },
    { label: 'Bot', value: 'bot', content: 'Bot' },
    { label: 'Pendiente', value: 'waiting', content: 'Pendiente' },
    { label: 'Humano', value: 'human', content: 'Humano' },
    { label: 'Cerrado', value: 'closed', content: 'Cerrado' },
    { label: 'Incompleto', value: 'incomplete', content: 'Incompleto' }
  ]
  }else{
    DEFAULT_OPTIONS = [
    { label: 'Todos', value: 'all', content: 'Todos' },
    { label: 'Humano', value: 'human', content: 'Humano' },
    { label: 'Cerrado', value: 'closed', content: 'Cerrado' },
    { label: 'Incompleto', value: 'incomplete', content: 'Incompleto' }
  ]}
    
  // Cargar orden de filtros desde localStorage o usar el predeterminado
  const [filterOrder, setFilterOrder] = useState<string[]>(() => {
    const stored = localStorage.getItem(FILTER_ORDER_STORAGE_KEY)
    if (stored) {
      try { return JSON.parse(stored) } catch { /* ignore */ }
    }
    return DEFAULT_OPTIONS.map(o => o.value)
  })

    useEffect(() => {
      setFilter(selectedFilter);
    }, [selectedFilter]);

  // Opciones ordenadas según filterOrder
  const sortedOptions = useMemo(() => {
    return filterOrder
      .map(val => DEFAULT_OPTIONS.find(o => o.value === val))
      .filter((o): o is FilterOption => !!o)
  }, [filterOrder])

  // Control de conversión
  useEffect(() => {
    if (!convId) {
      setConversation(null)
      return
    }
    getConversation(convId)
      .then(res => setConversation(res.data.data))
      .catch(console.error)
  }, [convId])

  const handleAfterAssign = () => {
    if (!convId) return
    getConversation(convId)
      .then(res => setConversation(res.data.data))
      .catch(console.error)
  }

  const handleAssignClick = () => {
    if (!convId || !conversation) return
    if (isAdmin) {
      dispatch(openAssignModal(conversation))
    } else {
      closeConversation(convId)
        .then(handleAfterAssign)
        .catch(console.error)
    }
  }


 const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const val = e.target.value;
  setFilter(val);
  setSelectedFilter(val);
  localStorage.setItem("selectedFilter", val);
};

  // Guardar orden en localStorage
  const saveOrder = (newOrder: string[]) => {
    setFilterOrder(newOrder)
    localStorage.setItem(FILTER_ORDER_STORAGE_KEY, JSON.stringify(newOrder))
  }

  return (
    <div className="support-layout">
      <aside className="sidebar">
        <div className="inbox-header">
          <div className="inbox-title-container">
            <h3 className="inbox-title">Conversaciones</h3>
            <button
              className="sort-button"
              onClick={() => setOrderModalVisible(true)}
              title="Ordenar filtros"
            >
              <FaFilter className='sort-button-icon'/>
            </button>
          </div>

          <div className="inbox-status__container">
            {sortedOptions.map(opt => (
                <>
                <input
                  id={opt.value}
                  type="radio"
                  name="filters"
                  value={opt.value}
                  checked={filter === opt.value}
                  onChange={handleOptionChange}
                  className="inbox-status__input"
                />
              <label htmlFor={opt.value} className="inbox-status__label">
                {opt.content}
              </label>
            </>
            ))}
          </div>
        </div>

        <InboxList
          selectedId={convId ?? undefined}
          onSelect={setConvId}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          filter={filter as any}
        />
      </aside>

      <main className="main-content">
        <header className="main-header">
          <h2 className="main-title">Chat</h2>
          <div className="btn-container">
            {convId && (
              <>
                <button
                  className={`contact-detail-button ${convId ? 'active' : 'disabled'}`}
                  onClick={() => setShowHistoryModal(true)}
                  disabled={!convId}
                >
                  <RiChatHistoryFill size={16} /> Historial
                </button>
                <button
                  className={`contact-detail-button ${convId ? 'active' : 'disabled'}`}
                  onClick={() => setContactDetailToggle(t => !t)}
                  disabled={!convId}
                >
                  <FaClipboard size={16} /> Detalles
                </button>
              </>
            )}
            <button
              className={`assign-button ${isAdmin ? '' : 'button-cerrar'}`}
              disabled={!convId}
              onClick={handleAssignClick}
            >
              <FaUserAlt size={16} /> {isAdmin ? 'Asignar' : 'Cerrar'}
            </button>
          </div>
        </header>

        <ChatWindow conversationId={convId ?? undefined} userId={userId} />
      </main>

      {contactDetailToggle && (
        <div className="modal-overlay">
          <aside className="info-sidebar">
            <ContactDetail
              conversationId={convId ?? undefined}
              contactDetailToggle={contactDetailToggle}
              setContactDetailToggle={setContactDetailToggle}
            />
          </aside>
        </div>
      )}

      <ConversationHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        conversationId={convId || 0}
      />

      {orderModalVisible && (
        <FilterOrderModal
          currentOrder={filterOrder}
          options={DEFAULT_OPTIONS}
          onSave={newOrder => {
            saveOrder(newOrder)
            setOrderModalVisible(false)
          }}
          onClose={() => setOrderModalVisible(false)}
        />
      )}
    </div>
  )
}

interface FilterOrderModalProps {
  currentOrder: string[]
  options: FilterOption[]
  onSave: (newOrder: string[]) => void
  onClose: () => void
}

const FilterOrderModal: React.FC<FilterOrderModalProps> = ({ currentOrder, options, onSave, onClose }) => {
  const [order, setOrder] = useState<string[]>(currentOrder)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const handleDragStart = (idx: number) => {
    setDragIndex(idx)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (idx: number) => {
    if (dragIndex === null) return
    const newOrder = [...order]
    const [moved] = newOrder.splice(dragIndex, 1)
    newOrder.splice(idx, 0, moved)
    setOrder(newOrder)
    setDragIndex(null)
  }

  return (
    <div className="modal-overlay">
      <div className="order-modal">
        <h3 className='order-modal-title'>Ordenar filtros</h3>
        <ul className="order-list">
          {order.map((val, idx) => {
            const opt = options.find(o => o.value === val)
            if (!opt) return null
            return (
              <li
                key={val}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                className="order-item"
              >
                ☰ {opt.content}
              </li>
            )
          })}

        </ul>
        <div className="order-modal-actions">
          <Button variant='secondary' onClick={onClose}>Cancelar</Button>
          <Button variant='primary' onClick={() => onSave(order)}>Guardar</Button>
        </div>
      </div>
    </div>
  )
}

export default SupportPage