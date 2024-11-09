import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import links from "../../connect";
import { useDispatch, useSelector } from "react-redux"
import axios from "axios";
import io from "socket.io-client"

import { handleUserInfo } from "../Redux/Slices/userInfoSlice";

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { backEndLink } = links;

    // redux related 
    const dispatch = useDispatch();
    const userInfo = useSelector((state) => state.userInfo);
    const { userDetails, loading } = userInfo;
    // console.log(userDetails);

    useEffect(() => {
        dispatch(handleUserInfo());
    }, [dispatch])

    const handleLogout = async () => {
        console.log("loggin out");
        try {
            let response = await axios.get(`${backEndLink}/user/logout`, {
                withCredentials: true
            });
            // setifLoggedIn(false);
            window.location.reload();
            console.log("response for logout :: ", response);
        }
        catch (error) {
            console.log(" op :: ", error)
        }
    }

     

    return (
        <>
            <nav class="flex items-center justify-between p-4 border-b">
                <div class="flex items-center space-x-2" >
                    <div class="bg-purple-600 text-white p-2 rounded"> 
                    </div>
                    <span onClick={() => { navigate("/") }} className="cursor-pointer text-xl font-bold">
                        PrepMate
                    </span>

                </div>
                {!loading && userDetails?.name ? (
                    <section className='flex items-center justify-center space-x-4'>
                        <button className=''>
                            Welcome <b>{userDetails.name.split(" ")[0]}</b>
                        </button>
                        <button onClick={()=>{navigate(`/user/profile/${userDetails.userName}`)}} className='bg-purple-600 text-white px-3 py-1 rounded-full '>
                            {userDetails.name[0]}
                        </button>
                        <button onClick={handleLogout} className='bg-purple-600 text-white px-3 py-1 rounded '>
                            Logout
                        </button>
                    </section>
                ) : (
                    <section className='flex items-center justify-center space-x-4'>
                        <button onClick={() => { navigate("/login") }} className=''>
                            Login
                        </button>
                        <button onClick={() => { navigate("/signup") }} className='bg-purple-600 text-white px-3 py-1 rounded'>
                            Sign Up
                        </button>
                    </section>
                )}

            </nav>
        </>
    )
}
