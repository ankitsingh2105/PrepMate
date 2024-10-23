import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import links from "../../connect";
import axios from "axios";
export default function Navbar() {
    const navigate = useNavigate();
    const { backEndLink } = links;
    const [ifLoggedIn, setifLoggedIn] = useState(false);

    useEffect(() => {
        const checkIfLoggedIn = async () => {
            try {
                let response = await axios.get(`${backEndLink}/user/getInfo` , {
                    withCredentials : true
                });
                console.log("response is  ", response);
                setifLoggedIn(true);
            }
            catch (error) {
                console.log("error :: ", error);
            }
        }
        checkIfLoggedIn();
    }, [])

    return (
        <>
            <nav class="flex items-center justify-between p-4 border-b">
                <div class="flex items-center space-x-2" >
                    <div class="bg-purple-600 text-white p-2 rounded">
                        <i class="fas fa-star"></i>
                    </div>
                    <span onClick={() => { navigate("/") }} className="cursor-pointer text-xl font-bold">
                        PrepMate
                    </span>

                </div>
                {
                    ifLoggedIn ?
                        <>
                            <section className='flex items-center justify-center space-x-4'>
                                <button onClick={() => { navigate("/login") }} className=''>
                                    Welcome Ankit
                                </button>
                                <button onClick={() => { navigate("/signup") }} className='bg-purple-600 text-white px-3 py-1 rounded'>
                                    <img src="" alt="" />
                                </button>
                            </section>
                        </>
                        :
                        <section className='flex items-center justify-center space-x-4'>
                            <button onClick={() => { navigate("/login") }} className=''>
                                Login
                            </button>
                            <button onClick={() => { navigate("/signup") }} className='bg-purple-600 text-white px-3 py-1 rounded'>
                                Sign Up
                            </button>
                        </section>
                }
            </nav>
        </>
    )
}
