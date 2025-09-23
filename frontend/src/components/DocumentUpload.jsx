import React, { useState, useEffect } from 'react';
import api from '../services/api';

const UploadDocument = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [groups, setGroups] = useState([]); // alltid array som default
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ success: false, error: null, message: null, document_url: null });

  // Hämta grupper från backend
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Autentisering krävs');
        const response = await api.get('/groups/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (Array.isArray(response.data)) {
          setGroups(response.data);
        } else {
          setGroups([]);
        }
      } catch (err) {
        console.error('Fel vid hämtning av grupper:', err);
        setGroups([]);
      }
    };
    fetchGroups();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 10 * 1024 * 1024) {
      setSelectedFile(file);
      setUploadStatus({ success: false, error: null, message: null, document_url: null });
    } else if (file) {
      setUploadStatus({ success: false, error: 'Filstorleken överstiger 10MB', message: null, document_url: null });
    }
  };

  const handleGroupSelect = (groupId) => {
    setSelectedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile && !videoUrl) {
      setUploadStatus({ success: false, error: 'Välj en fil eller ange en video-URL', message: null, document_url: null });
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Autentisering krävs');

      const formData = new FormData();
      if (selectedFile) formData.append('document_file', selectedFile);
      if (videoUrl) formData.append('video_url', videoUrl);
      formData.append('title', title);
      selectedGroups.forEach(groupId => formData.append('groups', groupId));

      const response = await api.post('/company/documents/', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      setUploadStatus({
        success: true,
        error: null,
        message: 'Dokumentet laddades upp!',
        document_url: response.data.document_url || null
      });

      // Återställ formulär
      setSelectedFile(null);
      setTitle('');
      setVideoUrl('');
      setSelectedGroups([]);
      document.getElementById('document').value = '';
    } catch (err) {
      console.error('Fel vid uppladdning:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Fel vid uppladdning';
      setUploadStatus({ success: false, error: errorMessage, message: null, document_url: null });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Ladda upp dokument</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Titel (valfritt):</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ange dokumenttitel"
            maxLength={100}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-1">Välj fil:</label>
          <input
            type="file"
            id="document"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {selectedFile && <p className="mt-2 text-sm text-gray-600">Vald: {selectedFile.name}</p>}
        </div>

        <div>
          <label htmlFor="video" className="block text-sm font-medium text-gray-700 mb-1">Video-URL (valfritt):</label>
          <input
            type="url"
            id="video"
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            placeholder="T.ex. dold YouTube-länk"
            className="block w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Välj grupper:</label>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(groups) && groups.map(group => (
              <button
                type="button"
                key={group.id}
                onClick={() => handleGroupSelect(group.id)}
                className={`px-3 py-1 rounded-xl border border-green-600 ${
                  selectedGroups.includes(group.id) ? 'bg-blue-600 text-white' : 'bg-blue-50 text-gray-800'
                }`}
              >
                {group.name}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className={`px-6 py-2 rounded-md text-white ${uploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {uploading ? 'Laddar upp...' : 'Ladda upp'}
        </button>

        {uploadStatus.success && <p className="text-green-600 mt-2">{uploadStatus.message}</p>}
        {uploadStatus.error && <p className="text-red-600 mt-2">{uploadStatus.error}</p>}
      </form>
    </div>
  );
};

export default UploadDocument;
