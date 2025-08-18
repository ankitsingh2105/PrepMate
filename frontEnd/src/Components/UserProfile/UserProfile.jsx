import React, { useState, useEffect, useMemo } from 'react';
import connectJs from "../../connect";
import {useNavigate} from "react-router-dom"
import axios from "axios";
import "./UserProfile.css"
import { toast, ToastContainer } from "react-toastify"
import io from "socket.io-client"
import { useDispatch, useSelector } from 'react-redux';
import { handleUserInfo } from '../Redux/Slices/userInfoSlice';
import { FiCalendar, FiClock, FiTrash2, FiAlertCircle } from 'react-icons/fi';


export default function UserProfile() {

    const userInfo = useSelector((state) => state.userInfo);
    const { userDetails, loading } = userInfo;
    const { backEndLink } = connectJs
    const [userData, setUserData] = useState({
        userName: '',
        name: '',
        bio: '',
        email: '',
        bookings: []
    });
    const [bookings, setBookings] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            console.log("uerDetails are ::", userDetails);
            setUserData(userDetails);
            setBookings(userDetails.bookings);
            console.log(userDetails.bookings);
        };
        fetchUserData();
    }, [userDetails]);

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(handleUserInfo());
    }, [refresh, dispatch]);

    const socket = io(`${backEndLink}/notification`);

    const handleBookingCancel = async (myUserId, otherUserId, myTicketId, otherUserTicketID, mockType, bookingTime) => {
        console.log("op :: ", myUserId, otherUserId, myTicketId, otherUserTicketID, mockType, bookingTime);
        try {
            await axios.post(`${backEndLink}/user/cancelBooking`,
                { myUserId, otherUserId, myTicketId, otherUserTicketID, mockType, bookingTime },
                { withCredentials: true });
            toast.success("Booking cancelled successfully");
            setBookings(bookings.filter(booking => booking.bookingTime !== bookingTime));
            setRefresh((prev) => !prev);
            socket.emit("notification", { message: `Booking for ${bookingTime} is cancelled by the user`, otherUserId });
            dispatch(handleUserInfo());
        }
        catch (error) {
            console.log("Error cancelling booking:", error);
        }
    };

    const formatDate = (dateTimeString) => {
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateTimeString;
        }
    };

    const formatTime = (dateTimeString) => {
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return '';
        }
    };


    useEffect(() => {
        socket.on("connect", () => {
            console.log("Connected to WebSocket with ID:", socket.id);
        });

        socket.emit('register', userDetails._id);  // Register userId

        socket.on("notification", ({ message }) => {
            console.log("Notification received:", message);
            dispatch(handleUserInfo());
            toast(message);
        });

        return () => {
            socket.disconnect();
            socket.off("notification");
        };
    }, [socket, dispatch]);


    const handleRoomIDnavigate = (roomID, type) => {
        if(type === "DSA"){
            navigate(`/dsaMock/room/${roomID}`,  {state : {roomWidth : "300px", roomHeight : "300px", direction:"column"}});
        }
        else{
            navigate(`/behMock/room/${roomID}`,  {state : {roomWidth : "600px", roomHeight : "600px", direction:"row"}});
        }
    }

    return (
        <>
            <ToastContainer position="bottom-right" autoClose={3000} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                <section className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl duration-300 border border-purple-100">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-5">
                        <h3 className="text-2xl font-extrabold text-white flex items-center">
                            <FiCalendar className="mr-2" />
                            Your Booking List
                        </h3>
                        <p className="text-purple-100 mt-1">Manage your upcoming mock interviews</p>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-4 p-4 bg-purple-50 rounded-lg shadow-sm font-semibold text-purple-900 sticky top-0 z-10">
                                <span className="flex text-center">Interview Type</span>
                                <span className="flex text-center">Schedule</span>
                                <span className="flex text-center">Room Link</span>
                                <span className="flex text-center">Action</span>
                            </div>

                            {bookings && bookings.length > 0 ? (
                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                                    {bookings.map((booking, index) => (
                                        <div
                                            key={index}
                                            className="grid grid-cols-4 p-4 bg-white border border-gray-100 rounded-xl hover:bg-purple-50 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md"
                                        >

                                            <span className="text-center font-medium text-gray-800 flex items-center">
                                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${booking.mockType === "DSA" ? "bg-blue-500" : "bg-green-500"}`}></span>
                                                {booking.mockType === "DSA" ? "Data Structure & Algorithms" : "Behavioral Interview"}
                                            </span>

                                            <span className="text-center text-gray-700 flex flex-col">
                                                <span className="flex items-center text-sm font-medium">
                                                    <FiCalendar className="mr-1 text-purple-600" />
                                                    {formatDate(booking.bookingTime)}
                                                </span>
                                                <span className="flex items-center text-xs text-gray-500 mt-1">
                                                    <FiClock className="mr-1" />
                                                    {formatTime(booking.bookingTime)}
                                                </span>
                                            </span>

                                            <span className="flex text-center">
                                                <span onClick={() => handleRoomIDnavigate(booking.roomID, booking.mockType)} className="h-7 w-7 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm hover:cursor-pointer">
                                                    Link
                                                </span>
                                            </span>

                                            <div className=" text-center flex items-center">
                                                <button
                                                    disabled={loading}
                                                    className="text-red-600 hover:text-white hover:bg-red-600 font-medium rounded-lg px-3 py-1.5 transition-colors duration-200 flex items-center border border-red-200 hover:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                                    onClick={() => handleBookingCancel(
                                                        booking.myUserId,
                                                        booking.otherUserId,
                                                        booking.myTicketId,
                                                        booking.otherUserTicketID,
                                                        booking.mockType,
                                                        booking.bookingTime
                                                    )}
                                                >
                                                    <FiTrash2 className="mr-1" />
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-300">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <FiAlertCircle className="text-4xl text-gray-400" />
                                        <p className="text-gray-600 font-medium">No bookings available</p>
                                        <p className="text-gray-500 text-sm max-w-xs">
                                            You don't have any upcoming mock interviews scheduled. Book one to prepare for your next opportunity.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </>
    );

}
