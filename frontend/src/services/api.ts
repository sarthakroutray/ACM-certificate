const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ============ Types ============

export interface Certificate {
  id: string;
  code: string;
  recipientName: string;
  email: string;
  workshopName: string;
  issueDate: string;
  skills: string[];
  instructor: string;
  isVerified: boolean;
  status: string;
  filePath: string | null;
  emailStatus: string;
  createdAt: string;
}

export interface CertificateVerifyResponse {
  id: string;
  code: string;
  recipientName: string;
  workshopName: string;
  issueDate: string;
  skills: string[];
  instructor: string;
  isVerified: boolean;
  certificateUrl: string | null;
}

export interface Workshop {
  id: string;
  title: string;
  date: string;
  description?: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  instructor: string;
  image?: string;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// ============ Helpers ============

// Backend uses snake_case, frontend uses camelCase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCertificateFromApi(data: any): Certificate {
  return {
    id: data.id,
    code: data.code,
    recipientName: data.recipient_name,
    email: data.email,
    workshopName: data.workshop_name,
    issueDate: data.issue_date,
    skills: data.skills,
    instructor: data.instructor,
    isVerified: data.is_verified,
    status: data.status || 'PENDING',
    filePath: data.file_path || null,
    emailStatus: data.email_status || 'NOT_SENT',
    createdAt: data.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCertificateVerifyFromApi(data: any): CertificateVerifyResponse {
  return {
    id: data.id,
    code: data.code,
    recipientName: data.recipient_name,
    workshopName: data.workshop_name,
    issueDate: data.issue_date,
    skills: data.skills,
    instructor: data.instructor,
    isVerified: data.is_verified,
    certificateUrl: data.certificate_url || null,
  };
}

export interface CertificateCreateData {
  recipientName: string;
  email: string;
  workshopName: string;
  issueDate: string;
  skills: string[];
  instructor: string;
  code?: string;
}

function mapCertificateToApi(cert: CertificateCreateData) {
  return {
    recipient_name: cert.recipientName,
    email: cert.email,
    workshop_name: cert.workshopName,
    issue_date: cert.issueDate,
    skills: cert.skills,
    instructor: cert.instructor,
    code: cert.code,
  };
}

// ============ Auth ============

export async function loginAdmin(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
}

export async function registerAdmin(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Registration failed');
  }

  return response.json();
}

// ============ Certificates (Public) ============

export async function verifyCertificate(code: string): Promise<CertificateVerifyResponse> {
  const response = await fetch(`${API_BASE_URL}/api/certificates/verify/${code.toUpperCase()}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Certificate not found');
    }
    throw new Error('Verification failed');
  }

  const data = await response.json();
  return mapCertificateVerifyFromApi(data);
}

export async function searchCertificates(email: string): Promise<CertificateVerifyResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/certificates/search?email=${encodeURIComponent(email)}`);

  if (!response.ok) {
    throw new Error('Search failed');
  }

  const data = await response.json();
  return data.map(mapCertificateVerifyFromApi);
}

// ============ Certificates (Admin) ============

export async function createCertificate(
  token: string,
  certificate: CertificateCreateData
): Promise<Certificate> {
  const response = await fetch(`${API_BASE_URL}/api/certificates/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mapCertificateToApi(certificate)),
  });

  if (!response.ok) {
    throw new Error('Failed to create certificate');
  }

  const data = await response.json();
  return mapCertificateFromApi(data);
}

export async function getAllCertificates(token: string, skip: number = 0, limit: number = 100): Promise<Certificate[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/certificates/admin/all?skip=${skip}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch certificates');
  }

  const data = await response.json();
  return data.map(mapCertificateFromApi);
}

export async function getCertificateDetail(token: string, certificateId: string): Promise<Certificate> {
  const response = await fetch(`${API_BASE_URL}/api/certificates/admin/${certificateId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch certificate');
  }

  const data = await response.json();
  return mapCertificateFromApi(data);
}

export async function updateCertificate(
  token: string,
  certificateId: string,
  updates: Partial<Certificate>
): Promise<Certificate> {
  const response = await fetch(`${API_BASE_URL}/api/certificates/admin/${certificateId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update certificate');
  }

  const data = await response.json();
  return mapCertificateFromApi(data);
}

export async function deleteCertificate(token: string, certificateId: string): Promise<{ success: true; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/certificates/admin/${certificateId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete certificate');
  }

  return response.json();
}

export async function bulkCreateCertificates(
  token: string,
  certificates: Array<CertificateCreateData>
): Promise<{ success: boolean; count: number; certificates: Certificate[]; errors: Array<{ row: number; name: string; error: string }> }> {
  const response = await fetch(`${API_BASE_URL}/api/certificates/admin/bulk-create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(certificates.map(mapCertificateToApi)),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => null);
    throw new Error(errBody?.detail || 'Failed to create certificates');
  }

  const data = await response.json();
  return {
    ...data,
    certificates: data.certificates.map(mapCertificateFromApi),
    errors: data.errors || [],
  };
}

export async function getCertificateStats(token: string): Promise<{ total_certificates: number }> {
  const response = await fetch(`${API_BASE_URL}/api/certificates/admin/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch statistics');
  }

  return response.json();
}

// ============ Workshops (Public) ============

export async function getWorkshops(skip: number = 0, limit: number = 100): Promise<Workshop[]> {
  const response = await fetch(`${API_BASE_URL}/api/workshops/?skip=${skip}&limit=${limit}`);

  if (!response.ok) {
    throw new Error('Failed to fetch workshops');
  }

  return response.json();
}

export async function getWorkshopDetail(workshopId: string): Promise<Workshop> {
  const response = await fetch(`${API_BASE_URL}/api/workshops/${workshopId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch workshop');
  }

  return response.json();
}

// ============ Workshops (Admin) ============

export async function createWorkshop(token: string, workshop: Omit<Workshop, 'id' | 'createdAt'>): Promise<Workshop> {
  const response = await fetch(`${API_BASE_URL}/api/workshops/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workshop),
  });

  if (!response.ok) {
    throw new Error('Failed to create workshop');
  }

  return response.json();
}

export async function updateWorkshop(
  token: string,
  workshopId: string,
  updates: Partial<Workshop>
): Promise<Workshop> {
  const response = await fetch(`${API_BASE_URL}/api/workshops/${workshopId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update workshop');
  }

  return response.json();
}

export async function deleteWorkshop(token: string, workshopId: string): Promise<{ success: true; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/workshops/${workshopId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete workshop');
  }

  return response.json();
}

// ============ Event Images ============

export async function uploadEventImage(token: string, eventId: string, file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }

  return response.json();
}

export async function getEventImages(eventId: string): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/images`);

  if (!response.ok) {
    throw new Error('Failed to get event images');
  }

  const data = await response.json();
  return data.images || [];
}

export async function deleteEventImage(token: string, eventId: string, filename: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/images/${filename}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete image');
  }

  return response.json();
}

// ============ Template position endpoints ============

export interface TemplateRecord {
  id: string;
  event_id: string;
  image_url: string;
  name_x: number;
  name_y: number;
  name_font_size: number;
  name_font_family: string;
  name_alignment: string;
  name_color: string;
  code_x: number;
  code_y: number;
  code_font_size: number;
  code_font_family: string;
  code_alignment: string;
  code_color: string;
}

export async function getEventTemplates(eventId: string): Promise<TemplateRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/templates`);
  if (!response.ok) {
    throw new Error('Failed to get event templates');
  }
  return response.json();
}

