
interface Props {
    handleSendQuick: (text: string, onSendNow?: (t: string) => void | Promise<void>) => void;
    onSendNow?: (txt: string) => void | Promise<void>;
    qQuick: string;
    setQQuick: React.Dispatch<React.SetStateAction<string>>;
    // quickOptions: string[];
    filteredQuick: string[];
}
const DetailPanelMensajesRapidos: React.FC<Props> = ({
    handleSendQuick,
    onSendNow,
    qQuick,
    setQQuick,
    filteredQuick
}) => {
    return (
        <>
            <header className="detailPanel-quick__header">
                <h5 className="detailPanel-content-header__title">Mensajes rápidos</h5>
                <input
                    className="detailPanel-quick__search"
                    placeholder="Buscar…"
                    value={qQuick}
                    onChange={(e) => setQQuick(e.target.value)}
                    aria-label="Buscar mensajes rápidos"
                />
            </header>

            <div className="detailPanel-quick">
                <ul
                    className="detailPanel-quick__list"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 10 }}
                >
                    {filteredQuick.map((opt, i) => (
                        <li key={`${opt}-${i}`} className="detailPanel-quick__item">
                            <div
                                className="detailPanel-quick__text"
                                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                            >
                                {opt}
                            </div>
                            <div className="detailPanel-quick__actions">
                                <button
                                    type="button"
                                    className="btn btn--primary"
                                    onClick={() => handleSendQuick(opt, onSendNow)}
                                    title="Enviar ahora"
                                >
                                    Enviar
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    )
}

export default DetailPanelMensajesRapidos