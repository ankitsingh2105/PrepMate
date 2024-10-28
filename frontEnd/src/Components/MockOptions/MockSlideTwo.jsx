import React from 'react'
import "./mock.css"
export default function MockSlideTwo({ setShowMocks, mock, setMock }) {
    console.log(mock);
    return (
        <div className="mockSlides2 flex items-center justify-center">

            <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Select your practice type</h2>
                    <i onClick={() => setShowMocks(false)} className="text-purple-600 fas fa-times cursor-pointer"></i>
                </div>

                <div className="space-y-4">
                    <div className="border-2 rounded-lg p-4 cursor-pointer">
                        <div className="flex items-center space-x-3">
                            <i className="text-purple-600 fas fa-users text-xl"></i>
                            <div>
                                <h3 className="font-semibold">Practice with peers</h3>
                                <p className="text-sm text-gray-500">Free mock interviews with other Exponent users where you take turns asking questions.</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer">
                        <div className="flex items-center space-x-3">
                            <i className="text-purple-600 fas fa-user-friends text-xl"></i>
                            <div>
                                <h3 className="font-semibold">Practice with a friend</h3>
                                <p className="text-sm text-gray-500">Invite a friend and practice on your own schedule at any time.</p>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    )
}
