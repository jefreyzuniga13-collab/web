import * as signalR from '@microsoft/signalr';
import type{MessageDto, AttachmentDto} from '@/Interfaces/Chat/ChatInterfaces'
let connection: signalR.HubConnection | null = null;

export async function createHubConnection(token: string) {
  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${process.env.REACT_APP_API_URL?.replace('/api/v1','')}/chatHub`, {
      accessTokenFactory: () => token
    })
    .withAutomaticReconnect()
    .build();

  await connection.start();
  return connection;
}

export function joinConversation(conversationId: number) {
  if (!connection) return;
  connection.invoke('JoinConversation', conversationId.toString());
}

export function onReceiveMessage(
  handler: (payload: { Message: MessageDto; Attachments: AttachmentDto[] }) => void
) {
  connection?.on('ReceiveMessage', handler);
}