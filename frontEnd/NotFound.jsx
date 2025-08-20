import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mt-10 flex flex-col items-center justify-center   from-indigo-50 to-purple-100 text-center p-4">
      {/* Big 404 */}
      <h1 className="text-7xl sm:text-9xl font-extrabold text-indigo-600 mb-4">
        404
      </h1>
      <p className="text-xl sm:text-2xl text-gray-700 mb-8">
        Oops! The page you’re looking for doesn’t exist.
      </p>

      {/* Buttons */}
      <div className="flex space-x-4">
        <Link
          to="/login"
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition"
        >
          Login
        </Link>
        <Link
          to="/signup"
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl shadow-md hover:bg-gray-300 transition"
        >
          Signup
        </Link>
      </div>
    </div>
  );
}
