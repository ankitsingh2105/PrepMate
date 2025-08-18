

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import links from "../../connect";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import io from "socket.io-client";
import { handleUserInfo } from "../Redux/Slices/userInfoSlice";

export default function Navbar() {
    const navigate = useNavigate();
    const { backEndLink } = links;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // redux related 
    const dispatch = useDispatch();
    const userInfo = useSelector((state) => state.userInfo);
    const { userDetails, loading } = userInfo;

    useEffect(() => {
        dispatch(handleUserInfo());
    }, [dispatch]);

    const handleLogout = async () => {
        try {
            await axios.get(`${backEndLink}/user/logout`, {
                withCredentials: true
            });
            window.location.reload();
        }
        catch (error) {
            console.log("Logout error:", error);
        }
    };

    const navigateToProfile = () => {
        navigate(`/user/profile/${userDetails.userName}`, {
            replace: true
        });
        window.location.reload();
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-2 rounded-lg mr-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                </svg>
                            </div>
                            <span 
                                onClick={() => { navigate("/") }} 
                                className="cursor-pointer text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text"
                            >
                                PrepMate
                            </span>
                        </div>
                        
                    </div>
                    
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        {!loading && userDetails?.name ? (
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <button 
                                        onClick={toggleMenu}
                                        className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                    >
                                        <span className="sr-only">Open user menu</span>
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white font-medium">
                                            {userDetails.name[0]}
                                        </div>
                                    </button>
                                    
                                    {isMenuOpen && (
                                        <div className="origin-bottom-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                            <div className="px-4 py-2 text-sm text-gray-700 border-b">
                                                <p className="font-medium text-gray-900">Welcome,</p>
                                                <p>{userDetails.name}</p>
                                            </div>
                                            <a 
                                                href="#" 
                                                onClick={navigateToProfile}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Your Profile
                                            </a>
                                            <a 
                                                href="#" 
                                                onClick={handleLogout}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Sign out
                                            </a>
                                        </div>
                                    )}
                                </div>
                                
                                <span className="hidden md:inline-block text-sm font-medium text-gray-700">
                                    Welcome, <span className="font-semibold text-purple-600">{userDetails.name.split(" ")[0]}</span>
                                </span>
                                
                                <button 
                                    onClick={handleLogout}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <button 
                                    onClick={() => navigate("/login")}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                >
                                    Login
                                </button>
                                <button 
                                    onClick={() => navigate("/signup")}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                >
                                    Sign Up
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Mobile menu button */}
                    <div className="flex items-center sm:hidden">
                        <button 
                            onClick={toggleMenu}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMenuOpen ? (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu, show/hide based on menu state */}
            {isMenuOpen && (
                <div className="sm:hidden">
                    
                    {!loading && userDetails?.name ? (
                        <div className="pt-4 pb-3 border-t border-gray-200">
                            <div className="flex items-center px-4">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white font-medium">
                                        {userDetails.name[0]}
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <div className="text-base font-medium text-gray-800">{userDetails.name}</div>
                                    <div className="text-sm font-medium text-gray-500">{userDetails.email || userDetails.userName}</div>
                                </div>
                            </div>
                            <div className="mt-3 space-y-1">
                                <a 
                                    href="#" 
                                    onClick={navigateToProfile}
                                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                                >
                                    Your Profile
                                </a>
                                <a 
                                    href="#" 
                                    onClick={handleLogout}
                                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                                >
                                    Sign out
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="pt-4 pb-3 border-t border-gray-200">
                            <div className="space-y-1 px-4">
                                <button 
                                    onClick={() => navigate("/login")}
                                    className="w-full text-left block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                                >
                                    Login
                                </button>
                                <button 
                                    onClick={() => navigate("/signup")}
                                    className="w-full text-left block px-4 py-2 text-base font-medium text-purple-600 hover:text-purple-800 hover:bg-gray-100"
                                >
                                    Sign Up
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}
