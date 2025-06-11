import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function ScormLauncher() {
  const { courseId, languageCode } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScormUrl = async () => {
      try {
        const response = await api.get(`/coursetobuy/${courseId}/scorm/launch/${languageCode}/`);
        if (response.data?.scorm_url) {
          window.location.href = response.data.scorm_url;
        } else {
          throw new Error('No SCORM URL received');
        }
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchScormUrl();
  }, [courseId, languageCode]);

  if (loading) {
    return <div>Loading SCORM content...</div>;
  }

  if (error) {
    return <div>Error loading SCORM content: {error.message}</div>;
  }

  return null;
}