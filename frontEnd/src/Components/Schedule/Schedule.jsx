import React from 'react'

export default function Schedule() {
    const timeSlots = [
        "9:30 AM",
        "11:30 AM",
        "1:30 PM",
        "3:30 PM",
        "5:30 PM",
        "7:30 PM",
        "9:30 PM"
    ];
    let newDate = new Date();
    console.log(newDate.getDate() , newDate.getMonth(), newDate.getTime());

    function getNextFourDays() {
        const dates = [];
        const today = new Date("2024-10-30"); // Manually setting to October 30, 2024, for demonstration

        for (let i = 0; i < 4; i++) {
            const nextDate = new Date(today);
            nextDate.setDate(today.getDate() + i); // This handles month and year transition
            dates.push(nextDate.toDateString());
        }

        return dates;
    }

    console.log(getNextFourDays());

    return (
        <>
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Select a time to practice</h2>
                        <i className="fas fa-times cursor-pointer"></i>
                    </div>
                    <p className="text-gray-500 text-sm mb-6">All times shown in your local timezone (IST)</p>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-gray-700 font-medium mb-2">Today</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center border rounded-lg p-2">
                                    <span>4:30 PM</span>
                                    <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded">Starting now</span>
                                </div>
                                <div className="border rounded-lg p-2">6:30 PM</div>
                                <div className="border rounded-lg p-2">8:30 PM</div>
                                <div className="border rounded-lg p-2">10:30 PM</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
