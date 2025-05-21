import api from '@/Utils/ApiConfig';

export function uploadAttachment(form: FormData) {
  return api.post<{ data: unknown }>('/Attachments', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function getAttachments(messageId: number) {
  return api.get<{ data: unknown }>(`/Attachments/message/${messageId}`);
}