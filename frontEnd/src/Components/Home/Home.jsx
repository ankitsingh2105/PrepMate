import React, { useState } from 'react'
import homeImage from "./homeImage.png"
import { useSelector } from "react-redux"
import "./Home.css"
import MockSlideOne from "../MockOptions/MockSlideOne";
export default function Home() {
    const userInfo = useSelector((state) => state.userInfo);
    const { userDetails, loading, error } = userInfo;
    const [showMocks, setShowMocks] = useState(false);
    const handleScheduling = () => {
        console.log("scheduled the interview");
        setShowMocks(true);
    }
    return (
        <div>
            <main class="flex justify-center align-center mt-12 p-8">
                <div class="max-w-lg">
                    <h1 class="text-6xl font-bold text-gray-900">Practice mock interviews with peers</h1>
                    <p class="text-gray-700 mt-10">Join like minded candidates practicing interviews to land jobs. Practice real questions over video chat in a collaborative environment.</p>
                    <div class="mt-6 flex items-center space-x-4">
                        <button onClick={handleScheduling} class="bg-purple-600 text-white px-4 py-2 rounded">Schedule practice session</button>
                        <div>
                            <p class="text-gray-700">5 credits remaining</p>
                            <a href="#" class="text-purple-600">{
                                !loading && userDetails?.name ? userDetails.name.split(" ")[0] : ""
                            } Get unlimited sessions</a>
                        </div>
                    </div>
                </div>
                <div>
                    <img src={homeImage} style={{ width: "400px", height: "400px" }} alt="perons taking mock interview" />
                </div>

                {/* the floating component */}
                {
                    showMocks ?
                        <>
                            <div className='mockSlides' >
                                <MockSlideOne setShowMocks={setShowMocks} showMocks={showMocks} />
                            </div>
                        </>
                        :
                        <>
                        </>
                }

            </main>
        </div>
    );
}
