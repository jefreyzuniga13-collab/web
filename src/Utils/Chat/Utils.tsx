import { ImWhatsapp } from "react-icons/im"
import { RiMessengerLine } from "react-icons/ri"
import { FaInstagram } from "react-icons/fa6"
import { CHANNEL } from "@/Interfaces/Wh/MetaChannelId"


export const getChannelIcon = (channelId?: number | null) => {
  if (channelId === CHANNEL.Whatsapp) {
    return <ImWhatsapp size={16} className="whatsapp-icon" />
  }

  if (channelId === CHANNEL.Messenger) {
    return <RiMessengerLine size={18} className="messenger-icon" />
  }

  return <FaInstagram size={16} className="instagram-icon" />
}
