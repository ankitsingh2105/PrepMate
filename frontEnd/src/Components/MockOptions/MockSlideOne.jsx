import React, { useEffect } from 'react'
import { useState } from 'react';
import MockSlideTwo from './MockSlideTwo';
import "./mock.css"
export default function MockSlideOne(props) {
    const { setShowMocks } = props;
    const [nextMock, setNextMock] = useState(false);
    const [curentMock, setCurrentMock] = useState(true);
    const [mock, setMock] = useState({})
    const handleNextSlideVisit = (e) => {
        console.log("ok now here");
        setMock((prev) => ({ ...prev, m1 : e }));
        setNextMock(true);
        setCurrentMock(false);
    }
    useEffect(() => {
        console.log("op :: ", nextMock, mock);
    }, [nextMock, mock])
    return (
        <div className="flex items-center justify-center bg-none">
            {
                curentMock ?
                    <>
                        <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold">Select your interview type</h2>
                                <i style={{ color: "rgb(147 51 234" }} onClick={() => setShowMocks(false)} className="fas fa-times cursor-pointer"></i>
                            </div>
                            <div className="">

                                <div onClick={() => handleNextSlideVisit("DSA")} className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                                    <div className="flex items-center space-x-3">
                                        <i style={{ color: "rgb(147 51 234" }} className="fas fa-code text-xl"></i>
                                        <div>
                                            <h3 className="font-semibold">Data Structures & Algorithms</h3>
                                            <p className="text-gray-500">Practice data structures and algorithms questions.</p>
                                        </div>
                                    </div>
                                </div>
                                <br />
                                <div onClick={() => handleNextSlideVisit("BEH")} className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                                    <div className="flex items-center space-x-3">
                                        <i style={{ color: "rgb(147 51 234" }} className="fas fa-comments text-xl"></i>
                                        <div>
                                            <h3 className="font-semibold">Behavioral</h3>
                                            <p className="text-gray-500">Practice common interview questions about your work experiences.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </>
                    :
                    <>
                        <div className='' >
                            <MockSlideTwo mock={mock} setMock={setMock} setShowMocks={setShowMocks} />
                        </div>
                    </>
            }

            {/* floating slides */}
        </div>
    )
}
