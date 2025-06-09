

import React from 'react';
import './mock.css';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

export default function MockSlideTwo({ setShowMocks, mock, setMock }) {
  const navigate = useNavigate();

  const handleRoundWithFriends = (event) => {
    event.stopPropagation(); // Stop propagation to avoid unwanted navigation
    const roundType = mock.m1;
    const roomID = generateRandomString();
    if (roundType === 'BEH') {
      navigate(`/behMock/room/${roomID}`);
      return;
    }
    navigate(`/dsaMock/room/${roomID}`);
  };

  const handleRoundWithPeers = (event) => {
    event.stopPropagation(); // Stop propagation here as well
    if (mock.m1 === 'DSA') {
      navigate('/schedule', { state: { mockType: 'DSA' } });
      return;
    }
    navigate('/schedule', { state: { mockType: 'BEH' } });
  };

  function generateRandomString() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return result;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-md w-full">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-5">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Select Practice Type</h2>
            <button 
              onClick={() => setShowMocks(false)}
              className="text-white hover:text-purple-200 transition-colors duration-200 focus:outline-none"
              aria-label="Close"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>
          <p className="text-purple-200 text-sm mt-1">
            Choose how you'd like to practice your {mock.m1 === 'DSA' ? 'DSA' : 'Behavioral'} interview
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          <div
            onClick={(e) => handleRoundWithPeers(e)}
            className="border border-purple-100 rounded-xl p-5 cursor-pointer hover:bg-purple-50 transition-colors duration-200 shadow-sm hover:shadow group"
          >
            <div className="flex items-start space-x-4">
              <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors duration-200">
                <i className="fas fa-users text-xl text-purple-700"></i>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-800">Practice with peers</h3>
                <p className="text-gray-600 mt-1">
                  Schedule mock interviews with other users where you take turns asking questions and providing feedback.
                </p>
                <div className="flex items-center mt-3 text-purple-700">
                  <span className="text-sm font-medium">Schedule a session</span>
                  <i className="fas fa-chevron-right ml-1 text-xs"></i>
                </div>
              </div>
            </div>
          </div>
          
          <div
            onClick={(e) => handleRoundWithFriends(e)}
            className="border border-purple-100 rounded-xl p-5 cursor-pointer hover:bg-purple-50 transition-colors duration-200 shadow-sm hover:shadow group"
          >
            <div className="flex items-start space-x-4">
              <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors duration-200">
                <i className="fas fa-user-friends text-xl text-purple-700"></i>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-800">Practice with a friend</h3>
                <p className="text-gray-600 mt-1">
                  Generate a private room link to invite a friend and practice on your own schedule at any time.
                </p>
                <div className="flex items-center mt-3 text-purple-700">
                  <span className="text-sm font-medium">Create a private room</span>
                  <i className="fas fa-chevron-right ml-1 text-xs"></i>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              {mock.m1 === 'DSA' ? 
                'Practice coding problems and algorithms ' : 
                'Improve your communication skills and prepare for behavioral questions'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
