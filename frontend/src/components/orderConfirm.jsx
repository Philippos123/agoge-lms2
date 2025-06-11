import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../services/api';

const OrderConfirm = () => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestOrder = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await get('/orders/latest/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrderDetails(response);
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("Could not load order details. Please check your order history later.");
      } finally {
        setLoading(false);
      }
    };

    fetchLatestOrder();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        {/* Confirmation Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center space-x-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h2 className="text-3xl font-bold">Orderbekräftelse</h2>
              <p className="text-green-100">Din beställning är mottagen!</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-red-700">{error}</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-lg text-gray-700">
                  Tack för din beställning! Vi har mottagit din order och den behandlas nu.
                </p>
                <p className="text-gray-600">
                  En bekräftelse med detaljer om din beställning har skickats till din e-postadress.
                </p>
              </div>

              {orderDetails && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 text-gray-800">Orderinformation</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ordernummer:</span>
                      <span className="font-medium">#{orderDetails.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Datum:</span>
                      <span>{new Date(orderDetails.created_at).toLocaleDateString('sv-SE')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kurs:</span>
                      <span className="font-medium">{orderDetails.course_title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Språk:</span>
                      <span>{orderDetails.languages.join(', ')}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                      <span className="text-gray-600 font-medium">Totalt pris:</span>
                      <span className="text-green-600 font-bold">{orderDetails.total_price} kr</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <h4 className="font-medium text-blue-800 mb-2">Nästa steg</h4>
                <p className="text-blue-700">
                  Du kommer att få ytterligare information via e-post när din kurs är redo att börja.
                  Om du har några frågor kan du alltid kontakta vår support.
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link 
              to="/dashboard" 
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg text-center transition-colors"
            >
              Tillbaka till startsidan
            </Link>
            <Link 
              to="/my-orders" 
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-3 px-6 rounded-lg text-center transition-colors"
            >
              Visa alla mina beställningar
            </Link>
          </div>
        </div>

        {/* Support Info */}
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-800 mb-2">Behöver du hjälp?</h4>
          <p className="text-gray-600 mb-3">
            Vår kundservice är här för att hjälpa dig med alla frågor om din beställning.
          </p>
          <div className="flex items-center text-blue-600">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <a href="tel:+46123456789" className="hover:underline">08-123 456 789</a>
          </div>
          <div className="flex items-center text-blue-600 mt-1">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <a href="mailto:support@example.com" className="hover:underline">support@example.com</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirm;