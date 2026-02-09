import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import AnimatedSection from '../../components/ui/AnimatedSection';
import ImageUpload from '../../components/admin/ImageUpload';
import { 
  Upload, 
  List, 
  Plus, 
  X, 
  LogOut, 
  CheckCircle,
  Trash2,
  Calendar,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  saveCertificate, 
  getUploadedCertificates, 
  deleteCertificate,
  generateCertificateId 
} from '../../utils/certificateStorage';
import { Certificate } from '../../../types';

type TabType = 'upload' | 'manage';

const AdminDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    workshopName: '',
    recipientName: '',
    issueDate: '',
    instructor: '',
    templateImage: ''
  });
  const [skills, setSkills] = useState<string[]>(['']);
  const [certificates, setCertificates] = useState<Certificate[]>(getUploadedCertificates());

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!formData.workshopName || !formData.recipientName || !formData.issueDate || !formData.instructor) {
      alert('Please fill in all required fields');
      return;
    }

    const filteredSkills = skills.filter(s => s.trim() !== '');
    if (filteredSkills.length === 0) {
      alert('Please add at least one skill');
      return;
    }

    // Create certificate
    const certificate: Certificate = {
      id: generateCertificateId(),
      workshopName: formData.workshopName,
      recipientName: formData.recipientName,
      issueDate: formData.issueDate,
      instructor: formData.instructor,
      skills: filteredSkills,
      templateImage: formData.templateImage || undefined
    };

    // Save
    saveCertificate(certificate);
    
    // Show success
    setSuccessMessage(`Certificate ${certificate.id} created successfully!`);
    setTimeout(() => setSuccessMessage(''), 5000);

    // Reset form
    setFormData({
      workshopName: '',
      recipientName: '',
      issueDate: '',
      instructor: '',
      templateImage: ''
    });
    setSkills(['']);

    // Refresh certificates list
    setCertificates(getUploadedCertificates());
  };

  const handleDelete = (id: string) => {
    if (confirm(`Are you sure you want to delete certificate ${id}?`)) {
      deleteCertificate(id);
      setCertificates(getUploadedCertificates());
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
              Welcome back, <span className="font-bold text-primary">{user?.username}</span>
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
              <Card>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create New Certificate</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Workshop Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      Event/Workshop Name *
                    </label>
                    <input
                      type="text"
                      name="workshopName"
                      value={formData.workshopName}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-slate-50 dark:bg-slate-800 dark:text-white"
                      placeholder="e.g. Advanced React Patterns"
                      required
                    />
                  </div>

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

                  {/* Template Image */}
                  <ImageUpload
                    onImageSelect={(base64) => setFormData({ ...formData, templateImage: base64 })}
                    currentImage={formData.templateImage}
                  />

                  {/* Submit */}
                  <Button type="submit" size="lg" className="w-full">
                    <Upload className="w-5 h-5 mr-2" />
                    Create Certificate
                  </Button>
                </form>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="manage"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {certificates.length === 0 ? (
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
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {certificates.map((cert) => (
                    <Card key={cert.id} className="relative">
                      {cert.templateImage && (
                        <img 
                          src={cert.templateImage} 
                          alt={cert.workshopName}
                          className="w-full h-32 object-cover rounded-t-lg mb-4 -mt-6 -mx-6"
                        />
                      )}
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{cert.workshopName}</h3>
                          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">ID: {cert.id}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <UserIcon size={14} />
                          <span>{cert.recipientName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <Calendar size={14} />
                          <span>{cert.issueDate}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {cert.skills.map((skill, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded font-mono"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => handleDelete(cert.id)}
                          className="w-full mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-bold"
                        >
                          <Trash2 size={16} />
                          Delete Certificate
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;
