import { Certificate } from '../../types';

const STORAGE_KEY = 'acm_certificates';

// Mock database (existing certificates)
const MOCK_DB: Record<string, Certificate> = {
  'ACM-2023-REACT': {
    id: 'ACM-2023-REACT',
    recipientName: 'Alex Johnson',
    workshopName: 'Advanced React Patterns',
    issueDate: 'October 24, 2023',
    skills: ['React Hooks', 'Context API', 'Performance Optimization'],
    instructor: 'Dr. Emily Chen'
  },
  'ACM-2023-PYDS': {
    id: 'ACM-2023-PYDS',
    recipientName: 'Sarah Smith',
    workshopName: 'Python for Data Science',
    issueDate: 'November 10, 2023',
    skills: ['Pandas', 'NumPy', 'Matplotlib'],
    instructor: 'Prof. Michael Ross'
  }
};

export const generateCertificateId = (): string => {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ACM-${year}-${random}`;
};

export const saveCertificate = (certificate: Certificate): void => {
  const certificates = getCertificates();
  certificates[certificate.id] = certificate;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(certificates));
};

export const getCertificates = (): Record<string, Certificate> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const certificates = stored ? JSON.parse(stored) : {};
    // Merge with mock database
    return { ...MOCK_DB, ...certificates };
  } catch (error) {
    console.error('Error reading certificates:', error);
    return { ...MOCK_DB };
  }
};

export const getCertificateById = (id: string): Certificate | null => {
  const certificates = getCertificates();
  return certificates[id] || null;
};

export const deleteCertificate = (id: string): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const certificates = stored ? JSON.parse(stored) : {};
    delete certificates[id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(certificates));
  } catch (error) {
    console.error('Error deleting certificate:', error);
  }
};

export const getUploadedCertificates = (): Certificate[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const certificates = stored ? JSON.parse(stored) : {};
    return Object.values(certificates);
  } catch (error) {
    console.error('Error reading uploaded certificates:', error);
    return [];
  }
};
