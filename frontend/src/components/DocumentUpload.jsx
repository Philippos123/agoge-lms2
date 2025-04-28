import React, { useState } from 'react';
import { uploadDocument } from './../services/api';

const UploadDocument = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleTitleChange = (event) => {
    setTitle(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      alert('Välj en fil att ladda upp.');
      return;
    }

    setUploading(true);
    setUploadSuccess(false);
    setUploadError(null);

    const formData = new FormData();
    formData.append('document', selectedFile);
    if (title) {
      formData.append('title', title);
    }

    const token = localStorage.getItem('token');

    try {
      const response = await uploadDocument(title, selectedFile, token);
      console.log('Dokument uppladdat:', response);
      setUploadSuccess(true);
      // Hantera framgångsrikt uppladdning (t.ex., visa meddelande, rensa formulär)
    } catch (error) {
      console.error('Fel vid uppladdning:', error);
      setUploadError(error.message || 'Något gick fel vid uppladdningen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-5 p-4 border border-gray-300 rounded-md bg-gray-50">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Ladda upp dokument</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
            Titel (valfritt):
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={handleTitleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div>
          <label htmlFor="document" className="block text-gray-700 text-sm font-bold mb-2">
            Välj fil:
          </label>
          <input
            type="file"
            id="document"
            onChange={handleFileChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <button
          type="submit"
          className={`bg-gradient-to-r from-blue-600 to-blue-400 hover:text-lg duration-500 text-white font-bold py-2 px-4 cursor-pointer rounded focus:outline-none focus:shadow-outline ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={uploading}
        >
          {uploading ? 'Laddar upp...' : 'Ladda upp'}
        </button>
        {uploadSuccess && <p className="text-green-500 font-semibold mt-2">Dokument uppladdat!</p>}
        {uploadError && <p className="text-red-500 font-semibold mt-2">Fel: {uploadError}</p>}
      </form>
    </div>
  );
};

export default UploadDocument;