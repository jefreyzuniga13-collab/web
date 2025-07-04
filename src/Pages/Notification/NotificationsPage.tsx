import React from 'react';
import { useNotifications } from '@/Hooks/useNotifications';

const NotificationsPage: React.FC = () => {
  const { list, loadingList } = useNotifications();

  if (loadingList) return <p>Cargando…</p>;
  if (!list.length) return <p>No tienes notificaciones.</p>;

  return (
    <ul>
      {list.map(n => (
        <li key={n.notificationRecipientId} className={n.isRead ? '' : 'unread'}>
          <small>{new Date(n.createdAt).toLocaleString()}</small>
          <p>{n.payload}</p>
        </li>
      ))}
      {/* aquí podrías poner paginación usando meta */}
    </ul>
  );
};

export default NotificationsPage;