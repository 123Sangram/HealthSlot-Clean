import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { doctors as defaultDoctors } from "../assets/assets";
export const AppContext = createContext();

const AppContextProvider = (props) => {
  const currencySymbol = "$";
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:6000";

  const [doctors, setDoctors] = useState([]);
  const [token, setToken] = useState(
    localStorage.getItem("token") ? localStorage.getItem("token") : false
  );
  const [userData, setUserData] = useState(false);

  const getDoctorsData = async () => {
    try {
      console.log("Fetching doctors from:", backendUrl + "/api/doctor/list");
      const { data } = await axios.get(backendUrl + "/api/doctor/list");
      console.log("API Response:", data);
      if (data.success) {
        console.log("Doctors data:", data.doctors);
        setDoctors(data.doctors);
      } else {
        toast.error(data.message);
        // Fallback to default doctors data if API fails
        console.log("Using fallback doctors data");
        setDoctors(defaultDoctors);
      }
    } catch (error) {
      console.log("API Error:", error);
      toast.error("Unable to fetch doctors from server. Using default data.");
      // Fallback to default doctors data if API fails
      console.log("Using fallback doctors data due to error");
      setDoctors(defaultDoctors);
    }
  };

  

  const loadUserProfileData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/get-profile", {
        headers: { token },
      });
      if (data.success) {
        setUserData(data.user);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const value = {
    doctors,
    getDoctorsData,
    currencySymbol,
    token,
    setToken,
    backendUrl,
    userData,
    setUserData,
    loadUserProfileData,
  };

  useEffect(() => {
    getDoctorsData();
  }, []);

  useEffect(() => {
    if (token) {
      loadUserProfileData();
    } else {
      setUserData(false);
    }
  }, [token]);

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;
