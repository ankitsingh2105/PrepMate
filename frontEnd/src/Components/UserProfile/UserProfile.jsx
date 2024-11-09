import React, { useState, useEffect, useMemo } from 'react';
import connectJs from "../../connect";
import axios from "axios";
import "./UserProfile.css"
import image from "./image.png"
import { toast, ToastContainer } from "react-toastify"
import io from "socket.io-client"
import { useDispatch, useSelector } from 'react-redux';
import { handleUserInfo } from '../Redux/Slices/userInfoSlice';

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

    useEffect(() => {
        const fetchUserData = async () => {
            console.log("uerDetails are ::", userDetails);
            setUserData(userDetails);
            setBookings(userDetails.bookings);
        };
        fetchUserData();
    }, []);



    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData({ ...userData, [name]: value });
    };

    const handleImageChange = () => {
        console.log("upload image")
    }

    const handleUserInfoUpdate = async () => {
        console.log(userData);
        const { email, name, bio } = userData;
        try {
            let response = await axios.patch(`${backEndLink}/user/updateInformation`, {
                email, name, bio
            }, {
                withCredentials: true
            })
            console.log(response);
        }
        catch (error) {
            console.log(error);
        }
    }
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(handleUserInfo());
    }, [refresh, dispatch]);

    const socket = io('http://localhost:9001');

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



    return (
        <main className='userProfileMain' >
            <ToastContainer />
            {/* <section className="flex flex-row items-center  p-6 firstSection"> */}


            <section className="secondSection">

                <br /><br />
                <h3 className="text-xl font-bold text-purple-600 mb-4">Booking List</h3>


                <div className="m-4">
                    <div className="bookingDetails p-4 border border-gray-300 rounded shadow-sm font-medium text-purple-600">
                        <b>S.No</b>
                        <b>Mock Type</b>
                        <b>Date and Time</b>
                        <b>Cancel</b>
                    </div>
                    {bookings && bookings?.length ? (
                        bookings.map((booking, index) => (
                            <div key={index} className="bookingDetails p-4 border border-gray-300 rounded shadow-sm">
                                <b className='text-purple-600'>{index + 1}.</b>
                                <b>{booking.mockType === "DSA" ? "Data Structure and Algorithm" : "Behavioural Round"}</b>
                                <b>{booking.bookingTime}</b>
                                <p
                                    className="text-red-500 cursor-pointer"
                                    onClick={() => handleBookingCancel(booking.myUserId, booking.otherUserId, booking.myTicketId, booking.otherUserTicketID, booking.mockType, booking.bookingTime)}
                                >
                                    Cancel
                                </p>
                            </div>
                        ))

                    ) : (
                        <center className="text-gray-600 mt-3">No bookings available.</center>
                    )}
                </div>

                <br /><br />



            </section>


            <section style={{ boxShadow: "0px 0px 10px gray" }} className="userProfileEdit">

                <div className="bg-white w-full max-w-lg p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-center text-purple-600 mb-6">User Profile</h2>

                    <div className="mb-4">
                        <label className="block text-gray-700">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={userData.name}
                            onChange={handleInputChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700">Bio</label>
                        <textarea
                            name="bio"
                            value={userData.bio}
                            onChange={handleInputChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded"
                            placeholder={userData.bio}
                        ></textarea>
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={userData.email}
                            onChange={handleInputChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <center>
                        <button onClick={handleUserInfoUpdate}>
                            Update Information
                        </button>
                    </center>
                </div>
            </section>
            <br /><br />

            {/* </section> */}


        </main>
    );
}
