

import React, { useState } from 'react';
import MockSlideTwo from './MockSlideTwo';

export default function MockSlideOne(props) {
  const { setShowMocks } = props;
  const [nextMock, setNextMock] = useState(false);
  const [currentMock, setCurrentMock] = useState(true);
  const [mock, setMock] = useState({});
  
  const handleNextSlideVisit = (mockType) => {
    setMock((prev) => ({ ...prev, m1: mockType }));
    setNextMock(true);
    setCurrentMock(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {currentMock ? (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-md w-full transform transition-all duration-300">
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-5">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Select Interview Type</h2>
              <button 
                onClick={() => setShowMocks(false)}
                className="text-white hover:text-purple-200 transition-colors duration-200 focus:outline-none"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-purple-200 text-sm mt-1">Choose the type of interview you want to practice</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div
              onClick={() => handleNextSlideVisit("DSA")}
              className="border border-purple-100 rounded-xl p-5 cursor-pointer hover:bg-purple-50 transition-colors duration-200 shadow-sm hover:shadow group"
            >
              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors duration-200">
                  <i className="fas fa-code text-xl text-purple-700"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">Data Structures & Algorithms</h3>
                  <p className="text-gray-600 mt-1">Practice technical coding questions, algorithms, and problem-solving skills.</p>
                  <div className="flex items-center mt-3 text-purple-700">
                    <span className="text-sm font-medium">Select this option</span>
                    <i className="fas fa-chevron-right ml-1 text-xs"></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div
              onClick={() => handleNextSlideVisit("BEH")}
              className="border border-purple-100 rounded-xl p-5 cursor-pointer hover:bg-purple-50 transition-colors duration-200 shadow-sm hover:shadow group"
            >
              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors duration-200">
                  <i className="fas fa-comments text-xl text-purple-700"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">Behavioral Interview</h3>
                  <p className="text-gray-600 mt-1">Practice answering questions about your work experiences, soft skills, and situational scenarios.</p>
                  <div className="flex items-center mt-3 text-purple-700">
                    <span className="text-sm font-medium">Select this option</span>
                    <i className="fas fa-chevron-right ml-1 text-xs"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <MockSlideTwo mock={mock} setMock={setMock} setShowMocks={setShowMocks} />
        </div>
      )}
    </div>
  );
}
