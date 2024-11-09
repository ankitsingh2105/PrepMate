import React, { useEffect, useRef, useState } from 'react';
import "./Schedule.css";
import { ToastContainer, toast } from "react-toastify"
import link from "../../connect"
import axios from "axios";
import { useSelector } from "react-redux"
import { useLocation } from 'react-router-dom';
import ScheduleSuccess from './ScheduleSuccess';

export default function Schedule() {


    const location = useLocation();
    const mockType = location.state?.mockType;
    const infoDisplay = useRef(null);

    console.log("Mock Type:", mockType);

    const [timeArray, setTimeArray] = useState([]);
    const [timeSlot, setTimeSlot] = useState({});
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

    const timeAndDateSchedule = ({ e, time }) => {
        setTimeSlot({ date: e, time });
        toast(`Please check availability for \n ${e} ${time}`, { autoClose: 2000 });
    };

    const checkAvailiability = async () => {
        if (!timeSlot.time) {
            toast.error("Please select a time slot", { autoClose: 1000 })
            return;
        }
        const { backEndLink } = link;
        try {
            let response = await axios.post(`${backEndLink}/user/checkAvailability`, { mockType, timeSlot, userId: userDetails._id }, {
                withCredentials: true
            })
            if(response.data[0]=='Y'){
                infoDisplay.current.style.display = "flex";
            }
            console.log("Message :: ", response.data);
            toast(response.data, { autoClose: 2000 });
        }
        catch (error) {
            console.log("messages :: ", error);
        }
    }

    return (
        <>
            <div className="scheduleMain">
                <ToastContainer />
                <br />
                <h2 className="text-xl font-semibold">Select a time to practice</h2>
                <br />
                <div className=" scrollable-container bg-white rounded-lg shadow-lg p-6 w-96 relative z-10">
                    <p className="text-gray-500 text-sm mb-6">All times shown in your local timezone (IST)</p>

                    {/* Next four days */}
                    {
                        timeArray.map((e) => (
                            <div key={e} className="space-y-4">
                                <div>
                                    <h3 className="text-gray-700 font-medium mb-2">{e}</h3>
                                    <div className="space-y-2">
                                        {timeSlots.map((time) => (
                                            <div onClick={() => timeAndDateSchedule({ e, time })} key={time} className="timeSlot border rounded-lg p-2">
                                                {time}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <br />
                            </div>
                        ))
                    }
                </div>
                <br />
                <button onClick={checkAvailiability} >Check Availability</button>
            <div ref={infoDisplay} style={{display:"none"}} className="scheduleSuccess">
                    <ScheduleSuccess infoDisplay={infoDisplay} mockType={mockType} timeSlot={timeSlot} />
            </div>
            </div>
        </>
    );
}
