import React from 'react';
import { Link } from 'react-router-dom';

const OrderConfirm = () => {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-semibold text-green-600 mb-4">Orderbekräftelse</h2>
      <p className="text-gray-700 mb-4">
        Tack för din beställning! Vi har mottagit din order och den behandlas nu.
      </p>
      <p className="text-gray-700 mb-4">
        En bekräftelse med detaljer om din beställning kommer att skickas till din e-postadress inom kort.
      </p>
      <div className="mt-6">
        <Link to="/dashboard" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus-shadow-outline">
          Gå tillbaka till startsidan
        </Link>
        {/* Du kan lägga till en länk till en "Mina beställningar"-sida här om du har en sådan */}
      </div>
    </div>
  );
};

export default OrderConfirm;