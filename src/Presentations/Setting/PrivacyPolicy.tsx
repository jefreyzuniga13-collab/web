
import React from 'react';
import '@/Styles/Setting/PrivacyPolicy.css';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="privacy-policy">
      <div className="privacy-policy__container">
        <header className="privacy-policy__header">
          <h1 className="privacy-policy__title">Política de Privacidad de PC Group S.A.</h1>
          <p className="privacy-policy__updated">Última actualización: 10 de junio de 2025</p>
        </header>

        <main className="privacy-policy__content">
          <section className="privacy-policy__section">
            <h2 className="privacy-policy__section-title">1. Información que recopilamos</h2>
            <p className="privacy-policy__text">
              Recopilamos los siguientes datos personales de nuestros usuarios:
            </p>
            <ul className="privacy-policy__list">
              <li className="privacy-policy__list-item">Número de teléfono asociado a la cuenta de WhatsApp.</li>
              <li className="privacy-policy__list-item">Contenido de los mensajes (texto, imágenes, archivos).</li>
              <li className="privacy-policy__list-item">Metadatos de los mensajes (fecha, hora, estado de entrega).</li>
            </ul>
          </section>

          <section className="privacy-policy__section">
            <h2 className="privacy-policy__section-title">2. Uso de la información</h2>
            <p className="privacy-policy__text">
              Utilizamos estos datos para proporcionar y mejorar nuestro servicio de atención al cliente:
            </p>
            <ul className="privacy-policy__list">
              <li className="privacy-policy__list-item">Envío y recepción de mensajes vía WhatsApp Cloud API.</li>
              <li className="privacy-policy__list-item">Gestión de conversaciones en tiempo real con agentes.</li>
              <li className="privacy-policy__list-item">Análisis interno para mejorar la calidad de la atención.</li>
            </ul>
          </section>

          <section className="privacy-policy__section">
            <h2 className="privacy-policy__section-title">3. Compartir y almacenamiento</h2>
            <p className="privacy-policy__text">
              No compartimos los datos personales con terceros, salvo:
            </p>
            <ul className="privacy-policy__list">
              <li className="privacy-policy__list-item">Proveedores de hosting y servicios integrados (p. ej., Meta Platforms Inc.).</li>
              <li className="privacy-policy__list-item">Autoridades legales si así lo exige la ley.</li>
            </ul>
            <p className="privacy-policy__text">
              Los datos se almacenan en servidores seguros con acceso restringido y cifrado en reposo.
            </p>
          </section>

          <section className="privacy-policy__section">
            <h2 className="privacy-policy__section-title">4. Derechos de los usuarios</h2>
            <p className="privacy-policy__text">
              Los usuarios pueden ejercer sus derechos de acceso, rectificación, eliminación y oposición enviando un correo a:
            </p>
            <div className="privacy-policy__contact">
              <p className="privacy-policy__contact-text">
                <strong>Email:</strong> 
                <a href="mailto:privacidad@pcgroupsa.com" className="privacy-policy__link">
                  privacidad@pcgroupsa.com
                </a>
              </p>
            </div>
          </section>

          <section className="privacy-policy__section">
            <h2 className="privacy-policy__section-title">5. Contacto</h2>
            <p className="privacy-policy__text">
              Para preguntas sobre esta política, contáctenos en:
            </p>
            <div className="privacy-policy__contact">
              <p className="privacy-policy__contact-text">
                <strong>PC Group S.A.</strong><br />
                Bolonia, Managua, Nicaragua<br />
                <strong>Email:</strong> 
                <a href="mailto:soporte@pcgroupsa.com" className="privacy-policy__link">
                  soporte@pcgroupsa.com
                </a>
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default PrivacyPolicy;