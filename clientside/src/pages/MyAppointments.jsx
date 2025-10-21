// import React, { useContext, useEffect, useState } from "react";
// import { AppContext } from "../context/AppContext";
// import { doctors as defaultDoctors } from "../assets/assets";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom";

// const MyAppointments = () => {
//   const { backendUrl, token, getDoctorsData } = useContext(AppContext);
//   const navigate = useNavigate();

//   const [appointments, setAppointments] = useState([]);
//   const months = [
//     "",
//     "Jan",
//     "Feb",
//     "Mar",
//     "Apr",
//     "May",
//     "Jun",
//     "Jul",
//     "Aug",
//     "Sep",
//     "Oct",
//     "Nov",
//     "Dec",
//   ];

//   const slotDateFormat = (slotDate) => {
//     const dateArray = slotDate.split("_");
//     return (
//       dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
//     );
//   };

//   const getUserAppointments = async () => {
//     try {
//       // Get API appointments
//       const { data } = await axios.get(backendUrl + "/api/user/appointments", {
//         headers: { token },
//       });

//       let allAppointments = [];

//       if (data.success) {
//         allAppointments = [...data.appointments];
//       }

//       // Get local demo appointments
//       const localAppointments = JSON.parse(localStorage.getItem('demoAppointments') || '[]');
      
//       // Combine API and local appointments
//       const combinedAppointments = [...allAppointments, ...localAppointments];
      
//       setAppointments(combinedAppointments.reverse());
//       console.log("All appointments:", combinedAppointments);
//     } catch (error) {
//       console.log("API Error:", error);
      
//       // If API fails, show only local appointments
//       const localAppointments = JSON.parse(localStorage.getItem('demoAppointments') || '[]');
//       setAppointments(localAppointments.reverse());
//     }
//   };

//   const cancelAppointment = async (appointmentId) => {
//     try {
//       // Check if it's a local appointment
//       const localAppointments = JSON.parse(localStorage.getItem('demoAppointments') || '[]');
//       const localAppointment = localAppointments.find(app => app._id === appointmentId);
      
//       if (localAppointment) {
//         // Cancel local appointment
//         const updatedLocalAppointments = localAppointments.map(app => 
//           app._id === appointmentId ? { ...app, cancelled: true } : app
//         );
//         localStorage.setItem('demoAppointments', JSON.stringify(updatedLocalAppointments));
//         toast.success("Appointment cancelled successfully");
//         getUserAppointments();
//         return;
//       }

//       // Cancel API appointment
//       const { data } = await axios.post(
//         backendUrl + "/api/user/cancel-appointment",
//         { appointmentId },
//         { headers: { token } }
//       );
//       if (data.success) {
//         toast.success(data.message);
//         getUserAppointments();
//         getDoctorsData();
//       } else {
//         toast.error(data.message);
//       }
//     } catch (error) {
//       console.log(error);
//       toast.error(error.message);
//     }
//   };

//   useEffect(() => {
//     if (token) {
//       getUserAppointments();
//     }
//   }, [token]);

//   return (
//     <div>
//       <p className="pb-3 mt-12 font-medium text-zinc-700 border-b">
//         My appointments
//       </p>
//       <div>
//         {appointments.map((item, index) => (
//           <div
//             className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b"
//             key={index}
//           >
//             <div>
//               <img
//                 className="w-32 bg-indigo-50"
//                 src={item.docData.image}
//                 alt=""
//               />
//             </div>
//             <div className="flex-1 text-sm text-zinc-600">
//               <p className="text-neutral-800 font-semibold">
//                 {item.docData.name}
//               </p>
//               <p>{item.docData.speciality}</p>
//               <p className="text-zinc-700 font-medium mt-1">Address:</p>
//               <p className="text-xs">{item.docData.address.line1}</p>
//               <p className="text-xs">{item.docData.address.line2}</p>
//               <p className="text-xs mt-1">
//                 <span className="text-sm text-neutral-700 font-medium">
//                   Date & Time:
//                 </span>{" "}
//                 {slotDateFormat(item.slotDate)} | {item.slotTime}
//               </p>
//             </div>
//             <div></div>
//             <div className="flex flex-col gap-2 justify-end">
//               {!item.cancelled && !item.isCompleted && (
//                 <button 
//                   onClick={() => navigate(`/payment/${item._id}`)}
//                   className="text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300"
//                 >
//                   Pay Online
//                 </button>
//               )}
//               {!item.cancelled && !item.isCompleted && (
//                 <button
//                   onClick={() => cancelAppointment(item._id)}
//                   className="text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300"
//                 >
//                   Cancel appointment
//                 </button>
//               )}
//               {item.cancelled && !item.isCompleted && (
//                 <button className="sm:min-w-48 py-2 border border-red-500 rounded text-red-500">
//                   Appointment cancelled
//                 </button>
//               )}
//               {item.isCompleted && (
//                 <button className="sm:min-w-48 py-2 border border-green-500 rounded text-green-500">
//                   Completed
//                 </button>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default MyAppointments;


















