/* eslint-disable @typescript-eslint/no-explicit-any */
import { ImWhatsapp } from "react-icons/im"
import { RiMessengerLine } from "react-icons/ri"
import { FaInstagram } from "react-icons/fa6"
import { CHANNEL } from "@/Interfaces/Wh/MetaChannelId"
import { format, isToday, isYesterday, parseISO, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale/es";
import { FaDownload } from "react-icons/fa6";

// CHAT
export const getChannelIcon = (channelId?: number | null) => {
  if (channelId === CHANNEL.Whatsapp) {
    return <ImWhatsapp size={16} className="whatsapp-icon" />
  }

  if (channelId === CHANNEL.Messenger) {
    return <RiMessengerLine size={18} className="messenger-icon" />
  }

  return <FaInstagram size={16} className="instagram-icon" />
}

 export const isImage = (mt?: string | null) => !!mt && (mt.startsWith("image/") || mt === "image/webp");
 export const isVideo = (mt?: string | null) => !!mt && mt.startsWith("video/");
 export const isAudio = (mt?: string | null) => !!mt && mt.startsWith("audio/");

 export const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

 export const dateLabel = (iso: string) => {
  const d = parseISO(iso);
  if (isToday(d)) return "Hoy";
  if (isYesterday(d)) return "Ayer";
  const diff = differenceInCalendarDays(new Date(), d);
  if (diff >= 2 && diff < 7) return cap(format(d, "EEEE", { locale: es }));
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: es });
};

 export const renderAttachments = (message: any) => {
  const a = message?.attachments?.[0];
  if (!a) return null;

  const href = a.mediaUrl as string;
  const name = (a.fileName as string) || "archivo";

  if (isImage(a.mimeType)) {
    return (
      <div className="chm-attachment chm-attachment--image">
        <a href={href} target="_blank" rel="noopener noreferrer" className="chm-image-link">
          <img src={href} alt={name} className="chm-image" loading="lazy" />
        </a>
        <div className="chm-attachment-meta">
          <a href={href} download={name} className="chm-download">
            <FaDownload size={14} />
            <span>{name}</span>
          </a>
        </div>
      </div>
    );
  }

  if (isVideo(a.mimeType)) {
    return (
      <div className="chm-attachment chm-attachment--video">
        <video controls className="chm-video" src={href} />
        <div className="chm-attachment-meta">
          <a href={href} download={name} className="chm-download">
            <FaDownload size={14} />
            <span>{name}</span>
          </a>
        </div>
      </div>
    );
  }

  if (isAudio(a.mimeType)) {
    return (
      <div className="chm-attachment chm-attachment--audio">
        <audio controls className="chm-audio" src={href} />
        <div className="chm-attachment-meta">
          <a href={href} download={name} className="chm-download">
            <FaDownload size={14} />
            <span>{name}</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="chm-attachment chm-attachment--doc">
      <a href={href} target="_blank" rel="noopener noreferrer" className="chm-doc-link">
        <span className="chm-doc-name">{name}</span>
      </a>
      <div className="chm-attachment-meta">
        <a href={href} download={name} className="chm-download">
          <FaDownload size={14} />
          <span>Descargar</span>
        </a>
      </div>
    </div>
  );
};


