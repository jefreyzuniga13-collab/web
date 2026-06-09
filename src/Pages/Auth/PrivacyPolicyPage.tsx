import React from "react";
import "@/Styles/Auth/PrivacyPolicy.css";
import logopcg from '@/assets/img/logopcg.png'

const PrivacyPolicy: React.FC = () => {
  return (
    <main className="privacy-policy" role="document" aria-label="Política de Privacidad">
      <article className="privacy-policy__paper">
        <header className="privacy-policy__header">
         <div className="privacy-policy__headerContent">
          <h1 className="privacy-policy__title">Política de Privacidad</h1>
          <img src={logopcg} alt="Logo PC Group" className="privacy-policy__logo" />
        </div>


          <p className="privacy-policy__meta">
            <strong>Empresa:</strong> PC Group S.A.
          </p>
          <p className="privacy-policy__meta">
            <strong>Producto:</strong> CRM de Atención al Cliente
          </p>
          <p className="privacy-policy__meta">
            <strong>Última actualización:</strong> 10 de junio de 2025
          </p>

          <p className="privacy-policy__lead">
            Esta política describe qué información se trata dentro del CRM cuando clientes o contactos se comunican por WhatsApp,
            con qué finalidad se utiliza, cómo se protege y cómo puedes ejercer tus derechos.
          </p>
        </header>

        <section className="privacy-policy__section" aria-labelledby="pp-1-title">
          <h2 id="pp-1-title" className="privacy-policy__h2">1. Información que recopilamos</h2>
          <p className="privacy-policy__p">
            Para operar el servicio de atención al cliente y gestionar conversaciones, tratamos información asociada a la mensajería.
            Esto incluye el número de teléfono vinculado a la cuenta de WhatsApp del contacto, el contenido de los mensajes intercambiados
            (texto y, cuando existan, archivos adjuntos como imágenes o documentos) y metadatos técnicos del mensaje como fecha, hora y estado
            de entrega, necesarios para trazabilidad y continuidad del servicio.
          </p>
        </section>

        <section className="privacy-policy__section" aria-labelledby="pp-2-title">
          <h2 id="pp-2-title" className="privacy-policy__h2">2. Uso de la información</h2>
          <p className="privacy-policy__p">
            Utilizamos esta información para enviar y recibir mensajes mediante WhatsApp Cloud API, atender solicitudes, dar seguimiento a
            casos y mantener un historial de conversación dentro del CRM. También se usa para asignación y gestión de conversaciones por agentes,
            control operativo del servicio, y análisis interno enfocado en mejorar tiempos de respuesta, calidad de atención y gestión de incidencias.
          </p>
        </section>

        <section className="privacy-policy__section" aria-labelledby="pp-3-title">
          <h2 id="pp-3-title" className="privacy-policy__h2">3. Compartir y almacenamiento</h2>
          <p className="privacy-policy__p">
            No vendemos información personal. El tratamiento puede involucrar proveedores necesarios para operar el canal y la infraestructura,
            incluyendo servicios integrados de mensajería (por ejemplo, Meta Platforms Inc. para WhatsApp Cloud API) y proveedores de hosting o
            almacenamiento. También podríamos divulgar información cuando sea requerido por una autoridad competente o cuando la ley lo permita.
          </p>
          <p className="privacy-policy__p">
            La información se almacena en entornos con controles de acceso y medidas de seguridad razonables para prevenir uso o acceso no autorizado.
            Cuando aplique, se utilizan mecanismos de protección como cifrado en reposo, además de prácticas de monitoreo y registro operativo.
          </p>
        </section>

        <section className="privacy-policy__section" aria-labelledby="pp-4-title">
          <h2 id="pp-4-title" className="privacy-policy__h2">4. Derechos de los usuarios</h2>
          <p className="privacy-policy__p">
            Puedes solicitar acceso, rectificación, actualización, eliminación u oposición al tratamiento de tus datos cuando corresponda.
            Para gestionar solicitudes relacionadas con privacidad, escribe a{" "}
            <a className="privacy-policy__link" href="mailto:soporte@pcgroupsa.com">
              soporte@pcgroupsa.com
            </a>
            .
          </p>
        </section>

        <section className="privacy-policy__section" aria-labelledby="pp-5-title">
          <h2 id="pp-5-title" className="privacy-policy__h2">5. Contacto</h2>
          <p className="privacy-policy__p">
            Si tienes preguntas sobre esta política o sobre el funcionamiento del CRM en el canal de WhatsApp, puedes contactarnos en{" "}
            <a className="privacy-policy__link" href="mailto:soporte@pcgroupsa.com">
              soporte@pcgroupsa.com
            </a>
            . PC Group S.A., Bolonia, Managua, Nicaragua.
          </p>
        </section>

        <div className="login__copyright">
                <span>© 2026 PC GROUP S.A. Todos los derechos reservados.</span>
                <span>Versión 26061</span>
              </div>
      </article>
    </main>
  );
};

export default PrivacyPolicy;
