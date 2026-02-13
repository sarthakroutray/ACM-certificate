import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import CertificateTemplateEditor, { TemplateData } from '../../components/admin/CertificateTemplateEditor';
import EventSelector from '../../components/admin/EventSelector';
import {
  Upload,
  List,
  Plus,
  X,
  LogOut,
  CheckCircle,
  Trash2,
  Calendar,
  User as UserIcon,
  AlertCircle,
  Loader,
  FileSpreadsheet,
  UserPlus,
  Users,
  ChevronDown,
  ChevronRight,
  Award,
  Download,
  Mail,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createCertificate,
  getAllCertificates,
  deleteCertificate as deleteCertificateApi,
  bulkCreateCertificates,
  getWorkshops,
  getEventTemplates,
  generateCertificate as generateCertificateApi,
  generateWorkshopCertificates,
  downloadCertificateZip,
  getCertificateDownloadUrl,
  sendCertificateEmail,
  sendWorkshopEmails,
  Certificate,
  Workshop,
  TemplateRecord,
  BulkGenerateResponse
} from '../../services/api';

type TabType = 'upload' | 'manage';
type UploadMode = 'single' | 'bulk';

const AdminDashboard: React.FC = () => {
  const { logout, user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [uploadMode, setUploadMode] = useState<UploadMode>('single');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCerts, setIsLoadingCerts] = useState(true);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [bulkTemplateData, setBulkTemplateData] = useState<TemplateData | null>(null);
  const [bulkEventName, setBulkEventName] = useState('');
  const [bulkEventId, setBulkEventId] = useState('');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [bulkIsLoading, setBulkIsLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ count: number } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    workshopName: '',
    recipientName: '',
    email: '',
    issueDate: '',
    instructor: '',
    templateImage: ''
  });
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [skills, setSkills] = useState<string[]>(['']);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  // Load certificates on mount
  useEffect(() => {
    const loadCertificates = async () => {
      if (!token) return;

      setIsLoadingCerts(true);
      try {
        const certs = await getAllCertificates(token);
        setCertificates(certs);
      } catch (error) {
        console.error('Failed to load certificates:', error);
        setErrorMessage('Failed to load certificates');
      } finally {
        setIsLoadingCerts(false);
      }
    };

    loadCertificates();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSkillChange = (index: number, value: string) => {
    const newSkills = [...skills];
    newSkills[index] = value;
    setSkills(newSkills);
  };

  const addSkillInput = () => {
    setSkills([...skills, '']);
  };

  const removeSkillInput = (index: number) => {
    if (skills.length > 1) {
      setSkills(skills.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validate
    if (!formData.workshopName || !formData.recipientName || !formData.email || !formData.issueDate || !formData.instructor) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    const filteredSkills = skills.filter(s => s.trim() !== '');
    if (filteredSkills.length === 0) {
      setErrorMessage('Please add at least one skill');
      return;
    }

    if (!token) {
      setErrorMessage('Not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      const newCertificate = await createCertificate(token, {
        recipientName: formData.recipientName,
        email: formData.email,
        workshopName: formData.workshopName,
        issueDate: formData.issueDate,
        skills: filteredSkills,
        instructor: formData.instructor
      });

      // Show success
      setSuccessMessage(`Certificate ${newCertificate.code} created successfully!`);
      setTimeout(() => setSuccessMessage(''), 5000);

      // Reset form
      setFormData({
        workshopName: '',
        recipientName: '',
        email: '',
        issueDate: '',
        instructor: '',
        templateImage: ''
      });
      setTemplateData(null);
      setSkills(['']);

      // Add to list
      setCertificates(prev => [newCertificate, ...prev]);
    } catch (error) {
      console.error('Failed to create certificate:', error);
      setErrorMessage('Failed to create certificate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete certificate ${code}?`)) return;
    if (!token) return;

    try {
      await deleteCertificateApi(token, id);
      setCertificates(prev => prev.filter(c => c.id !== id));
      setSuccessMessage(`Certificate ${code} deleted successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to delete certificate:', error);
      setErrorMessage('Failed to delete certificate');
    }
  };

  // ---- Bulk CSV upload ----
  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; continue; }
        if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
        current += ch;
      }
      values.push(current.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      return row;
    });
  };

  const handleBulkSubmit = async () => {
    if (!csvFile || !bulkEventName || !token) return;
    setErrorMessage('');
    setBulkResult(null);
    setBulkIsLoading(true);

    try {
      const text = await csvFile.text();
      const rows = parseCSV(text);
      if (rows.length === 0) {
        setErrorMessage('CSV file is empty or has no data rows.');
        setBulkIsLoading(false);
        return;
      }

      if (!('name' in rows[0]) || !('email' in rows[0])) {
        setErrorMessage('CSV must have "name" and "email" columns.');
        setBulkIsLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const certificates = rows
        .filter((row) => row.name && row.email)
        .map((row) => ({
          recipientName: row.name,
          email: row.email,
          workshopName: bulkEventName,
          issueDate: row.date || today,
          skills: row.skills ? row.skills.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean) : [],
          instructor: row.instructor || 'ACM',
          code: row.code || undefined,
        }));

      if (certificates.length === 0) {
        setErrorMessage('No valid rows found in CSV (need name & email).');
        setBulkIsLoading(false);
        return;
      }

      const result = await bulkCreateCertificates(token, certificates);
      setBulkResult({ count: result.count });
      setCsvFile(null);

      // Show per-row errors if any
      if (result.errors && result.errors.length > 0) {
        const errorSummary = result.errors
          .map((e) => `Row ${e.row} (${e.name}): ${e.error}`)
          .join('\n');
        setErrorMessage(`${result.count} created, ${result.errors.length} failed:\n${errorSummary}`);
      }

      // Refresh certificate list
      const allCerts = await getAllCertificates(token);
      setCertificates(allCerts);
    } catch (error) {
      console.error('Bulk upload failed:', error);
      setErrorMessage('Bulk upload failed. Check CSV format and try again.');
    } finally {
      setBulkIsLoading(false);
    }
  };

  // ---- Download certificate image (backend-generated) ----
  const handleDownloadCertificate = async (cert: Certificate) => {
    if (!token) return;
    try {
      // If not yet generated, trigger generation first
      if (cert.status !== 'GENERATED') {
        await generateCertificateApi(token, cert.id);
      }
      // Download via the public endpoint
      const url = getCertificateDownloadUrl(cert.code);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${cert.code}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to download certificate:', err);
      alert('Failed to download certificate. Make sure a template is saved for this event.');
    }
  };

  // ---- Bulk generate + download ZIP ----
  const [generateResult, setGenerateResult] = useState<BulkGenerateResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [sendingEmailCertId, setSendingEmailCertId] = useState<string | null>(null);

  const handleBulkGenerate = async (workshopName: string) => {
    if (!token) return;
    try {
      const workshops: Workshop[] = await getWorkshops();
      const ws = workshops.find((w) => w.title === workshopName);
      if (!ws) { alert('Workshop not found'); return; }
      setIsGenerating(true);
      setGenerateResult(null);
      const result = await generateWorkshopCertificates(token, ws.id);
      setGenerateResult(result);
      // Refresh certificate list to update statuses
      const allCerts = await getAllCertificates(token);
      setCertificates(allCerts);
    } catch (err) {
      console.error('Bulk generation failed:', err);
      alert('Bulk generation failed. Ensure a template exists for this event.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadZip = async (workshopName: string) => {
    if (!token) return;
    try {
      const workshops: Workshop[] = await getWorkshops();
      const ws = workshops.find((w) => w.title === workshopName);
      if (!ws) { alert('Workshop not found'); return; }
      setIsDownloadingZip(true);
      const blob = await downloadCertificateZip(token, ws.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificates-${workshopName.replace(/\s+/g, '-')}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP download failed:', err);
      alert('Failed to download ZIP. Generate certificates first.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleSendAllEmails = async (workshopName: string) => {
    if (!token) return;
    try {
      const workshops: Workshop[] = await getWorkshops();
      const ws = workshops.find((w) => w.title === workshopName);
      if (!ws) { alert('Workshop not found'); return; }
      setIsSendingEmails(true);
      await sendWorkshopEmails(token, ws.id);
      setSuccessMessage(`Email sending initiated for ${workshopName}. Status will update shortly.`);
      setTimeout(() => setSuccessMessage(''), 5000);
      // Refresh after a short delay to show updated statuses
      setTimeout(async () => {
        const allCerts = await getAllCertificates(token);
        setCertificates(allCerts);
      }, 3000);
    } catch (err) {
      console.error('Bulk email send failed:', err);
      alert('Failed to send emails. Check SMTP configuration.');
    } finally {
      setIsSendingEmails(false);
    }
  };

  const handleSendSingleEmail = async (cert: Certificate) => {
    if (!token) return;
    if (cert.status !== 'GENERATED') {
      alert('Certificate must be generated before sending email.');
      return;
    }
    try {
      setSendingEmailCertId(cert.id);
      await sendCertificateEmail(token, cert.id);
      setSuccessMessage(`Email sending initiated for ${cert.recipientName}.`);
      setTimeout(() => setSuccessMessage(''), 3000);
      // Refresh after a short delay to show updated status
      setTimeout(async () => {
        const allCerts = await getAllCertificates(token);
        setCertificates(allCerts);
      }, 2000);
    } catch (err) {
      console.error('Email send failed:', err);
      alert('Failed to send email. Check SMTP configuration.');
    } finally {
      setSendingEmailCertId(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Admin Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-300 font-mono">
              Welcome back, <span className="font-bold text-primary">{user?.email}</span>
            </p>
          </div>
          <Button onClick={handleLogout} variant="secondary" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 p-4 rounded-r-lg flex items-start"
            >
              <CheckCircle className="w-6 h-6 text-emerald-500 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-800 dark:text-emerald-300 font-mono">{successMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start"
            >
              <AlertCircle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 dark:text-red-300 font-mono">{errorMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('upload')}
            className={`
              px-6 py-3 font-bold transition-all relative
              ${activeTab === 'upload'
                ? 'text-primary'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }
            `}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload Certificate
            {activeTab === 'upload' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`
              px-6 py-3 font-bold transition-all relative
              ${activeTab === 'manage'
                ? 'text-primary'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }
            `}
          >
            <List className="w-4 h-4 inline mr-2" />
            Manage Certificates ({certificates.length})
            {activeTab === 'manage' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'upload' ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Upload Mode Selector */}
              <div className="flex gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setUploadMode('single')}
                  className={`flex-1 flex items-center justify-center gap-3 px-5 py-4 rounded-xl border-2 font-bold transition-all ${uploadMode === 'single'
                    ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300 bg-slate-800/30'
                    }`}
                >
                  <UserPlus size={20} />
                  <div className="text-left">
                    <div className="text-sm">Single Certificate</div>
                    <div className="text-[10px] font-normal opacity-60">Create one at a time</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('bulk')}
                  className={`flex-1 flex items-center justify-center gap-3 px-5 py-4 rounded-xl border-2 font-bold transition-all ${uploadMode === 'bulk'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300 bg-slate-800/30'
                    }`}
                >
                  <Users size={20} />
                  <div className="text-left">
                    <div className="text-sm">Bulk Certificates</div>
                    <div className="text-[10px] font-normal opacity-60">Upload via CSV</div>
                  </div>
                </button>
              </div>

              <AnimatePresence mode="wait">
                {uploadMode === 'single' ? (
                  /* ==================== SINGLE CERTIFICATE MODE ==================== */
                  <motion.div
                    key="single"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create Single Certificate</h2>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Event Selector */}
                        <EventSelector
                          selectedEvent={formData.workshopName}
                          onEventSelect={(name) => setFormData(prev => ({ ...prev, workshopName: name }))}
                          onEventIdChange={setSelectedEventId}
                          token={token}
                        />

                        {/* Recipient Name */}
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                            Recipient Name *
                          </label>
                          <input
                            type="text"
                            name="recipientName"
                            value={formData.recipientName}
                            onChange={handleInputChange}
                            className="block w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-slate-50 dark:bg-slate-800 dark:text-white"
                            placeholder="e.g. John Doe"
                            required
                          />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                            Recipient Email *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="block w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-slate-50 dark:bg-slate-800 dark:text-white"
                            placeholder="e.g. john@example.com"
                            required
                          />
                        </div>

                        {/* Issue Date */}
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                            Issue Date *
                          </label>
                          <input
                            type="date"
                            name="issueDate"
                            value={formData.issueDate}
                            onChange={handleInputChange}
                            className="block w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-slate-50 dark:bg-slate-800 dark:text-white"
                            required
                          />
                        </div>

                        {/* Instructor */}
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                            Instructor Name *
                          </label>
                          <input
                            type="text"
                            name="instructor"
                            value={formData.instructor}
                            onChange={handleInputChange}
                            className="block w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-slate-50 dark:bg-slate-800 dark:text-white"
                            placeholder="e.g. Dr. Emily Chen"
                            required
                          />
                        </div>

                        {/* Skills */}
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                            Skills Covered *
                          </label>
                          <div className="space-y-2">
                            {skills.map((skill, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                  type="text"
                                  value={skill}
                                  onChange={(e) => handleSkillChange(index, e.target.value)}
                                  className="flex-1 px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-slate-50 dark:bg-slate-800 dark:text-white"
                                  placeholder={`Skill ${index + 1}`}
                                />
                                {skills.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeSkillInput(index)}
                                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                                  >
                                    <X size={20} />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={addSkillInput}
                              className="flex items-center gap-2 text-primary hover:text-primary/80 font-bold transition-colors"
                            >
                              <Plus size={16} />
                              Add Another Skill
                            </button>
                          </div>
                        </div>

                        {/* Certificate Template Editor */}
                        {selectedEventId && (
                          <CertificateTemplateEditor
                            onTemplateChange={(data) => {
                              setFormData(prev => ({ ...prev, templateImage: data.image }));
                              setTemplateData(data);
                            }}
                            currentImage={formData.templateImage}
                            eventId={selectedEventId}
                            token={token}
                          />
                        )}

                        {/* Submit */}
                        <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
                          <Upload className="w-5 h-5 mr-2" />
                          {isLoading ? 'Creating...' : 'Create Certificate'}
                        </Button>
                      </form>
                    </Card>
                  </motion.div>
                ) : (
                  /* ==================== BULK CERTIFICATE MODE ==================== */
                  <motion.div
                    key="bulk"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card>
                      <h2 className="text-2xl font-bold text-white mb-2">Bulk Certificate Upload</h2>
                      <p className="text-slate-400 text-sm font-mono mb-6">
                        Upload a certificate template, position the placeholders, then upload a CSV with recipient data.
                      </p>

                      <div className="space-y-6">
                        {/* Step 1: Event Selector */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</div>
                            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Select Event</h3>
                          </div>
                          <EventSelector
                            selectedEvent={bulkEventName}
                            onEventSelect={setBulkEventName}
                            onEventIdChange={setBulkEventId}
                            token={token}
                          />
                        </div>

                        {/* Step 2: Certificate Template */}
                        {bulkEventId && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</div>
                              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Certificate Template & Placeholders</h3>
                            </div>
                            <CertificateTemplateEditor
                              onTemplateChange={(data) => setBulkTemplateData(data)}
                              currentImage={bulkTemplateData?.image}
                              eventId={bulkEventId}
                              token={token}
                            />
                          </div>
                        )}

                        {/* Step 2: CSV Upload */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">3</div>
                            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Upload CSV File</h3>
                          </div>

                          {/* CSV info box */}
                          <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-4 space-y-3">
                            <p className="text-xs text-slate-400 font-mono">Your CSV should contain these columns:</p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs font-mono">
                                <thead>
                                  <tr className="border-b border-slate-700">
                                    <th className="text-left py-2 px-3 text-slate-300">name</th>
                                    <th className="text-left py-2 px-3 text-slate-300">email</th>
                                    <th className="text-left py-2 px-3 text-slate-400">code <span className="text-slate-600">(optional)</span></th>
                                    <th className="text-left py-2 px-3 text-slate-400">skills <span className="text-slate-600">(optional)</span></th>
                                    <th className="text-left py-2 px-3 text-slate-400">instructor <span className="text-slate-600">(optional)</span></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="text-slate-500">
                                    <td className="py-1.5 px-3">John Doe</td>
                                    <td className="py-1.5 px-3">john@example.com</td>
                                    <td className="py-1.5 px-3">CODE123</td>
                                    <td className="py-1.5 px-3">React, Node</td>
                                    <td className="py-1.5 px-3">Prof. Smith</td>
                                  </tr>
                                  <tr className="text-slate-500">
                                    <td className="py-1.5 px-3">Jane Smith</td>
                                    <td className="py-1.5 px-3">jane@example.com</td>
                                    <td className="py-1.5 px-3"></td>
                                    <td className="py-1.5 px-3"></td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <p className="text-[10px] text-slate-600 font-mono">Event, date, and certificate code are set automatically.</p>
                          </div>

                          {/* CSV drop zone */}
                          {csvFile ? (
                            <div className="flex items-center gap-3 p-4 rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5">
                              <FileSpreadsheet size={24} className="text-emerald-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-emerald-300 truncate">{csvFile.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">{(csvFile.size / 1024).toFixed(1)} KB</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setCsvFile(null)}
                                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <label
                              className="flex flex-col items-center gap-2 p-8 rounded-lg border-2 border-dashed border-slate-600 hover:border-emerald-500 hover:bg-slate-800/50 cursor-pointer transition-all"
                            >
                              <FileSpreadsheet size={32} className="text-slate-500" />
                              <span className="text-sm text-slate-400 font-semibold">Click to upload CSV file</span>
                              <span className="text-[10px] text-slate-600 font-mono">.csv files only</span>
                              <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) setCsvFile(file);
                                }}
                              />
                            </label>
                          )}
                        </div>

                        {/* Summary / Submit */}
                        <div className="space-y-3 pt-2">
                          {/* Status indicators */}
                          <div className="flex flex-col gap-2 text-xs font-mono">
                            <div className="flex items-center gap-2">
                              {bulkEventName ? (
                                <CheckCircle size={14} className="text-emerald-400" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-600" />
                              )}
                              <span className={bulkEventName ? 'text-emerald-400' : 'text-slate-500'}>
                                Event selected {bulkEventName ? `(${bulkEventName})` : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {bulkTemplateData?.image ? (
                                <CheckCircle size={14} className="text-emerald-400" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-600" />
                              )}
                              <span className={bulkTemplateData?.image ? 'text-emerald-400' : 'text-slate-500'}>
                                Certificate template uploaded
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {bulkTemplateData?.image ? (
                                <CheckCircle size={14} className="text-emerald-400" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-600" />
                              )}
                              <span className={bulkTemplateData?.image ? 'text-emerald-400' : 'text-slate-500'}>
                                Name & Code placeholders positioned
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {csvFile ? (
                                <CheckCircle size={14} className="text-emerald-400" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-600" />
                              )}
                              <span className={csvFile ? 'text-emerald-400' : 'text-slate-500'}>
                                CSV file uploaded {csvFile ? `(${csvFile.name})` : ''}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={!bulkEventName || !csvFile || bulkIsLoading}
                            onClick={handleBulkSubmit}
                            className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-bold text-sm transition-all ${!bulkEventName || !csvFile || bulkIsLoading
                              ? 'bg-emerald-600/30 text-emerald-300/50 border border-emerald-500/20 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 cursor-pointer'
                              }`}
                          >
                            {bulkIsLoading ? (
                              <><Loader size={18} className="animate-spin" /> Generating Certificates...</>
                            ) : (
                              <><Upload size={18} /> Generate Bulk Certificates</>
                            )}
                          </button>
                          {bulkResult && (
                            <p className="text-center text-sm text-emerald-400 font-bold">
                              ✅ Successfully created {bulkResult.count} certificates!
                            </p>
                          )}
                          {errorMessage && uploadMode === 'bulk' && (
                            <p className="text-center text-sm text-red-400 font-bold">
                              {errorMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="manage"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {isLoadingCerts ? (
                <Card>
                  <div className="text-center py-12">
                    <Loader className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-mono">Loading certificates...</p>
                  </div>
                </Card>
              ) : certificates.length === 0 ? (
                <Card>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <List className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Certificates Yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-mono">
                      Upload your first certificate to get started
                    </p>
                  </div>
                </Card>
              ) : (() => {
                // Group certificates by event (workshopName)
                const grouped = certificates.reduce<Record<string, Certificate[]>>((acc, cert) => {
                  const key = cert.workshopName || 'Uncategorized';
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(cert);
                  return acc;
                }, {});
                const eventNames = Object.keys(grouped).sort();

                return (
                  <div className="space-y-3">
                    {eventNames.map((eventName) => {
                      const certs = grouped[eventName];
                      const isExpanded = expandedEvent === eventName;

                      return (
                        <Card key={eventName} className="overflow-hidden">
                          {/* Event header — clickable */}
                          <button
                            type="button"
                            onClick={() => setExpandedEvent(isExpanded ? null : eventName)}
                            className="w-full flex items-center gap-3 text-left group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Award size={20} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-white truncate group-hover:text-primary transition-colors">
                                {eventName}
                              </h3>
                              <p className="text-xs text-slate-500 font-mono">
                                {certs.length} certificate{certs.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="text-slate-500">
                              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            </div>
                          </button>

                          {/* Bulk actions bar */}
                          {isExpanded && (
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => handleBulkGenerate(eventName)}
                                disabled={isGenerating}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors text-xs font-bold disabled:opacity-50"
                              >
                                {isGenerating ? <Loader size={12} className="animate-spin" /> : <Award size={12} />}
                                {isGenerating ? 'Generating...' : 'Generate All'}
                              </button>
                              <button
                                onClick={() => handleDownloadZip(eventName)}
                                disabled={isDownloadingZip}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg transition-colors text-xs font-bold disabled:opacity-50"
                              >
                                {isDownloadingZip ? <Loader size={12} className="animate-spin" /> : <Download size={12} />}
                                {isDownloadingZip ? 'Zipping...' : 'Download ZIP'}
                              </button>
                              <button
                                onClick={() => handleSendAllEmails(eventName)}
                                disabled={isSendingEmails}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg transition-colors text-xs font-bold disabled:opacity-50"
                              >
                                {isSendingEmails ? <Loader size={12} className="animate-spin" /> : <Mail size={12} />}
                                {isSendingEmails ? 'Sending...' : 'Send All Emails'}
                              </button>
                              {generateResult && (
                                <span className="text-[10px] text-emerald-400 font-mono self-center">
                                  ✅ {generateResult.generated} generated, {generateResult.skipped} skipped, {generateResult.failed} failed
                                </span>
                              )}
                            </div>
                          )}

                          {/* Expanded certificate list */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {certs.map((cert) => (
                                    <div
                                      key={cert.id}
                                      className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 space-y-2"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-white truncate">{cert.recipientName}</span>
                                        <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{cert.code}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <Calendar size={12} />
                                        <span>{cert.issueDate}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs text-slate-400">
                                        <div className="flex items-center gap-2">
                                          <UserIcon size={12} />
                                          <span>{cert.email}</span>
                                        </div>
                                        {/* Email status badge */}
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cert.emailStatus === 'SENT'
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : cert.emailStatus === 'FAILED'
                                              ? 'bg-red-500/20 text-red-400'
                                              : 'bg-yellow-500/20 text-yellow-400'
                                          }`}>
                                          {cert.emailStatus === 'SENT' ? '✉ Sent' : cert.emailStatus === 'FAILED' ? '✉ Failed' : '✉ Not Sent'}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {cert.skills.map((skill, idx) => (
                                          <span
                                            key={idx}
                                            className="px-1.5 py-0.5 bg-slate-700 text-slate-300 text-[10px] rounded font-mono"
                                          >
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                      <div className="flex gap-2 mt-2">
                                        <button
                                          onClick={() => handleDownloadCertificate(cert)}
                                          className="flex-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs font-bold"
                                        >
                                          <Download size={12} />
                                          Download
                                        </button>
                                        <button
                                          onClick={() => handleSendSingleEmail(cert)}
                                          disabled={sendingEmailCertId === cert.id}
                                          className="flex-1 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs font-bold disabled:opacity-50"
                                        >
                                          {sendingEmailCertId === cert.id ? <Loader size={12} className="animate-spin" /> : <Send size={12} />}
                                          {sendingEmailCertId === cert.id ? 'Sending...' : 'Send Email'}
                                        </button>
                                        <button
                                          onClick={() => handleDelete(cert.id, cert.code)}
                                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs font-bold"
                                        >
                                          <Trash2 size={12} />
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      );
                    })}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div >
  );
};

export default AdminDashboard;
