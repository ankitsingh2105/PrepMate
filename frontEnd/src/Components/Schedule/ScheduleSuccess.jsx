import React from 'react'
import { useState } from 'react';
export default function ScheduleSuccess({ mockType, timeSlot, infoDisplay }) {
    const [mock, setMock] = useState(mockType == "DSA" ? "Data Structures & Algorithms" : "Behavioural")
    const backToSchedule  = () =>{
        infoDisplay.current.style.display = "none";
    }
    return (
        <div className="flex items-center justify-center bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <div onClick={backToSchedule} className="flex justify-between items-center">
                    <div></div>
                    <i className="text-purple-600 fas fa-times cursor-pointer"></i>
                </div>
                <div className="flex justify-center mb-4">
                    <i className="fas fa-check-circle text-3xl text-green-500"></i>
                </div>
                <h2 className="text-center text-xl font-semibold mb-4">Your interview is confirmed!

                </h2>
                <div className="space-y-4">
                    <div className=" border-2 p-2 rounded-md flex items-center space-x-2">
                        <i className="far fa-clock text-lg text-gray-600"></i>
                        <p className="text-gray-700">Your <strong>{mock}</strong> interview is on <strong>{timeSlot.time}, {timeSlot.date}</strong>. <a href="#" className="text-blue-500">Add to your calendar</a> so you don't forget.</p>
                    </div>
                    <div className=" border-2 p-2 rounded flex items-center space-x-2">
                        <i className="fas fa-shield-alt text-lg text-gray-600"></i>
                        <p className="text-gray-700">Be respectful to your partner. Please arrive on time and take turns.</p>
                    </div>
                    <div className=" border-2 p-2 rounded flex items-center space-x-2">
                        <i className="fas fa-microphone text-lg text-gray-600"></i>
                        <p className="text-gray-700">Make sure you have a working camera and microphone.</p>
                    </div>
                </div>
                <div className="flex justify-between mt-6">
                    <button className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg">Add to Calendar</button>
                    <button onClick={backToSchedule} className="bg-blue-600 text-white py-2 px-4 rounded-lg">Schedule another</button>
                </div>
            </div>
        </div>
    );
}