import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const MyAppointments = () => {
  const { backendUrl, token, getDoctorsData, userData } = useContext(AppContext);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const months = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split("_");
    return (
      dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
    );
  };

  const getUserAppointments = async () => {
    try {
      // Get API appointments
      const { data } = await axios.get(backendUrl + "/api/user/appointments", {
        headers: { token },
      });

      let allAppointments = [];

      if (data.success) {
        allAppointments = [...data.appointments];
      }

      // Get local demo appointments for current user only
      const userId = userData?._id || "demoUser";
      const localAppointments = JSON.parse(localStorage.getItem(`demoAppointments_${userId}`) || '[]');

      // Combine API and local appointments
      const combinedAppointments = [...allAppointments, ...localAppointments];

      setAppointments(combinedAppointments.reverse());
      console.log("All appointments:", combinedAppointments);
    } catch (error) {
      console.log("API Error:", error);

      // If API fails, show only local appointments for current user
      const userId = userData?._id || "demoUser";
      const localAppointments = JSON.parse(localStorage.getItem(`demoAppointments_${userId}`) || '[]');
      setAppointments(localAppointments.reverse());
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      // Check if it's a local appointment for current user
      const userId = userData?._id || "demoUser";
      const localAppointments = JSON.parse(localStorage.getItem(`demoAppointments_${userId}`) || '[]');
      const localAppointment = localAppointments.find(app => app._id === appointmentId);

      if (localAppointment) {
        // Cancel local appointment
        const updatedLocalAppointments = localAppointments.map(app =>
          app._id === appointmentId ? { ...app, cancelled: true } : app
        );
        localStorage.setItem(`demoAppointments_${userId}`, JSON.stringify(updatedLocalAppointments));
        toast.success("Appointment cancelled successfully");
        getUserAppointments();
        return;
      }

      // Cancel API appointment
      const { data } = await axios.post(
        backendUrl + "/api/user/cancel-appointment",
        { appointmentId },
        { headers: { token } }
      );
      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
        getDoctorsData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (token && userData) {
      getUserAppointments();
    }
  }, [token, userData]);

  return (
    <div>
      <p className="pb-3 mt-12 font-medium text-zinc-700 border-b">
        My appointments
      </p>
      <div>
        {appointments.map((item, index) => (
          <div
            className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b"
            key={index}
          >
            <div>
              <img
                className="w-32 bg-indigo-50"
                src={item.docData.image}
                alt=""
              />
            </div>
            <div className="flex-1 text-sm text-zinc-600">
              <p className="text-neutral-800 font-semibold">
                {item.docData.name}
              </p>
              <p>{item.docData.speciality}</p>
              <p className="text-zinc-700 font-medium mt-1">Address:</p>
              <p className="text-xs">{item.docData.address.line1}</p>
              <p className="text-xs">{item.docData.address.line2}</p>
              <p className="text-xs mt-1">
                <span className="text-sm text-neutral-700 font-medium">
                  Date & Time:
                </span>{" "}
                {slotDateFormat(item.slotDate)} | {item.slotTime}
              </p>
            </div>
            <div></div>
            <div className="flex flex-col gap-2 justify-end">
              {!item.cancelled && !item.isCompleted && (
                <button 
                  onClick={() => navigate(`/payment/${item._id}`)}
                  className="text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300"
                >
                  Pay Online
                </button>
              )}
              {!item.cancelled && !item.isCompleted && (
                <button
                  onClick={() => cancelAppointment(item._id)}
                  className="text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300"
                >
                  Cancel appointment
                </button>
              )}
              {item.cancelled && !item.isCompleted && (
                <button className="sm:min-w-48 py-2 border border-red-500 rounded text-red-500">
                  Appointment cancelled
                </button>
              )}
              {item.isCompleted && (
                <button className="sm:min-w-48 py-2 border border-green-500 rounded text-green-500">
                  Completed
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyAppointments;
// ...existing code...