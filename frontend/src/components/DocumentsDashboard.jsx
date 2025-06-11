import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { get, del } from './../services/api';

function DocumentsDashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteStatus, setDeleteStatus] = useState({ id: null, loading: false });
  const [userRole, setUserRole] = useState(null);
  const token = localStorage.getItem('token');

  // Check user role on component mount
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('userData from localStorage:', userData); // Felsökning
    // Använd isAdmin istället för is_admin, baserat på din användardata
    if (userData && userData.isAdmin === true) {
      setUserRole('is_admin');
    } else {
      setUserRole(null);
    }
    console.log('userRole set to:', userData.isAdmin ? 'is_admin' : null); // Felsökning
  }, []);

  // Memoize filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc =>
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    );
  }, [searchTerm, documents]);

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

  useEffect(() => {
    fetchCompanyDocuments();
  }, [fetchCompanyDocuments]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

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

  const formatDate = (dateString) => {
    if (!dateString) return 'Ogiltigt datum';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('sv-SE', options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Hämtar dokument...</span>
      </div>
    );
  }

  if (error) {
    return (
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
            <button
              onClick={fetchCompanyDocuments}
              className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
            >
              Försök igen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Dina Dokument</h2>
        <div className="w-full sm:w-64">
          <label htmlFor="search" className="sr-only">
            Sök dokument
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              placeholder="Sök efter titel..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      {filteredDocuments.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {filteredDocuments.map((doc, index) => (
            <li
              key={doc.id}
              className={`py-4 ${index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pl-3 pr-3">
                <div className="flex-1 min-w-0">
                  <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                    <p
                      className={`text-sm font-medium ${
                        doc.title ? 'text-gray-900' : 'text-gray-500 italic'
                      } truncate`}
                    >
                      {doc.title || 'Namnlöst dokument'}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 mt-1 sm:mt-0">
                      <svg
                        className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Uppladdat: {formatDate(doc.uploaded_at)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 sm:mt-0 flex space-x-3">
                  {doc.document_url && (
                    <a
                      href={doc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Öppna
                    </a>
                  )}
                  {userRole === 'is_admin' && (
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      disabled={deleteStatus.id === doc.id && deleteStatus.loading}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {deleteStatus.id === doc.id && deleteStatus.loading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Tar bort...
                        </>
                      ) : (
                        'Ta bort'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {documents.length > 0 ? 'Inga dokument matchar din sökning' : 'Inga dokument hittades'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {documents.length > 0 ? 'Försök med en annan sökterm' : 'Börja med att ladda upp ett dokument'}
          </p>
        </div>
      )}
    </div>
  );
}

export default DocumentsDashboard;