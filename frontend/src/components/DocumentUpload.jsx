import React, { useState } from 'react';
import { uploadDocument } from './../services/api';

const UploadDocument = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({
    success: false,
    error: null,
    message: null,
    document_url: null
  });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validera filstorlek (t.ex. 10MB gräns)
      if (file.size > 10 * 1024 * 1024) {
        setUploadStatus({
          success: false,
          error: 'Filstorleken överstiger gränsen på 10MB',
          message: null,
          document_url: null
        });
        return;
      }
      setSelectedFile(file);
      setUploadStatus({ success: false, error: null, message: null, document_url: null });
    }
  };

  const handleTitleChange = (event) => {
    setTitle(event.target.value);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    // Återställ filinmatning
    document.getElementById('document').value = '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setUploadStatus({
        success: false,
        error: 'Välj en fil att ladda upp',
        message: null,
        document_url: null
      });
      return;
    }

    setUploading(true);
    setUploadStatus({ success: false, error: null, message: null, document_url: null });

    const token = localStorage.getItem('token');
    if (!token) {
      setUploading(false);
      setUploadStatus({
        success: false,
        error: 'Autentisering krävs. Vänligen logga in.',
        message: null,
        document_url: null
      });
      return;
    }

    try {
      const response = await uploadDocument(title, selectedFile, token);
      setUploadStatus({
        success: true,
        error: null,
        message: 'Dokumentet laddades upp framgångsrikt!',
        document_url: response.document_url
      });
      resetForm();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Ett fel uppstod vid uppladdning';
      setUploadStatus({
        success: false,
        error: errorMessage,
        message: null,
        document_url: null
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Ladda upp dokument</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Titel (valfritt):
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={handleTitleChange}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ange dokumenttitel"
            maxLength={100}
            aria-describedby="titleHelp"
          />
          <p id="titleHelp" className="mt-1 text-sm text-gray-500">
            Max 100 tecken
          </p>
        </div>

        <div>
          <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-1">
            Välj fil:
          </label>
          <input
            type="file"
            id="document"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
            aria-describedby="fileHelp"
          />
          <p id="fileHelp" className="mt-1 text-sm text-gray-500">
            Stödda format: PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX (max 10MB)
          </p>
          {selectedFile && (
            <p className="mt-2 text-sm text-gray-600">
              Vald: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <button
            type="submit"
            disabled={uploading}
            className={`px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              uploading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            aria-busy={uploading}
          >
            {uploading ? 'Laddar upp...' : 'Ladda upp'}
          </button>
          
          {uploadStatus.success && (
            <p className="text-sm text-green-600 font-medium">
              {uploadStatus.message}
            </p>
          )}
          
          {uploadStatus.error && (
            <p className="text-sm text-red-600 font-medium">
              Fel: {uploadStatus.error}
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default UploadDocument;