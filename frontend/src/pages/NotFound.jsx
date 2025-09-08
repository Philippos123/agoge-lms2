import Navbar from "../components/navbar";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 text-center">
        <h1 className="text-6xl font-bold text-red-600">404</h1>
        <p className="text-xl mt-4 text-gray-700">Oj! Sidan du letar efter kunde inte hittas.</p>
        <Link
          to="/"
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
        >
          Tillbaka till startsidan
        </Link>
      </div>
    </>
  );
}
