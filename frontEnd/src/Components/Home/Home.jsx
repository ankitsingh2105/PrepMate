

import React, { useState } from 'react';
import homeImage from "./homeImage.png";
import { useSelector } from "react-redux";
import "./Home.css";
import MockSlideOne from "../MockOptions/MockSlideOne";

export default function Home() {
    const userInfo = useSelector((state) => state.userInfo);
    const { userDetails, loading, error } = userInfo;
    const [showMocks, setShowMocks] = useState(false);
    
    const handleScheduling = () => {
        console.log("scheduled the interview");
        setShowMocks(true);
    }
    
    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50">
            <div className="container mx-auto px-4 py-12">
                <main className="flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="max-w-xl">
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                            <span className="text-purple-600">Ace</span> your interviews with peer practice
                        </h1>
                        
                        <p className="text-gray-700 mt-6 text-lg leading-relaxed">
                            Connect with like-minded candidates and practice real interview questions over video chat in a supportive, collaborative environment.
                        </p>
                        
                        <div className="mt-10 space-y-6">
                            <button 
                                onClick={handleScheduling} 
                                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full md:w-auto"
                            >
                                Schedule Practice Session
                            </button>
                            
                            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md">
                                <div>
                                    <p className="text-gray-700 font-medium">Your Credits</p>
                                    <div className="flex items-center mt-1">
                                        <span className="text-purple-600 font-bold text-xl">5</span>
                                        <span className="text-gray-500 ml-2">remaining</span>
                                    </div>
                                </div>
                                <a 
                                    href="#" 
                                    className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
                                >
                                    {!loading && userDetails?.name 
                                        ? `${userDetails.name.split(" ")[0]}, get unlimited` 
                                        : "Get unlimited sessions"}
                                </a>
                            </div>
                            
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Join 5,000+ successful candidates</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative">
                        <div className="absolute -top-6 -left-6 w-full h-full bg-purple-200 rounded-xl transform -rotate-3"></div>
                        <div className="absolute -bottom-6 -right-6 w-full h-full bg-indigo-200 rounded-xl transform rotate-3"></div>
                        <div className="relative bg-white p-2 rounded-xl shadow-xl">
                            <img 
                                src={homeImage} 
                                className="w-full h-auto max-w-md rounded-lg object-cover" 
                                alt="Person taking mock interview" 
                            />
                        </div>
                    </div>
                </main>
            </div>
            
            {/* Floating component */}
            {showMocks && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="mockSlides bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 animate-fadeIn">
                        <MockSlideOne setShowMocks={setShowMocks} showMocks={showMocks} />
                    </div>
                </div>
            )}
        </div>
    );
}
