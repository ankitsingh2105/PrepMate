import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import links from "../../connect";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { handleUserInfo } from "../Redux/Slices/userInfoSlice";
import { Bell } from "lucide-react"; // notification bell icon

export default function Navbar() {
  const navigate = useNavigate();
  const { backEndLink } = links;
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.userInfo);
  const { userDetails, loading } = userInfo;

  useEffect(() => {
    dispatch(handleUserInfo());
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      await axios.get(`${backEndLink}/user/logout`, { withCredentials: true });
      sessionStorage.setItem("isLoggedIn", false);
      window.location.reload();
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const toggleNotifications = async () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  useEffect(() => {
    const findMyNotifications = async () => {
      try {
        const res = await axios.get(`${backEndLink}/user/getNotifications`, {
          withCredentials: true,
        });
        console.log("notifications :: ", res.data.notifications);
        setNotifications(res.data.notifications);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    findMyNotifications();
  }, []);

  const goToProfile = () => {
    if (userDetails?.userName) {
      navigate(`/user/profile/${userDetails.userName}`, { replace: true });
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span
              onClick={() => navigate("/")}
              className="cursor-pointer text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text"
            >
              PrepMate
            </span>
          </div>

          {/* Right Side */}
          <div className="hidden sm:flex sm:items-center">
            {!loading && userDetails?.name ? (
              <div className="flex items-center space-x-4 relative">
                {/* Notification Bell */}
                <button
                  onClick={toggleNotifications}
                  className="relative p-2 rounded-full hover:bg-gray-100"
                >
                  <Bell className="w-6 h-6 text-gray-600" />
                  {notifications.length > 0 && (
                    <span className="font-bold absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1">
                      {notifications.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={goToProfile}
                  className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white font-medium"
                >
                  {userDetails.name[0]}
                </button>

                {/* Notification Dropdown */}
                {isNotificationOpen && (
                  <div className="p-4 absolute right-12 top-11 w-80 bg-white shadow-lg rounded-lg overflow-hidden z-50">
                    <div className=" p-2 bg-gray-100 font-medium text-purple-700">
                      Notifications
                    </div>
                    {notifications.length > 0 ? (
                      <ul className="max-h-60 overflow-y-auto">
                        {notifications.map((notif, idx) => (
                          <li
                            key={idx}
                            className="font-bold p-4 text-sm border-b hover:bg-gray-50"
                          >
                            <p className="font-semibold">{notif.title}</p>
                            <p className="text-gray-600">{notif.message}</p>
                            <span className="text-xs text-gray-400">
                              {new Date(notif.createdAt).toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-2 text-gray-500 text-sm">
                        No notifications
                      </div>
                    )}
                  </div>
                )}

                {/* Welcome Text */}
                <span className="hidden md:inline-block text-sm font-medium text-gray-700">
                  Welcome,{" "}
                  <span className="font-semibold text-purple-600">
                    {userDetails.name.split(" ")[0]}
                  </span>
                </span>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-2 border rounded-md"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
