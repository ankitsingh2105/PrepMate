import React, { useEffect, useState } from 'react';
import "./Schedule.css";

export default function Schedule() {

    const [timeArray, setTimeArray] = useState([]);
    const [timeSlot , setTimeSlot] = useState({});
    const timeSlots = [
        "9:30 AM",
        "11:30 AM",
        "1:30 PM",
        "3:30 PM",
        "5:30 PM",
        "7:30 PM",
        "9:30 PM"
    ];

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
        console.log("time is :: ", e, time);
        setTimeSlot({date:e , time});
    };

    const checkAvailiability = () =>{
        console.log(timeSlot);
    }

    return (
        <>
            <div className="scheduleMain">
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
            </div>
        </>
    );
}