export async function saveEventTemplate(
  token: string,
  eventId: string,
  data: {
    image_url: string;
    name_placeholder: { x: number; y: number; fontSize: number; fontFamily?: string; alignment?: string; color?: string };
    code_placeholder: { x: number; y: number; fontSize: number; fontFamily?: string; alignment?: string; color?: string };
  },
): Promise<TemplateRecord> {
  const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/templates`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to save template');
  }

  return response.json();
}

// ============ Certificate Generation ============

export interface BulkGenerateResponse {
  total: number;
  generated: number;
  skipped: number;
  failed: number;
}

export async function generateCertificate(
  token: string,
  certificateId: string,
): Promise<{ success: boolean; file_path: string; download_url: string }> {
  const response = await fetch(`${API_BASE_URL}/api/certificates/admin/generate/${certificateId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to generate certificate');
  }

  return response.json();
}

export async function generateWorkshopCertificates(
  token: string,
  workshopId: string,
): Promise<BulkGenerateResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/certificates/admin/generate-workshop/${workshopId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error('Failed to generate workshop certificates');
  }

  return response.json();
}

export async function downloadCertificateZip(
  token: string,
  workshopId: string,
): Promise<Blob> {
  const response = await fetch(
    `${API_BASE_URL}/api/certificates/admin/download-zip/${workshopId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error('Failed to download certificate ZIP');
  }

  return response.blob();
}

export function getCertificateDownloadUrl(code: string): string {
  return `${API_BASE_URL}/api/certificates/download/${code.toUpperCase()}`;
}

// ============ Email Delivery ============

export interface EmailStatusResponse {
  total: number;
  sent: number;
  failed: number;
  pending: number;
}

export async function sendCertificateEmail(
  token: string,
  certificateId: string,
  force: boolean = false,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/api/certificates/admin/send-email/${certificateId}?force=${force}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errBody = await response.json().catch(() => null);
    throw new Error(errBody?.detail || 'Failed to send email');
  }

  return response.json();
}

export async function sendWorkshopEmails(
  token: string,
  workshopId: string,
  force: boolean = false,
): Promise<{ message: string; total: number }> {
  const response = await fetch(
    `${API_BASE_URL}/api/certificates/admin/send-workshop-emails/${workshopId}?force=${force}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errBody = await response.json().catch(() => null);
    throw new Error(errBody?.detail || 'Failed to send workshop emails');
  }

  return response.json();
}

export async function getEmailStatus(
  token: string,
  workshopId: string,
): Promise<EmailStatusResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/certificates/admin/email-status/${workshopId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error('Failed to fetch email status');
  }

  return response.json();
}
