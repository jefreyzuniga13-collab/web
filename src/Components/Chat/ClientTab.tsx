/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'
import DetailPanelOptionsClient from '@/Components/Chat/DetailPanelOptionsClient'
import useClientTab from '@/Hooks/Chat/useClientTab'
import "@/Styles/Chat/ClientTab.css"

type Props = {
  clienteCodigo?: string | number | null
  displayOrDash: (v?: string | number | null) => string
  formatDate: (v?: string | number | Date | null) => string
}

type MoreTab = 'cred' | 'dev' | 'sys' | 'ctc'

const ClientTab: React.FC<Props> = ({
  clienteCodigo,
  displayOrDash,
  formatDate,
}) => {
  const [showMore, setShowMore] = useState(false)
  const [moreTab, setMoreTab] = useState<MoreTab>('cred')

  const {
      error,
    loading,
      // client,
    // hostingCreds,
    // devs,
    // systems,
    // contacts,
    credSearch,
    setCredSearch,
    devSearch,
    setDevSearch,
    sysSearch,
    setSysSearch,
    ctcSearch,
    setCtcSearch,
    filteredHosting,
    filteredDevs,
    filteredSystems,
    filteredContacts,
    expandedDev,
    toggleExpandedDev,
    addHostingOpen,
    setAddHostingOpen,
    newHosting,
    setNewHosting,
    addHosting,
    addDeviceOpen,
    setAddDeviceOpen,
    newDevice,
    setNewDevice,
    createDevice,
    addDevOpenId,
    setAddDevOpenId,
    newDevCred,
    setNewDevCred,
    addDeviceCredential,
    addSysOpenId,
    setAddSysOpenId,
    newSysCred,
    setNewSysCred,
    addSystemCredential,
    pickSysOpen,
    setPickSysOpen,
    newSystem,
    setNewSystem,
    addPickedSystem,
    pickCtcOpen,
    setPickCtcOpen,
    newContact,
    setNewContact,
    addPickedContact,
    clientEditOpen,
    setClientEditOpen,
    clientLocal,
    // setClientLocal,
    workModel,
    setWorkModel,
    priority,
    setPriority,
    supportType,
    setSupportType,
    envType,
    setEnvType,
    isSupportActive,
    setIsSupportActive,
    isFranchise,
    setIsFranchise,
    supportLimitTime,
    setSupportLimitTime,
    recurrency,
    setRecurrency,
    observation,
    setObservation,
    saveClientEdits,
    clientPickerOpen,
    setClientPickerOpen,
    clientPickerFilter,
    setClientPickerFilter,
    clientPickerPage,
    setClientPickerPage,
    // clientPickerSize,
    // setClientPickerSize,
    clientPickerData,
    loadClientPicker,
    pickClientAndLoad,
    sysCatalog,
    sysPage,
    sysPageSize,
    sysTotal,
    fetchSysPage,
    setSysPage,
    // setSysPageSize,
    sysGlobalFilter,
    setSysGlobalFilter,
    contactPickerItems,
    openContactPicker,
    openSystemPicker,
  } = useClientTab(clienteCodigo ?? null)

  if (loading && !clientLocal) {
    return (
      <div className="detailPanel-loaderContainer">
        <div className="detailPanel-loader">Cargando cliente…</div>
      </div>
    )
  }

  if (error) {
    return <div className="detailPanel-error">Error al cargar cliente</div>
  }

  if (!clientLocal) {
    return (
      <div className="detailPanel-card">
        <p>No se encontró información del cliente.</p>
      </div>
    )
  }

  const renderCredenciales = () => (
    <div className="dp-section">
      <div className="dp-section__header">
        <h4>Credenciales de hosting</h4>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => setAddHostingOpen(true)}
        >
          Agregar credencial
        </button>
      </div>
      <div className="dp-section__filters">
        <input
          className="input"
          placeholder="Buscar credenciales…"
          value={credSearch}
          onChange={e => setCredSearch(e.target.value)}
        />
      </div>
      <div className="dp-list">
        {filteredHosting.length === 0 && (
          <p className="dp-list__empty">Sin credenciales registradas.</p>
        )}
        {filteredHosting.map((c: any) => (
          <div key={c.id} className="dp-card">
            <div className="dp-card__row">
              <span className="dp-card__label">Catálogo</span>
              <span className="dp-card__value">{displayOrDash(c.catCredencialNames)}</span>
            </div>
            <div className="dp-card__row">
              <span className="dp-card__label">Usuario</span>
              <span className="dp-card__value">{displayOrDash(c.user)}</span>
            </div>
            <div className="dp-card__row">
              <span className="dp-card__label">Instancia</span>
              <span className="dp-card__value">{displayOrDash(c.instance)}</span>
            </div>
            <div className="dp-card__row">
              <span className="dp-card__label">Puerto</span>
              <span className="dp-card__value">{displayOrDash(c.port)}</span>
            </div>
            <div className="dp-card__row">
              <span className="dp-card__label">Observación</span>
              <span className="dp-card__value">{displayOrDash(c.observation)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderDispositivos = () => (
    <div className="dp-section">
      <div className="dp-section__header">
        <h4>Equipos</h4>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => setAddDeviceOpen(true)}
        >
          Agregar equipo
        </button>
      </div>
      <div className="dp-section__filters">
        <input
          className="input"
          placeholder="Buscar equipos…"
          value={devSearch}
          onChange={e => setDevSearch(e.target.value)}
        />
      </div>
      <div className="dp-list">
        {filteredDevs.length === 0 && (
          <p className="dp-list__empty">Sin equipos registrados.</p>
        )}
        {filteredDevs.map((d: any) => (
          <div key={d.id} className="dp-accordion">
            <button
              type="button"
              className="dp-accordion__header"
              onClick={() => toggleExpandedDev(d.id)}
            >
              <span className="dp-accordion__title">{displayOrDash(d.name)}</span>
              <div className="dp-accordion__meta">
                <span className="chip">
                  <span className="chip-text">{displayOrDash(d.ip)}</span>
                </span>
                <span className="dp-accordion__count">
                  {(d.credentials ?? []).length}
                </span>
              </div>
            </button>
            {expandedDev === d.id && (
              <div className="dp-accordion__body">
                <div className="dp-card dp-card--sub">
                  <div className="dp-card__row">
                    <span className="dp-card__label">SO</span>
                    <span className="dp-card__value">{displayOrDash(d.operatingSystem)}</span>
                  </div>
                  <div className="dp-card__row">
                    <span className="dp-card__label">Versión</span>
                    <span className="dp-card__value">{displayOrDash(d.versionSO)}</span>
                  </div>
                  <div className="dp-card__row">
                    <span className="dp-card__label">Descripción</span>
                    <span className="dp-card__value">{displayOrDash(d.description)}</span>
                  </div>
                </div>

                <div className="dp-subsection">
                  <div className="dp-subsection__header">
                    <h5>Credenciales del equipo</h5>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => setAddDevOpenId(d.id)}
                    >
                      Agregar credencial
                    </button>
                  </div>
                  <div className="dp-list dp-list--compact">
                    {(d.credentials ?? []).length === 0 && (
                      <p className="dp-list__empty">Sin credenciales.</p>
                    )}
                    {(d.credentials ?? []).map((c: any) => (
                      <div key={c.id} className="dp-card dp-card--small">
                        <div className="dp-card__row">
                          <span className="dp-card__label">Catálogo</span>
                          <span className="dp-card__value">{displayOrDash(c.catCredencialNames)}</span>
                        </div>
                        <div className="dp-card__row">
                          <span className="dp-card__label">Usuario</span>
                          <span className="dp-card__value">{displayOrDash(c.user)}</span>
                        </div>
                        <div className="dp-card__row">
                          <span className="dp-card__label">Instancia</span>
                          <span className="dp-card__value">{displayOrDash(c.instance)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {addDevOpenId === d.id && (
                    <div className="dp-inlineForm">
                      <div className="dp-inlineForm__grid">
                        <input
                          className="input"
                          placeholder="Usuario"
                          value={newDevCred.user ?? ''}
                          onChange={e =>
                            setNewDevCred(prev => ({ ...prev, user: e.target.value }))
                          }
                        />
                        <input
                          className="input"
                          placeholder="Contraseña"
                          value={newDevCred.password ?? ''}
                          onChange={e =>
                            setNewDevCred(prev => ({ ...prev, password: e.target.value }))
                          }
                        />
                        <input
                          className="input"
                          placeholder="Instancia"
                          value={newDevCred.instance ?? ''}
                          onChange={e =>
                            setNewDevCred(prev => ({ ...prev, instance: e.target.value }))
                          }
                        />
                        <input
                          className="input"
                          placeholder="Puerto"
                          value={newDevCred.port ?? ''}
                          onChange={e =>
                            setNewDevCred(prev => ({ ...prev, port: e.target.value }))
                          }
                        />
                        <input
                          className="input"
                          placeholder="Observación"
                          value={newDevCred.observation ?? ''}
                          onChange={e =>
                            setNewDevCred(prev => ({ ...prev, observation: e.target.value }))
                          }
                        />
                      </div>
                      <div className="dp-inlineForm__actions">
                        <button
                          type="button"
                          className="btn btn--primary"
                          onClick={() => addDeviceCredential(d.id)}
                          disabled={!newDevCred.user}
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          className="btn btn--secondary"
                          onClick={() => {
                            setAddDevOpenId(null)
                            setNewDevCred({
                              user: '',
                              password: '',
                              instance: '',
                              port: '',
                              observation: '',
                              isActive: true,
                            })
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const renderSistemas = () => (
    <div className="dp-section">
      <div className="dp-section__header">
        <h4>Sistemas</h4>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={openSystemPicker}
        >
          Agregar sistema
        </button>
      </div>
      <div className="dp-section__filters">
        <input
          className="input"
          placeholder="Buscar sistemas…"
          value={sysSearch}
          onChange={e => setSysSearch(e.target.value)}
        />
      </div>
      <div className="dp-list">
        {filteredSystems.length === 0 && (
          <p className="dp-list__empty">Sin sistemas registrados.</p>
        )}
        {filteredSystems.map((s: any) => (
          <div key={s.id} className="dp-accordion">
            <button type="button" className="dp-accordion__header">
              <span className="dp-accordion__title">{displayOrDash(s.name)}</span>
              <div className="dp-accordion__meta">
                <span className="chip">
                  <span className="chip-text">{displayOrDash(s.version)}</span>
                </span>
                <span className="dp-accordion__count">
                  {(s.credentials ?? []).length}
                </span>
              </div>
            </button>
            <div className="dp-accordion__body">
              <div className="dp-card dp-card--sub">
                <div className="dp-card__row">
                  <span className="dp-card__label">Descripción</span>
                  <span className="dp-card__value">{displayOrDash(s.description)}</span>
                </div>
              </div>

              <div className="dp-subsection">
                <div className="dp-subsection__header">
                  <h5>Credenciales del sistema</h5>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setAddSysOpenId(s.id)}
                  >
                    Agregar credencial
                  </button>
                </div>
                <div className="dp-list dp-list--compact">
                  {(s.credentials ?? []).length === 0 && (
                    <p className="dp-list__empty">Sin credenciales.</p>
                  )}
                  {(s.credentials ?? []).map((c: any) => (
                    <div key={c.id} className="dp-card dp-card--small">
                      <div className="dp-card__row">
                        <span className="dp-card__label">Catálogo</span>
                        <span className="dp-card__value">{displayOrDash(c.catCredencialNames)}</span>
                      </div>
                      <div className="dp-card__row">
                        <span className="dp-card__label">Usuario</span>
                        <span className="dp-card__value">{displayOrDash(c.user)}</span>
                      </div>
                      <div className="dp-card__row">
                        <span className="dp-card__label">Instancia</span>
                        <span className="dp-card__value">{displayOrDash(c.instance)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {addSysOpenId === s.id && (
                  <div className="dp-inlineForm">
                    <div className="dp-inlineForm__grid">
                      <input
                        className="input"
                        placeholder="Usuario"
                        value={newSysCred.user ?? ''}
                        onChange={e =>
                          setNewSysCred(prev => ({ ...prev, user: e.target.value }))
                        }
                      />
                      <input
                        className="input"
                        placeholder="Contraseña"
                        value={newSysCred.password ?? ''}
                        onChange={e =>
                          setNewSysCred(prev => ({ ...prev, password: e.target.value }))
                        }
                      />
                      <input
                        className="input"
                        placeholder="Instancia"
                        value={newSysCred.instance ?? ''}
                        onChange={e =>
                          setNewSysCred(prev => ({ ...prev, instance: e.target.value }))
                        }
                      />
                      <input
                        className="input"
                        placeholder="Puerto"
                        value={newSysCred.port ?? ''}
                        onChange={e =>
                          setNewSysCred(prev => ({ ...prev, port: e.target.value }))
                        }
                      />
                      <input
                        className="input"
                        placeholder="Observación"
                        value={newSysCred.observation ?? ''}
                        onChange={e =>
                          setNewSysCred(prev => ({ ...prev, observation: e.target.value }))
                        }
                      />
                    </div>
                    <div className="dp-inlineForm__actions">
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => addSystemCredential(s.id)}
                        disabled={!newSysCred.user}
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => {
                          setAddSysOpenId(null)
                          setNewSysCred({
                            user: '',
                            password: '',
                            instance: '',
                            port: '',
                            observation: '',
                            isActive: true,
                          })
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderContactos = () => (
    <div className="dp-section">
      <div className="dp-section__header">
        <h4>Contactos</h4>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={openContactPicker}
        >
          Vincular contacto
        </button>
      </div>
      <div className="dp-section__filters">
        <input
          className="input"
          placeholder="Buscar contactos…"
          value={ctcSearch}
          onChange={e => setCtcSearch(e.target.value)}
        />
      </div>
      <div className="dp-list">
        {filteredContacts.length === 0 && (
          <p className="dp-list__empty">Sin contactos vinculados.</p>
        )}
        {filteredContacts.map((c: any) => (
          <div key={c.id} className="dp-card">
            <div className="dp-card__row">
              <span className="dp-card__label">Nombre</span>
              <span className="dp-card__value">{displayOrDash(c.fullName ?? c.name)}</span>
            </div>
            <div className="dp-card__row">
              <span className="dp-card__label">Teléfono</span>
              <span className="dp-card__value">{displayOrDash(c.phone)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <>
      <DetailPanelOptionsClient
        clientLocal={clientLocal}
        displayOrDash={displayOrDash}
        formatDate={formatDate}
        setClientEditOpen={setClientEditOpen}
        setShowMore={setShowMore}
        formatNiPhone={formatDate}
      />

      {showMore && (
        <div className="dp-modal">
          <div
            className="dp-modal__backdrop"
            onClick={() => setShowMore(false)}
          />
          <div className="dp-modal__content">
            <header className="dp-modal__header">
              <h3>Información del cliente</h3>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setShowMore(false)}
              >
                Cerrar
              </button>
            </header>
            <div className="dp-modal__tabs">
              <button
                type="button"
                className={`btn-tab ${moreTab === 'cred' ? 'is-active' : ''}`}
                onClick={() => setMoreTab('cred')}
              >
                Credenciales
              </button>
              <button
                type="button"
                className={`btn-tab ${moreTab === 'dev' ? 'is-active' : ''}`}
                onClick={() => setMoreTab('dev')}
              >
                Equipos
              </button>
              <button
                type="button"
                className={`btn-tab ${moreTab === 'sys' ? 'is-active' : ''}`}
                onClick={() => setMoreTab('sys')}
              >
                Sistemas
              </button>
              <button
                type="button"
                className={`btn-tab ${moreTab === 'ctc' ? 'is-active' : ''}`}
                onClick={() => setMoreTab('ctc')}
              >
                Contactos
              </button>
            </div>
            <div className="dp-modal__body">
              {moreTab === 'cred' && renderCredenciales()}
              {moreTab === 'dev' && renderDispositivos()}
              {moreTab === 'sys' && renderSistemas()}
              {moreTab === 'ctc' && renderContactos()}
            </div>
          </div>
        </div>
      )}

      {clientEditOpen && (
        <div className="dp-modal">
          <div
            className="dp-modal__backdrop"
            onClick={() => setClientEditOpen(false)}
          />
          <div className="dp-modal__content dp-modal__content--narrow">
            <header className="dp-modal__header">
              <h3>Editar cliente</h3>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setClientEditOpen(false)}
              >
                Cerrar
              </button>
            </header>
            <div className="dp-modal__body">
              <div className="dp-form">
                {/* <label className="dp-field">
                  <span className="dp-field__label">Nombre</span>
                  <input
                    className="input"
                    value={clientLocal?.name ?? ''}
                    onChange={e =>
                      setClientLocal((prev: any) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </label> */}
                <label className="dp-field">
                  <span className="dp-field__label">Modelo de trabajo</span>
                  <input
                    className="input"
                    value={workModel}
                    onChange={e => setWorkModel(e.target.value)}
                  />
                </label>
                <label className="dp-field">
                  <span className="dp-field__label">Prioridad</span>
                  <input
                    className="input"
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                  />
                </label>
                <label className="dp-field">
                  <span className="dp-field__label">Tipo de soporte</span>
                  <input
                    className="input"
                    value={supportType}
                    onChange={e => setSupportType(e.target.value)}
                  />
                </label>
                <label className="dp-field">
                  <span className="dp-field__label">Entorno</span>
                  <input
                    className="input"
                    value={envType}
                    onChange={e => setEnvType(e.target.value)}
                  />
                </label>
                <label className="dp-field">
                  <span className="dp-field__label">Tiempo límite de soporte (minutos)</span>
                  <input
                    className="input"
                    type="number"
                    value={supportLimitTime ?? ''}
                    onChange={e => setSupportLimitTime(e.target.value)}
                  />
                </label>
                <label className="dp-field">
                  <span className="dp-field__label">Recurrencia</span>
                  <input
                    className="input"
                    value={recurrency ?? ''}
                    onChange={e => setRecurrency(e.target.value)}
                  />
                </label>
                <label className="dp-field dp-field--inline">
                  <span className="dp-field__label">Soporte activo</span>
                  <input
                    type="checkbox"
                    checked={isSupportActive}
                    onChange={e => setIsSupportActive(e.target.checked)}
                  />
                </label>
                <label className="dp-field dp-field--inline">
                  <span className="dp-field__label">Franquicia</span>
                  <input
                    type="checkbox"
                    checked={isFranchise}
                    onChange={e => setIsFranchise(e.target.checked)}
                  />
                </label>
                <label className="dp-field">
                  <span className="dp-field__label">Observación</span>
                  <textarea
                    className="input"
                    rows={3}
                    value={observation ?? ''}
                    onChange={e => setObservation(e.target.value)}
                  />
                </label>
              </div>
            </div>
            <footer className="dp-modal__footer">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setClientEditOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={saveClientEdits}
              >
                Guardar cambios
              </button>
            </footer>
          </div>
        </div>
      )}

      {addHostingOpen && (
        <div className="dp-modal">
          <div
            className="dp-modal__backdrop"
            onClick={() => setAddHostingOpen(false)}
          />
          <div className="dp-modal__content dp-modal__content--narrow">
            <header className="dp-modal__header">
              <h3>Nueva credencial de hosting</h3>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setAddHostingOpen(false)}
              >
                Cerrar
              </button>
            </header>
            <div className="dp-modal__body">
              <div className="dp-form">
                <label className="dp-field">
                  <span className="dp-field__label">Usuario</span>
                  <input
                    className="input"
                    value={newHosting.user ?? ''}
                    onChange={e =>
                      setNewHosting((prev: any) => ({
                        ...prev,
                        user: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="dp-field">
                  <span className="dp-field__label">Contraseña</span>
                  <input
                    className="input"
                    value={newHosting.password ?? ''}
                    onChange={e =>
                      setNewHosting((prev: any) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="dp-field">
                  <span className="dp-field__label">Instancia</span>
                  <input
                    className="input"
                    value={newHosting.instance ?? ''}
                    onChange={e =>
                      setNewHosting((prev: any) => ({
                        ...prev,
                        instance: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="dp-field">
                  <span className="dp-field__label">Puerto</span>
                  <input
                    className="input"
                    value={newHosting.port ?? ''}
                    onChange={e =>
                      setNewHosting((prev: any) => ({
                        ...prev,
                        port: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="dp-field">
                  <span className="dp-field__label">Observación</span>
                  <textarea
                    className="input"
                    rows={3}
                    value={newHosting.observation ?? ''}
                    onChange={e =>
                      setNewHosting((prev: any) => ({
                        ...prev,
                        observation: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </div>
            <footer className="dp-modal__footer">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setAddHostingOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={addHosting}
                disabled={!newHosting.user}
              >
                Guardar
              </button>
            </footer>
          </div>
        </div>
      )}

      {addDeviceOpen && (
        <div className="dp-modal">
          <div
            className="dp-modal__backdrop"
            onClick={() => setAddDeviceOpen(false)}
          />
          <div className="dp-modal__content dp-modal__content--narrow">
            <header className="dp-modal__header">
              <h3>Nuevo equipo</h3>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setAddDeviceOpen(false)}
              >
                Cerrar
              </button>
            </header>
            <div className="dp-modal__body">
              <div className="dp-form">
                <label className="dp-field">
                  <span className="dp-field__label">Nombre</span>
                  <input
                    className="input"
                    value={newDevice.name ?? ''}
                    onChange={e =>
                      setNewDevice((prev: any) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </label>
                <label className="dp-field">
                  <span className="dp-field__label">IP</span>
                  <input
                    className="input"
                    value={newDevice.ip ?? ''}
                    onChange={e =>
                      setNewDevice((prev: any) => ({ ...prev, ip: e.target.value }))
                    }
                  />
                </label>
                <label className="dp-field">
                  <span className="dp-field__label">Sistema operativo</span>
                  <input
                    className="input"
                    value={newDevice.operatingSystem ?? ''}
                    onChange={e =>
                      setNewDevice((prev: any) => ({
                        ...prev,
                        operatingSystem: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="dp-field">
                  <span className="dp-field__label">Versión SO</span>
                  <input
                    className="input"
                    value={newDevice.versionSO ?? ''}
                    onChange={e =>
                      setNewDevice((prev: any) => ({
                        ...prev,
                        versionSO: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="dp-field">
                  <span className="dp-field__label">Descripción</span>
                  <textarea
                    className="input"
                    rows={3}
                    value={newDevice.description ?? ''}
                    onChange={e =>
                      setNewDevice((prev: any) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="dp-field dp-field--inline">
                  <span className="dp-field__label">Activo</span>
                  <input
                    type="checkbox"
                    checked={!!newDevice.isActive}
                    onChange={e =>
                      setNewDevice((prev: any) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                  />
                </label>
              </div>
            </div>
            <footer className="dp-modal__footer">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setAddDeviceOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={createDevice}
                disabled={!newDevice.name}
              >
                Guardar
              </button>
            </footer>
          </div>
        </div>
      )}

      {pickSysOpen && (
        <div className="dp-modal">
          <div
            className="dp-modal__backdrop"
            onClick={() => setPickSysOpen(false)}
          />
          <div className="dp-modal__content">
            <header className="dp-modal__header">
              <h3>Seleccionar sistema</h3>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setPickSysOpen(false)}
              >
                Cerrar
              </button>
            </header>
            <div className="dp-modal__body">
              <div className="dp-section__filters">
                <input
                  className="input"
                  placeholder="Buscar en catálogo…"
                  value={sysGlobalFilter}
                  onChange={e => setSysGlobalFilter(e.target.value)}
                  onBlur={() => fetchSysPage(sysPage, sysPageSize)}
                />
              </div>
              <div className="dp-list">
                {sysCatalog.map(s => (
                  <div
                    key={s.id}
                    className={`dp-card pick-card ${
                      newSystem.outsourcedSystemsId === s.id ? 'pick-card--active' : ''
                    }`}
                    onClick={() =>
                      setNewSystem(prev => ({
                        ...prev,
                        outsourcedSystemsId: s.id,
                      }))
                    }
                  >
                    <div className="dp-card__row">
                      <span className="dp-card__label">Nombre</span>
                      <span className="dp-card__value">{displayOrDash(s.name)}</span>
                    </div>
                    <div className="dp-card__row">
                      <span className="dp-card__label">Versión</span>
                      <span className="dp-card__value">{displayOrDash(s.version)}</span>
                    </div>
                    <div className="dp-card__row">
                      <span className="dp-card__label">Descripción</span>
                      <span className="dp-card__value">{displayOrDash(s.description)}</span>
                    </div>
                  </div>
                ))}
                {sysCatalog.length === 0 && (
                  <p className="dp-list__empty">Sin resultados.</p>
                )}
              </div>
            </div>
            <footer className="dp-modal__footer dp-modal__footer--between">
              <div className="dp-pagination">
                <button
                  type="button"
                  className="btn btn--secondary"
                  disabled={sysPage <= 1}
                  onClick={() => {
                    const next = sysPage - 1
                    setSysPage(next)
                    fetchSysPage(next, sysPageSize)
                  }}
                >
                  Anterior
                </button>
                <span className="dp-pagination__info">
                  Página {sysPage} · {sysTotal} registros
                </span>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => {
                    const next = sysPage + 1
                    setSysPage(next)
                    fetchSysPage(next, sysPageSize)
                  }}
                >
                  Siguiente
                </button>
              </div>
              <div className="dp-modal__footerActions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setPickSysOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={addPickedSystem}
                  disabled={!newSystem.outsourcedSystemsId}
                >
                  Agregar
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {pickCtcOpen && (
        <div className="dp-modal">
          <div
            className="dp-modal__backdrop"
            onClick={() => setPickCtcOpen(false)}
          />
          <div className="dp-modal__content dp-modal__content--narrow">
            <header className="dp-modal__header">
              <h3>Seleccionar contacto</h3>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setPickCtcOpen(false)}
              >
                Cerrar
              </button>
            </header>
            <div className="dp-modal__body">
              <div className="dp-list">
                {contactPickerItems.map(c => (
                  <div
                    key={c.id}
                    className={`dp-card pick-card ${
                      newContact.contactId === c.id ? 'pick-card--active' : ''
                    }`}
                    onClick={() =>
                      setNewContact(prev => ({
                        ...prev,
                        contactId: c.id,
                      }))
                    }
                  >
                    <div className="dp-card__row">
                      <span className="dp-card__label">Nombre</span>
                      <span className="dp-card__value">
                        {displayOrDash(c.fullName)}
                      </span>
                    </div>
                    <div className="dp-card__row">
                      <span className="dp-card__label">Teléfono</span>
                      <span className="dp-card__value">
                        {displayOrDash(c.phone)}
                      </span>
                    </div>
                  </div>
                ))}
                {contactPickerItems.length === 0 && (
                  <p className="dp-list__empty">No hay contactos para vincular.</p>
                )}
              </div>
            </div>
            <footer className="dp-modal__footer">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setPickCtcOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={addPickedContact}
                disabled={!newContact.contactId}
              >
                Vincular
              </button>
            </footer>
          </div>
        </div>
      )}

      {clientPickerOpen && (
        <div className="dp-modal">
          <div
            className="dp-modal__backdrop"
            onClick={() => setClientPickerOpen(false)}
          />
          <div className="dp-modal__content">
            <header className="dp-modal__header">
              <h3>Cambiar cliente</h3>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setClientPickerOpen(false)}
              >
                Cerrar
              </button>
            </header>
            <div className="dp-modal__body">
              <div className="dp-section__filters">
                <input
                  className="input"
                  placeholder="Buscar cliente…"
                  value={clientPickerFilter}
                  onChange={e => setClientPickerFilter(e.target.value)}
                  onBlur={loadClientPicker}
                />
              </div>
              <div className="dp-list">
                {clientPickerData?.items?.map(c => (
                  <div
                    key={c.id}
                    className="dp-card pick-card"
                    onClick={() => pickClientAndLoad(c.id)}
                  >
                    <div className="dp-card__row">
                      <span className="dp-card__label">Nombre</span>
                      <span className="dp-card__value">
                        {displayOrDash(c.name)}
                      </span>
                    </div>
                    <div className="dp-card__row">
                      <span className="dp-card__label">Código</span>
                      <span className="dp-card__value">
                        {displayOrDash((c as any).clientCode ?? (c as any).codcli)}
                      </span>
                    </div>
                  </div>
                ))}
                {!clientPickerData?.items?.length && (
                  <p className="dp-list__empty">Sin resultados.</p>
                )}
              </div>
            </div>
            <footer className="dp-modal__footer dp-modal__footer--between">
              <div className="dp-pagination">
                <button
                  type="button"
                  className="btn btn--secondary"
                  disabled={clientPickerPage <= 1}
                  onClick={() => {
                    const next = clientPickerPage - 1
                    setClientPickerPage(next)
                    loadClientPicker()
                  }}
                >
                  Anterior
                </button>
                <span className="dp-pagination__info">
                  Página {clientPickerPage}
                </span>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => {
                    const next = clientPickerPage + 1
                    setClientPickerPage(next)
                    loadClientPicker()
                  }}
                >
                  Siguiente
                </button>
              </div>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setClientPickerOpen(false)}
              >
                Cerrar
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  )
}

export default ClientTab