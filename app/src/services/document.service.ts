import { api, downloadFile } from './apiClient';
export const documentService = {
  upload: (documentType: string, file: File) => {
    const form = new FormData();
    form.append('documentType', documentType);
    form.append('file', file);
    return api('/doctor-registration/documents', {
      method: 'POST',
      body: form,
    });
  },
  download: async (registrationId: string, id: string, name: string) => {
    const blob = await downloadFile(
      '/admin/doctor-registrations/' +
        encodeURIComponent(registrationId) +
        '/documents/' +
        encodeURIComponent(id),
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  },
};
