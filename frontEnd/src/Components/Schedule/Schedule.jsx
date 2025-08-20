

import React, { useEffect, useRef, useState } from 'react';
import { ToastContainer, toast } from "react-toastify";
import { FiCalendar, FiClock, FiCheck, FiLoader } from "react-icons/fi";
import axios from "axios";
import { useSelector } from "react-redux";
import { useLocation } from 'react-router-dom';
import ScheduleSuccess from './ScheduleSuccess';
import link from "../../connect";

export default function Schedule() {
  const location = useLocation();
  const mockType = location.state?.mockType;
  const infoDisplay = useRef(null);

  const [timeArray, setTimeArray] = useState([]);
  const [timeSlot, setTimeSlot] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const timeSlots = [
    "9:30 AM",
    "11:30 AM",
    "1:30 PM",
    "3:30 PM",
    "5:30 PM",
    "7:30 PM",
    "9:30 PM"
  ];

  const userInfo = useSelector((state) => state.userInfo);
  const { userDetails, loading } = userInfo;

  // Format date to be more user-friendly
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Get day name (e.g., "Today", "Tomorrow", or day of week)
  const getDayName = (dateString) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const date = new Date(dateString);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
  };

  function getNextFourDays() {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 4; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i + 1);
      dates.push(nextDate.toDateString());
    }
    setTimeArray(dates);
  }

  useEffect(() => {
    getNextFourDays();
  }, []);

  const timeAndDateSchedule = ({ date, time }) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setTimeSlot({ date, time });

    toast.info(
      <div className="flex flex-col">
        <span className="font-medium">Selected slot:</span>
        <span>{formatDate(date)} at {time}</span>
      </div>,
      { autoClose: 2000 }
    );
  };

  const checkAvailability = async () => {
    if (!timeSlot.time) {
      toast.error("Please select a time slot", { autoClose: 1000 });
      return;
    }

    setIsLoading(true);
    const { backEndLink } = link;

    try {
      const response = await axios.post(
        `${backEndLink}/user/checkAvailability`,
        {
          mockType,
          timeSlot,
          userId: userDetails._id
        },
        { withCredentials: true }
      );
      console.log(response.data);
      if (response.data.code == 1) {
        toast.warning(`${response.data.message}`, { autoClose: 2000 });
      }
      else if(response.data.code == 2){
        toast.success(`${response.data.message}`, { autoClose: 2000 });
      }
      else{
        toast.info(`${response.data.message}`, { autoClose: 4000 });
      }
      return;
    }
    catch (error) {
      toast.error("Please login to continue", { autoClose: 2000 });
    } 
    finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 py-10 px-4 sm:px-6 lg:px-8">
      <ToastContainer position="bottom-right" />

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-800">
            Schedule Your {mockType === "DSA" ? "DSA" : "Behavioral"} Mock Interview
          </h1>
          <p className="mt-2 text-gray-600">
            Choose a convenient time slot for your practice session
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-100">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex items-center">
            <FiCalendar className="text-white text-2xl mr-3" />
            <div>
              <h2 className="text-xl font-bold text-white">Select a Time Slot</h2>
              <p className="text-purple-100 text-sm">All times shown in your local timezone (IST)</p>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-700 flex items-center">
                  <FiCalendar className="mr-2 text-purple-600" />
                  Select Date
                </h3>

                <div className="space-y-2">
                  {timeArray.map((date) => (
                    <div
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 flex justify-between items-center ${selectedDate === date
                        ? 'bg-purple-100 border-purple-500 shadow-sm'
                        : 'hover:bg-purple-50 border-gray-200'
                        }`}
                    >
                      <div>
                        <div className="font-medium text-gray-800">{formatDate(date)}</div>
                        <div className="text-sm text-gray-500">{getDayName(date)}</div>
                      </div>

                      {selectedDate === date && (
                        <div className="h-6 w-6 bg-purple-600 rounded-full flex items-center justify-center">
                          <FiCheck className="text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Time selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-700 flex items-center">
                  <FiClock className="mr-2 text-purple-600" />
                  Select Time
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((time) => (
                    <div
                      key={time}
                      onClick={() => selectedDate && timeAndDateSchedule({ date: selectedDate, time })}
                      className={`p-3 border rounded-lg text-center cursor-pointer transition-all duration-200 ${selectedTime === time && selectedDate
                        ? 'bg-purple-100 border-purple-500 shadow-sm'
                        : 'hover:bg-purple-50 border-gray-200'
                        } ${!selectedDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="font-medium">{time}</span>
                    </div>
                  ))}
                </div>

                {!selectedDate && (
                  <p className="text-sm text-amber-600 mt-2">
                    Please select a date first
                  </p>
                )}
              </div>
            </div>

            {/* Selected slot summary */}
            {timeSlot.date && timeSlot.time && (
              <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <h4 className="font-medium text-purple-800">Selected Slot</h4>
                <p className="text-gray-700">
                  {formatDate(timeSlot.date)} at {timeSlot.time}
                </p>
              </div>
            )}

            {/* Action button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={checkAvailability}
                disabled={isLoading || !timeSlot.time}
                className={`px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-all duration-200 ${timeSlot.time
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  } min-w-[200px]`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Checking...
                  </>
                ) : (
                  'Check Availability'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success modal */}
      <div
        ref={infoDisplay}
        style={{ display: "none" }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <ScheduleSuccess infoDisplay={infoDisplay} mockType={mockType} timeSlot={timeSlot} />
      </div>
    </div>
  );
}
