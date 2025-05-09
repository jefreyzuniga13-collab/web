import React, { useState } from 'react';
import { SignalRProvider } from '@/Context/SignalRContext';
import { InboxList }       from '@/Components/Chat/InboxList';
import { ChatWindow }      from '@/Components/Chat/hatWindow';
import { AssignModal }     from '@/Components/Chat/AssignModal';
import { ContactDetail }   from '@/Components/Chat/ContactDetail';

 const SupportPage: React.FC = () => {
  const [convId, setConvId]           = useState<number>();
  const [showAssign, setShowAssign]   = useState(false);
  const token  = localStorage.getItem('jwt')     || '';
  const userId = localStorage.getItem('userId') || '';

  return (
    <SignalRProvider token={token}>
      <div className="grid grid-cols-4 h-screen">
        <aside className="col-span-1 border-r">
          <InboxList selectedId={convId} onSelect={setConvId!} />
        </aside>

        <main className="col-span-2 flex flex-col">
          <header className="p-2 flex justify-between items-center border-b">
            <h2 className="text-lg font-semibold">Chat</h2>
            <button
              className="px-3 py-1 bg-green-600 text-white rounded"
              onClick={() => setShowAssign(true)}
            >
              Asignar
            </button>
          </header>

          <div className="flex-1">
            <ChatWindow conversationId={convId} userId={userId} />
          </div>
        </main>

        <aside className="col-span-1 border-l">
          <ContactDetail conversationId={convId} />
        </aside>
      </div>

      <AssignModal
        convId={convId}
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
      />
    </SignalRProvider>
  );
};

export default SupportPage;