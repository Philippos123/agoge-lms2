import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { get, del } from './../services/api';

function DocumentsDashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteStatus, setDeleteStatus] = useState({ id: null, loading: false });
  const [userRole, setUserRole] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, documents, videos
  const token = localStorage.getItem('token');

  /** ---------- Hjälpfunktioner ---------- **/
  const isVideoUrl = (url) => {
    return url && (url.includes('youtube.com') || url.includes('vimeo.com') || url.match(/\.(mp4|webm|ogg)$/i));
  };

  const isVideo = (document) => {
    return !!document.video_url || isVideoUrl(document.media_url);
  };

  const getFileExtension = (url) => {
    if (!url) return '';
    const match = url.match(/\.([^.?#]+)(?:\?|#|$)/i);
    return match ? match[1].toLowerCase() : '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Ogiltigt datum';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('sv-SE', options);
  };

  const getDocumentIcon = (document) => {
    if (isVideo(document)) {
      return (
        <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 55 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
          <path d="m10 12 5-3-5-3v6z"/>
        </svg>
      );
    }

    const extension = getFileExtension(document.media_url);
    if (['pdf'].includes(extension)) {
      return (
        <svg className="h-8 w-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
        </svg>
      );
    } else if (['doc', 'docx'].includes(extension)) {
      return (
        <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
        </svg>
      );
    } else if (['xls', 'xlsx'].includes(extension)) {
      return (
        <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
        </svg>
      );
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return (
        <svg className="h-8 w-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
        </svg>
      );
    }

    return (
      <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
      </svg>
    );
  };

  const getVideoCount = () => documents.filter(doc => isVideo(doc)).length;
  const getDocumentCount = () => documents.filter(doc => !isVideo(doc)).length;

  /** ---------- API Calls ---------- **/
  const fetchCompanyDocuments = useCallback(async () => {
    if (!token) {
      setError('Ingen autentiseringstoken hittades.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await get('/company/documents/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(response || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Kunde inte hämta dokument.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Är du säker på att du vill ta bort detta dokument?')) return;

    setDeleteStatus({ id: documentId, loading: true });
    try {
      await del(`/company/documents/${documentId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (err) {
      console.error('Fel vid borttagning av dokument:', err);
      setError(err.response?.data?.message || 'Kunde inte ta bort dokumentet.');
    } finally {
      setDeleteStatus({ id: null, loading: false });
    }
  };

  /** ---------- User Role ---------- **/
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData && userData.isAdmin === true) {
      setUserRole('is_admin');
    } else {
      setUserRole(null);
    }
  }, []);

  /** ---------- Filtered Documents ---------- **/
  const filteredDocuments = useMemo(() => {
    let filtered = documents.filter(doc =>
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterType === 'videos') filtered = filtered.filter(doc => isVideo(doc));
    else if (filterType === 'documents') filtered = filtered.filter(doc => !isVideo(doc));

    return filtered;
  }, [searchTerm, documents, filterType]);

  useEffect(() => {
    fetchCompanyDocuments();
  }, [fetchCompanyDocuments]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (type) => setFilterType(type);

  /** ---------- Render ---------- **/
  if (loading) return (
    <div className="flex justify-center items-center h-32">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-gray-600">Hämtar dokument...</span>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchCompanyDocuments} className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium">Försök igen</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0">
        <h2 className="text-2xl font-bold text-gray-800">Dina Dokument</h2>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${filterType==='all'?'bg-blue-600 text-white':'bg-white text-gray-700 hover:bg-gray-50'}`}>
              Alla ({documents.length})
            </button>
            <button
              onClick={() => handleFilterChange('documents')}
              className={`px-4 py-2 text-sm font-medium border-l transition-colors duration-150 ${filterType==='documents'?'bg-blue-600 text-white':'bg-white text-gray-700 hover:bg-gray-50'}`}>
              Dokument ({getDocumentCount()})
            </button>
            <button
              onClick={() => handleFilterChange('videos')}
              className={`px-4 py-2 text-sm font-medium border-l transition-colors duration-150 ${filterType==='videos'?'bg-blue-600 text-white':'bg-white text-gray-700 hover:bg-gray-50'}`}>
              Videor ({getVideoCount()})
            </button>
          </div>

          <div className="w-full sm:w-64 relative">
            <input
              type="text"
              placeholder="Sök efter titel..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0">{getDocumentIcon(doc)}</div>
                  <div className="ml-3 flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{doc.title || 'Namnlöst dokument'}</h3>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      {formatDate(doc.uploaded_at)}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2">
                  {(doc.media_url || doc.video_url) && (
                    <a href={doc.video_url || doc.media_url} target="_blank" rel="noopener noreferrer"
                       className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150">
                      {isVideo(doc) ? 'Spela video' : 'Öppna dokument'}
                    </a>
                  )}

                  {userRole === 'is_admin' && (
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      disabled={deleteStatus.id === doc.id && deleteStatus.loading}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-75 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      {deleteStatus.id === doc.id && deleteStatus.loading ? 'Tar bort...' : 'Ta bort'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {documents.length > 0 ? 'Inga dokument matchar din sökning eller filter' : 'Inga dokument hittades'}
          </h3>
          {(searchTerm || filterType !== 'all') && documents.length > 0 && (
            <button onClick={() => { setSearchTerm(''); setFilterType('all'); }} className="mt-3 text-blue-600 hover:text-blue-500 text-sm font-medium">
              Rensa filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default DocumentsDashboard;
