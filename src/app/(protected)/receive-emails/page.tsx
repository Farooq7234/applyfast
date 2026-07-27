
"use client"
import React, { useEffect, useState } from 'react'

const ReceiveEmail =  () => {
    const [data, setData]= useState([])

   useEffect(() => {
    const fetchData = async () => {
        try {
            const response = await fetch('/api/receive-emails');
            setData(await response.json());
            return response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    fetchData ()
},[]);


console.log(data)

  return (
    <div>

    <h1>Received Emails</h1>


    </div>
  )
}

export default ReceiveEmail