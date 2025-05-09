import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode
  } from 'react';
  
  import {
    createHubConnection,
    onReceiveMessage,
    joinConversation
  } from '@/Services/signalr';
  import type{ MessageDto, AttachmentDto } from '@/Interfaces/Chat/ChatInterfaces';
  
  interface SignalRContextValue {
    joinConversation: (id: number) => void;
    onReceiveMessage: (
      handler: (payload: { Message: MessageDto; Attachments: AttachmentDto[] }) => void
    ) => void;
  }
  
  const SignalRContext = createContext<SignalRContextValue>({
    joinConversation: () => {},
    onReceiveMessage: () => {}
  });
  
  export const SignalRProvider: React.FC<{
    token: string;
    children: ReactNode;
  }> = ({ token, children }) => {
    const [ready, setReady] = useState(false);
  
    useEffect(() => {
      createHubConnection(token)
        .then(() => setReady(true))
        .catch(console.error);
    }, [token]);
  
    if (!ready) return <div>Conectando chat...</div>;
  
    return (
      <SignalRContext.Provider
        value={{ joinConversation, onReceiveMessage }}
      >
        {children}
      </SignalRContext.Provider>
    );
  };
  
  export function useSignalR() {
    return useContext(SignalRContext);
  }  