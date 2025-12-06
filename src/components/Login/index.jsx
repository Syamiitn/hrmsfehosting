import React, { useState, useEffect, useRef } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Button from '@components/common/Button';

// Import the custom hook instead of axios and useBaseUrl
import { useApi } from '@hooks/useApi';

import { useLoading } from '@context/LoadingContext';
import { useAuth } from '@context/AuthContext';

// Carousel Images
import imgOne from '@assets/1.jpg';
import imgTwo from '@assets/2.jpg';
import imgThree from '@assets/3.jpg';

// Logo
import Logo from '@assets/TetriqSolutionsLogo.png'

// toast utils
import { showErrorToast, showSuccessToast, showInfoToast } from '@utils/utils';

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState('login'); // Current step: 'login' | 'otp' | 'forgot'
    const [timer, setTimer] = useState(0); // OTP timer countdown
    const [isResendActive, setIsResendActive] = useState(false);
    const [showErrorMessage, setShowErrorMessage] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']); // OTP boxes
    const otpRefs = useRef([]);
    const navigate = useNavigate();
    const { showLoading, hideLoading } = useLoading();

    // Use the custom useApi hook
    const { post } = useApi();

    const [challengeId, setChallengeId] = useState(''); //to store challenge id
    const { login } = useAuth();

    // State for the Tailwind carousel
    const [currentSlide, setCurrentSlide] = useState(0);
    const carouselImages = [imgOne, imgTwo, imgThree];
    const carouselTexts = [
        { heading: 'Welcome to Our Platform', text: 'Manage your HR processes smoothly and efficiently.' },
        { heading: 'Track Employee Attendance', text: 'Monitor attendance, leaves, and performance all in one place.' },
        { heading: 'Payroll & Compliance', text: 'Automate payroll generation and stay compliant effortlessly.' },
    ];

    // Effect for the Tailwind carousel
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prevSlide) => (prevSlide + 1) % carouselImages.length);
        }, 3000); // Change slide every 3 seconds

        return () => clearInterval(interval);
    }, [carouselImages.length]);


    // Validation Schemas
    // Login Validation
    const loginValidationSchema = Yup.object().shape({
        emailOrPhone: Yup.string()
            .required('Email or Phone is required')
            .test('validate-id', 'Invalid User ID', function (value) {
                if (!value) return false;

                const trimmed = value.trim();

                if (/\s/.test(trimmed)) {
                    return this.createError({ message: 'No spaces allowed' });
                }

                if (trimmed.includes('@')) {
                    // Basic email regex check
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return emailRegex.test(trimmed);
                } else {
                    // Should be digits only for phone (no special chars)
                    const phoneRegex = /^[0-9]+$/;
                    return phoneRegex.test(trimmed);
                }
            }),

        password: Yup.string().required('Password is required')
    });

    // Forget Validation
    const forgotValidationSchema = Yup.object().shape({
        resetEmail: Yup.string().email('Invalid email').required('Work Email is required')
    });


    // OTP Timer Effect
    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        } else if (timer === 0 && step === 'otp') {
            setIsResendActive(true);
        }
        return () => clearInterval(interval);
    }, [timer, step]);

    // otp start timer Function
    const startTimer = () => {
        setTimer(120); // Example timer (should be 120 in production)
        setIsResendActive(false);
    };

    // Resend OTP Handler
    const handleResendOtp = async () => {
        const data = {
            challengeId,
        }

        try {
            setShowErrorMessage(false);
            showLoading({ type: 'spinner', size: 'md', fullscreen: true });
            const response = await post('auth/2fa/resend', data);
            startTimer();
            showSuccessToast("New OTP sent successfully!");
            setShowErrorMessage(false);
        } catch (e) {
            const errorMessage =
                e.data?.message ||
                e.data?.error ||
                e.message ||
                'Something went wrong. Please try again.';

            showErrorToast(errorMessage);
            setErrorMessage(errorMessage);
            setShowErrorMessage(true);
        } finally {
            hideLoading();
        }
    };


    // Login Submit Handler
    const handleLoginSubmit = async (values) => {
        const { emailOrPhone, password } = values;
        showLoading({ type: 'spinner', size: 'md', fullscreen: true });
        const data = {
            emailOrPhone,
            password,
        };

        try {
            const response = await post('auth/login', data);

            setChallengeId(response.challengeId);

            if (response.requires2FA === true) {
                showInfoToast('Please Enter OTP');
                setStep('otp');
                startTimer();
            } else {
                handleSuccessLogin(response); // If 2FA is False
            }

            setShowErrorMessage(false)

        } catch (e) {
            const errorMessage =
                e.data?.message ||
                e.data?.error ||
                e.message ||
                'Something went wrong. Please try again.';

            showErrorToast(errorMessage);
            setErrorMessage(errorMessage);
            setShowErrorMessage(true);
        } finally {
            hideLoading();
        }
    };

    // OTP Input Handlers
    const handleOtpChange = (e, index) => {
        const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '');

        const newOtp = [...otpValues];
        newOtp[index] = val;
        setOtpValues(newOtp);

        if (val && index < 5) {
            otpRefs.current[index + 1].focus();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
            otpRefs.current[index - 1].focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();  // Prevent default paste behavior

        const pastedData = e.clipboardData.getData('Text').trim();
        const alphanumericOnly = pastedData.replace(/[^a-zA-Z0-9]/g, '');

        if (alphanumericOnly.length === 6) {
            const otpArray = alphanumericOnly.split('');
            setOtpValues(otpArray);

            // Optionally focus last input
            otpRefs.current[5].focus();
        }
    };


    // OTP Submit Function
    const handleOtpSubmit = async () => {
        const otp = otpValues.join('');

        // Show toast if user clicks submit without entering any OTP
        if (otpValues.every(val => val === '')) {
            showErrorToast('Please enter OTP');
            return;
        }

        // Show toast if OTP length is not 6 digits
        if (otp.length < 6) {
            showErrorToast('OTP must be exactly 6 digits');
            return;
        }

        const data = {
            challengeId,
            code: otp,
        }

        try {
            showLoading({ type: 'spinner', size: 'md', fullscreen: true });
            const response = await post('auth/2fa/verify', data);
            handleSuccessLogin(response);
            setShowErrorMessage(false);
        } catch (e) {
            const errorMessage =
                e.data?.message ||
                e.data?.error ||
                e.message ||
                'Something went wrong. Please try again.';

            showErrorToast(errorMessage);
            setErrorMessage(errorMessage);
            setShowErrorMessage(true);

            // Clear OTP inputs on invalid OTP
            setOtpValues(['', '', '', '', '', '']);
        } finally {
            hideLoading();
        }
    };

    // OnSuccess Login 
    const handleSuccessLogin = (response) => {
        login(response.accessToken);
        showSuccessToast('Login Successful!');
        navigate('/admin/dashboard', { replace: true });
    }

    // Forgot Password Handler
    const handleForgotSubmit = async (values) => {
        const { resetEmail } = values;
        const data = { email: resetEmail };

        try {
            showLoading({ type: 'spinner', size: 'md', fullscreen: true });
            const response = await post('auth/password/forgot', data);

            // Updated logic for handling backend response
            const { ok, challengeId } = response;

            if (ok === true && challengeId) {
                // Email found in DB
                showInfoToast("If an account with this email exists, you will receive a password reset link.");
                setStep('login');
                setShowErrorMessage(false);
            } else if (ok === true && !challengeId) {
                // Email not found (backend returns ok: true)
                setShowErrorMessage(true);
                setErrorMessage('Please enter a valid email address.');
            } else {
                // Just in case some other unexpected response
                setShowErrorMessage(true);
                setErrorMessage('Something went wrong. Please try again.');
            }
        } catch (e) {
            const errorMessage =
                e.data?.message ||
                e.data?.error ||
                e.message ||
                'Something went wrong. Please try again.';

            showErrorToast(errorMessage);
            setErrorMessage(errorMessage);
            setShowErrorMessage(true);
        } finally {
            hideLoading();
        }
    };

    // Utility: Format Timer
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className='flex min-h-screen bg-gray-100'>
            {/* Carousel */}
            <div className='relative flex-1 hidden lg:block'>
                {carouselImages.map((img, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentSlide === index ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        <img src={img} className="w-full h-screen object-cover" loading='lazy' alt={`Slide ${index + 1}`} />
                        <div className="absolute inset-x-0 bottom-0 p-10 text-white bg-gradient-to-t from-black/75 to-transparent">
                            <h1 className='text-white mb-2'>{carouselTexts[index].heading}</h1>
                            <p>{carouselTexts[index].text}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Form Container */}
            <div className="flex flex-1 items-center justify-center bg-gray-100 p-4 lg:bg-transparent lg:p-0">

                {/* Login Step */}
                {step === 'login' && (
                    <Formik initialValues={{ emailOrPhone: '', password: '' }} validationSchema={loginValidationSchema} onSubmit={handleLoginSubmit}>
                        {() => (
                            <Form className="w-full max-w-md px-6 py-4 bg-white rounded-lg shadow-xl p-3">
                                <h3 className="text-center text-2xl font-bold mb-4">Login to SoGo</h3>
                                {Logo && <img src={Logo} alt="Logo" loading='lazy' className='w-full mb-3' />}

                                <div className="text-center text-red-500 mb-3">
                                    {showErrorMessage && <p>{errorMessage}</p>}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 font-semibold mb-1">User ID</label>
                                    <Field type="text" name="emailOrPhone" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-3 focus:ring-violet-300" placeholder="Enter email or phone" />
                                    <ErrorMessage name="emailOrPhone" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 font-semibold mb-1">Password</label>
                                    <div className="relative">
                                        <Field type={showPassword ? 'text' : 'password'} name="password" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-3 focus:ring-violet-300" placeholder="Enter password" />
                                        <span className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500" onClick={() => setShowPassword(prev => !prev)}>
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </span>
                                    </div>
                                    <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                <div className="text-right mb-4">
                                    <button type="button" className="text-blue-500 hover:underline cursor-pointer" onClick={() => { setStep('forgot'); setShowErrorMessage(false); }}>Forgot Password?</button>
                                </div>

                                <Button variant='solid' size='sm' label='Login' radius={5} className='w-full' type='submit' />
                            </Form>
                        )}
                    </Formik>
                )}

                {/* OTP Step */}
                {step === 'otp' && (
                    <div className="w-full max-w-md p-3 bg-white rounded-lg shadow-xl">
                        <h3 className="text-center text-2xl font-bold mb-4">Enter OTP</h3>

                        <div className="flex justify-between gap-2">
                            {otpValues.map((val, idx) => (
                                <input
                                    key={idx}
                                    type="text"
                                    maxLength="1"
                                    value={val}
                                    ref={el => otpRefs.current[idx] = el}
                                    className="w-12 h-12 text-center text-lg border rounded-md focus:outline-none focus:ring-3 focus:ring-blue-500"
                                    onChange={(e) => handleOtpChange(e, idx)}
                                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                                    onPaste={handleOtpPaste}
                                />
                            ))}
                        </div>

                        <div className="text-center text-red-500 mt-3">
                            {showErrorMessage && <p>{errorMessage}</p>}
                        </div>

                        <div className="flex justify-between items-center mt-4">
                            <button type="button" className="text-blue-500 hover:underline disabled:text-gray-400 disabled:no-underline" onClick={handleResendOtp} disabled={!isResendActive}>Resend OTP</button>
                            <span className="text-gray-500">Resend OTP in {formatTime(timer)}</span>
                        </div>

                        <Button variant='solid' size='sm' radius={5} className='w-full mt-4' label='Submit OTP' onClick={handleOtpSubmit} />
                    </div>
                )}

                {/* Forgot Password Step */}
                {step === 'forgot' && (
                    <Formik initialValues={{ resetEmail: '' }} validationSchema={forgotValidationSchema} onSubmit={handleForgotSubmit}>
                        {() => (
                            <Form className="w-full max-w-md p-3 bg-white rounded-lg shadow-xl">
                                <h3 className="text-center text-2xl font-bold mb-4">Forgot Password</h3>
                                <div className="mb-4">
                                    <label className="block text-gray-700 font-semibold mb-1">Work Email</label>
                                    <Field type="email" name="resetEmail" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-3 focus:ring-violet-300" placeholder="Enter your work email" />
                                    <ErrorMessage name="resetEmail" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                <div className="text-center text-red-500 mt-3">
                                    {showErrorMessage && <p>{errorMessage}</p>}
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <Button type='submit' variant='solid' size='sm' radius={5} className='w-1/2' label='Send Reset Link' />
                                    <Button type='button' variant='outline' size='sm' radius={5} className='w-1/2' label='Back to Login' onClick={() => { setStep('login'); setShowErrorMessage(false); }} />
                                </div>
                            </Form>
                        )}
                    </Formik>
                )}
            </div>
        </div>
    );
}