export interface AttachmentDto {
    attachmentId: number;
    messageId:    number;
    mediaId:      string;
    fileName?:    string;
    mimeType?:    string;
    mediaUrl?:    string;
  }
  
  export type MessageType = 'Text' | 'Media' | 'Bot';
  
  export interface MessageDto {
    messageId:      number;
    conversationId: number;
    senderId:       string;
    content?:       string;
    caption?:       string;
    messageType:    MessageType;
    createdAt:      string;
    createdBy:      string;
    updatedAt?:     string;
    updatedBy?:     string;
    attachments:    AttachmentDto[];
  }
  
  export interface ConversationDto {
    conversationId: number;
    contactId:      string;
    contactName:    string;
    contactEmail?:  string;
    assignedAgent?: string;
    status:         string;
    createdAt:      string;
    createdBy:      string;
    updatedAt?:     string;
    updatedBy?:     string;
  }
  
  export interface AgentDto {
    userId:   string;
    fullName: string;
    email:    string;
  }  