import React, { useState, useEffect } from 'react';
import { get, } from './../services/api'; // Importera 'del' för att göra DELETE-anrop

function DocumentsDashboard() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem('token');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredDocuments, setFilteredDocuments] = useState([]);

    useEffect(() => {
        const fetchCompanyDocuments = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await get('/company/documents/', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                setDocuments(response);
            } catch (err) {
                setError(err.message || 'Kunde inte hämta dokument.');
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyDocuments();
    }, [token]);

    useEffect(() => {
        // Filtrera dokumenten när söktermen eller dokumentlistan ändras
        const results = documents.filter(doc =>
            doc.title && doc.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredDocuments(results);
    }, [searchTerm, documents]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleDeleteDocument = async (documentId) => {
        const confirmed = window.confirm('Är du säker på att du vill ta bort detta dokument?');
        if (confirmed) {
            try {
                await del(`/company/documents/${documentId}/`, { // Använd 'del' och korrekt endpoint
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                // Uppdatera dokumentlistan genom att filtrera bort det raderade dokumentet
                setDocuments(documents.filter(doc => doc.id !== documentId));
            } catch (err) {
                console.error('Fel vid borttagning av dokument:', err);
                setError('Kunde inte ta bort dokumentet.');
            }
        }
    }

    if (loading) {
        return <p className="text-gray-500 italic">Hämtar dokument...</p>;
    }

    if (error) {
        return <p className="text-red-500 font-bold">Fel: {error}</p>;
    }

    return (
        <div className="mt-5 p-4 border border-gray-300 rounded-md bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Dina Dokument</h2>

            {/* Sökfält */}
            <div className="mb-4">
                <label htmlFor="search" className="block text-gray-700 text-sm font-bold mb-2">
                    Sök dokument:
                </label>
                <input
                    type="text"
                    id="search"
                    placeholder="Sök efter titel..."
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>

            {filteredDocuments.length > 0 ? (
                <ul className="list-none p-0">
                    {filteredDocuments.map(doc => (
                        <li key={doc.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                            <span className="flex flex-col">
                                <span className={doc.title ? "text-gray-700" : "text-gray-500 italic"}>
                                    {doc.title || 'Inget namn'}
                                </span>
                                <span className="text-sm text-gray-500 mt-1">
                                    Uppladdat: {new Date(doc.uploaded_at).toLocaleDateString()}
                                </span>
                            </span>
                            <div className="flex items-center space-x-2">
                                {doc.document && (
                                    <a
                                        href={doc.document}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-gradient-to-r from-blue-800 to-blue-400 hover:text-lg duration-400 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
                                    >
                                        Visa dokument
                                    </a>
                                )}
                                <button
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="bg-gradient-to-l from-pink-800 to-red-400 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
                                >
                                    Ta bort
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 italic">{documents.length > 0 ? 'Inga dokument matchar din sökning.' : 'Inga dokument har laddats upp ännu.'}</p>
            )}
        </div>
    );
}

export default DocumentsDashboard;