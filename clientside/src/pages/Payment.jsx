


import { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import { toast } from 'react-toastify';
import axios from 'axios';

const Payment = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const { token, backendUrl, userData } = useContext(AppContext);

    const [paymentMethod, setPaymentMethod] = useState('card');
    const [loading, setLoading] = useState(false);
    const [cardDetails, setCardDetails] = useState({
        cardNumber: '',
        cardHolder: '',
        expiry: '',
        cvv: ''
    });
    const [appointmentData, setAppointmentData] = useState(null);

const fetchAppointmentData = async () => {
    try {
        // Use per-user key for local appointments
        const userId = userData?._id || "demoUser";
        const localAppointments = JSON.parse(localStorage.getItem(`demoAppointments_${userId}`) || '[]');
        const localAppointment = localAppointments.find(app => app._id === appointmentId);

        if (localAppointment) {
            setAppointmentData({
                doctorName: localAppointment.docData.name,
                speciality: localAppointment.docData.speciality,
                date: "15 Dec 2024",
                time: localAppointment.slotTime,
                amount: 500,
                appointmentId: localAppointment._id
            });
            return;
        }

        const response = await axios.get(`${backendUrl}/api/user/appointments`, {
            headers: { token }
        });

        if (response.data.success) {
            const apiAppointment = response.data.appointments.find(app => app._id === appointmentId);
            if (apiAppointment) {
                setAppointmentData({
                    doctorName: apiAppointment.docData.name,
                    speciality: apiAppointment.docData.speciality,
                    date: "15 Dec 2024",
                    time: apiAppointment.slotTime,
                    amount: 500,
                    appointmentId: apiAppointment._id
                });
            }
        }
    } catch (error) {
        console.error("Error fetching appointment:", error);
        setAppointmentData({
            doctorName: "Dr. Richard James",
            speciality: "General Physician",
            date: "15 Dec 2024",
            time: "10:30 AM",
            amount: 500,
            appointmentId: appointmentId || "demo_123"
        });
    }
};

    useEffect(() => {
        if (appointmentId) {
            fetchAppointmentData();
        }
    }, [appointmentId, token]);

    const handleCardInputChange = (e) => {
        const { name, value } = e.target;
        setCardDetails(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        return parts.length ? parts.join(' ') : v;
    };

    const handleCardNumberChange = (e) => {
        const formatted = formatCardNumber(e.target.value);
        setCardDetails(prev => ({
            ...prev,
            cardNumber: formatted
        }));
    };

    const handlePayment = async () => {
        if (!token) {
            toast.error("Please login to make payment");
            navigate("/login");
            return;
        }

        if (paymentMethod === 'card') {
            if (!cardDetails.cardNumber || !cardDetails.cardHolder || !cardDetails.expiry || !cardDetails.cvv) {
                toast.error("Please fill all card details");
                return;
            }
        }

        if (!appointmentData.time && paymentMethod === 'card') {
            toast.warn("Please select a time slot");
            return;
        }

        setLoading(true);

        try {
            if (paymentMethod === 'card') {
                const orderResponse = await axios.post(
                    `${backendUrl}/api/user/create-payment-order`,
                    {
                        appointmentId: appointmentData.appointmentId,
                        amount: appointmentData.amount,
                        userId: userData._id
                    },
                    { headers: { token } }
                );

                if (!orderResponse.data.success) {
                    throw new Error(orderResponse.data.message);
                }

                const options = {
                    key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_xxxxxxxxxxxxx",
                    amount: orderResponse.data.amount,
                    currency: orderResponse.data.currency,
                    name: "Prescripto",
                    description: `Appointment with ${appointmentData.doctorName}`,
                    order_id: orderResponse.data.orderId,
                    handler: async function (response) {
                        const verifyResponse = await axios.post(
                            `${backendUrl}/api/user/process-payment`,
                            {
                                appointmentId: appointmentData.appointmentId,
                                amount: appointmentData.amount,
                                paymentMethod: paymentMethod,
                                userId: userData._id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature
                            },
                            { headers: { token } }
                        );

                        if (verifyResponse.data.success) {
                            toast.success("Payment successful! Your appointment is confirmed.");
                            navigate("/my-appointments");
                        } else {
                            toast.error(verifyResponse.data.message || "Payment verification failed");
                        }
                    },
                    prefill: {
                        name: cardDetails.cardHolder,
                        email: userData.email || "",
                        contact: userData.phone || ""
                    },
                    theme: {
                        color: "#5f6FFF"
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                await new Promise(resolve => setTimeout(resolve, 2000));

                const response = await axios.post(
                    `${backendUrl}/api/user/process-payment`,
                    {
                        appointmentId: appointmentData.appointmentId,
                        amount: appointmentData.amount,
                        paymentMethod: paymentMethod,
                        cardDetails: paymentMethod === 'card' ? cardDetails : null,
                        userId: userData._id
                    },
                    { headers: { token } }
                );

                if (response.data.success) {
                    toast.success("Payment successful! Your appointment is confirmed.");
                    navigate("/my-appointments");
                } else {
                    toast.error(response.data.message || "Payment failed");
                }
            }
        } catch (error) {
            console.error("Payment error:", error);
            toast.error("Payment failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment</h1>
                    <p className="text-gray-600">Complete your appointment booking</p>
                </div>

                {!appointmentData ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading appointment details...</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Payment Methods Section */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>
                        
                         {/* Payment Options */}
                        <div className="space-y-4 mb-6">
                            {/* Card Payment */}
                             <div 
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                    paymentMethod === 'card' 
                                        ? 'border-primary bg-primary/5' 
                                        : 'border-gray-200 hover:border-primary/50'
                                }`}
                                onClick={() => setPaymentMethod('card')}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">VISA</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Credit/Debit Card</p>
                                            <p className="text-sm text-gray-500">Pay with your card</p>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        paymentMethod === 'card' 
                                            ? 'border-primary bg-primary' 
                                            : 'border-gray-300'
                                    }`}>
                                        {paymentMethod === 'card' && (
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        {/* ... your payment method JSX here ... */}
                             <div 
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                    paymentMethod === 'qr' 
                                        ? 'border-primary bg-primary/5' 
                                        : 'border-gray-200 hover:border-primary/50'
                                }`}
                                onClick={() => setPaymentMethod('qr')}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">QR Code Payment</p>
                                            <p className="text-sm text-gray-500">Scan QR code to pay</p>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        paymentMethod === 'qr' 
                                            ? 'border-primary bg-primary' 
                                            : 'border-gray-300'
                                    }`}>
                                        {paymentMethod === 'qr' && (
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* UPI Payment */}
                            <div 
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                    paymentMethod === 'upi' 
                                        ? 'border-primary bg-primary/5' 
                                        : 'border-gray-200 hover:border-primary/50'
                                }`}
                                onClick={() => setPaymentMethod('upi')}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-6 bg-purple-600 rounded flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">UPI</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">UPI Payment</p>
                                            <p className="text-sm text-gray-500">Pay via UPI</p>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        paymentMethod === 'upi' 
                                            ? 'border-primary bg-primary' 
                                            : 'border-gray-300'
                                    }`}>
                                        {paymentMethod === 'upi' && (
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card Details Form */}
                        {paymentMethod === 'card' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Card Number
                                    </label>
                                    <input
                                        type="text"
                                        name="cardNumber"
                                        value={cardDetails.cardNumber}
                                        onChange={handleCardNumberChange}
                                        placeholder="1234 5678 9012 3456"
                                        maxLength="19"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Card Holder Name
                                    </label>
                                    <input
                                        type="text"
                                        name="cardHolder"
                                        value={cardDetails.cardHolder}
                                        onChange={handleCardInputChange}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Expiry Date
                                        </label>
                                        <input
                                            type="text"
                                            name="expiry"
                                            value={cardDetails.expiry}
                                            onChange={handleCardInputChange}
                                            placeholder="MM/YY"
                                            maxLength="5"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            CVV
                                        </label>
                                        <input
                                            type="text"
                                            name="cvv"
                                            value={cardDetails.cvv}
                                            onChange={handleCardInputChange}
                                            placeholder="123"
                                            maxLength="4"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* QR Code Display */}
                        {paymentMethod === 'qr' && (
                            <div className="text-center py-8">
                                <div className="bg-white border-2 border-gray-200 rounded-lg p-6 inline-block">
                                    <div className="flex items-center justify-center mb-4">
                                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-white font-bold text-sm">S</span>
                                        </div>
                                        <span className="text-gray-800 font-medium">Sangram Singh</span>
                                    </div>
                                    <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center mb-4 border">
                                        <img 
                                            src={assets.payment_qr} 
                                            alt="Payment QR Code"
                                            className="w-44 h-44 object-contain"
                                            onError={(e) => {
                                                // Fallback to a generated QR code if image fails to load
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                        <div className="w-44 h-44 bg-gray-100 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                                            <div className="text-center">
                                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                    </svg>
                                                </div>
                                                <p className="text-xs text-gray-600">QR Code</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-2">UPI ID: sangramamvan-1@oksbi</p>
                                    <p className="text-xs text-gray-500 mb-2">Amount: ₹{appointmentData.amount}</p>
                                    <p className="text-xs text-gray-600">Scan to pay with any UPI app</p>
                                </div>
                                
                                {/* Payment Status */}
                                <div className="mt-6">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm mx-auto">
                                        <p className="text-sm text-blue-800 text-center">
                                            <strong>Instructions:</strong><br/>
                                            1. Open any UPI app (Google Pay, PhonePe, Paytm, etc.)<br/>
                                            2. Scan the QR code above<br/>
                                            3. Verify the amount and UPI ID<br/>
                                            4. Complete the payment<br/>
                                            5. Click &quot;Confirm Payment&quot; below
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* UPI Payment */}
                        {paymentMethod === 'upi' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        UPI ID
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="username@upi"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800">
                                        <strong>Note:</strong> You will receive a payment request on your UPI app. Please approve the payment to complete your booking.
                                    </p>
                                </div>
                            </div>
                )}
                </div>
                        {/* Order Summary Section */}
                  
                      
                                             <div className="bg-white rounded-xl shadow-lg p-6 h-fit">
                         <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
                        
                         <div className="space-y-4 mb-6">
                             <div className="flex items-center space-x-4">
                                 <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                     <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                     </svg>
                                 </div>
                                 <div className="flex-1">
                                     <p className="font-medium text-gray-900">{appointmentData.doctorName}</p>
                                     <p className="text-sm text-gray-500">{appointmentData.speciality}</p>
                                 </div>
                             </div>
                            
                             <div className="border-t pt-4 space-y-2">
                                 <div className="flex justify-between text-sm">
                                     <span className="text-gray-600">Date & Time</span>
                                     <span className="text-gray-900">{appointmentData.date} at {appointmentData.time}</span>
                                 </div>
                                 <div className="flex justify-between text-sm">
                                     <span className="text-gray-600">Appointment ID</span>
                                     <span className="text-gray-900">{appointmentData.appointmentId}</span>
                                 </div>
                             </div>
                         </div>
                        
                         <div className="border-t pt-4">
                             <div className="flex justify-between items-center mb-4">
                                 <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                                 <span className="text-2xl font-bold text-primary">₹{appointmentData.amount}</span>
                             </div>
                            
                             <button
                                onClick={handlePayment}
                                disabled={loading}
                                className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-all ${
                                    loading 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-primary hover:bg-primary/90 active:scale-95'
                                }`}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Processing...
                                    </div>
                                ) : paymentMethod === 'qr' ? (
                                    'Confirm Payment'
                                ) : (
                                    `Pay ₹${appointmentData.amount}`
                                )}
                            </button>
                            <p className="text-xs text-gray-500 text-center mt-3">
                                 By clicking pay, you agree to our terms and conditions
                             </p>
                        </div>
                        </div>




                        
                    </div>
                )}
            </div>
        </div>
    );
};

export default Payment;
