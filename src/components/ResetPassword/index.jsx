import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Import your custom useApi hook
import { useApi } from '@hooks/useApi';

import { useLoading } from '@context/LoadingContext';
import Button from '@components/common/Button';
import { showErrorToast, showSuccessToast } from '@utils/utils';

// icon
import { FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import Loading from '@components/common/Loading';

// carousel images
import imgOne from '@assets/1.jpg';
import imgTwo from '@assets/2.jpg';
import imgThree from '@assets/3.jpg';

// link expired image
import linkExpired from '@assets/linkexpired.png';

export default function ResetPasswordPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isValidLink, setIsValidLink] = useState(false);
    const [resetSuccessful, setResetSuccessful] = useState(false);
    const [formError, setFormError] = useState('');
    const [validSuccessMsg, setValidSucessMsg] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { showLoading, hideLoading } = useLoading();

    // Initialize your custom API hook
    const { post } = useApi();

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

    // Reset Password Validation Schema
    const resetPasswordValidationSchema = Yup.object().shape({
        newPassword: Yup.string()
            .required('New Password is required')
            .min(8, 'Password must be at least 8 characters long')
            .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
            .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .matches(/[0-9]/, 'Password must contain at least one number')
            .matches(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)')
            .max(25, 'Password cannot exceed 25 characters'),
        confirmPassword: Yup.string()
            .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
            .required('Confirm Password is required'),
    });

    // State to manage the API call status and prevent multiple calls
    const [validationAttempted, setValidationAttempted] = useState(false);

    // Effect to validate the reset token
    useEffect(() => {
        const challengeId = searchParams.get('challengeId');
        const code = searchParams.get('code');

        if (validationAttempted) {
            return; // Exit if validation has already been attempted
        }

        if (!challengeId || !code) {
            setIsValidLink(false);
            setLoading(false);
            const errorMessage = 'Invalid or incomplete password reset link.';
            setFormError(errorMessage);
            showErrorToast(errorMessage);
            setValidationAttempted(true);
            return;
        }

        const validateLink = async () => {
            try {
                showLoading({ type: 'spinner', size: 'md', fullscreen: true });
                const response = await post('auth/password/validate', { challengeId, code });

                if (response.valid === true) {
                    setIsValidLink(true);
                    setValidSucessMsg('Password reset link is valid. Please set your new password.');
                    setFormError('');
                } else {
                    setIsValidLink(false);
                    const errorMessage = 'Invalid or expired password reset link. Please request a new one.';
                    setFormError(errorMessage);
                }
            } catch (error) {
                const errorMessage = error.data?.message || 'Invalid or expired password reset link. Please request a new one.';
                setIsValidLink(false);
                setFormError(errorMessage);
            } finally {
                hideLoading();
                setLoading(false);
                setValidationAttempted(true);
            }
        };

        validateLink();

    }, [searchParams, showLoading, hideLoading, validationAttempted]);

    // Handle password reset form submission
    const handleResetSubmit = async (values) => {
        const challengeId = searchParams.get('challengeId');
        const code = searchParams.get('code');
        const { newPassword } = values;

        try {
            showLoading({ type: 'spinner', size: 'md', fullscreen: true });
            await post('auth/password/reset', {
                challengeId,
                code,
                password: newPassword,
            });
            setResetSuccessful(true);
            showSuccessToast('Password updated successfully!');
        } catch (error) {
            const errorMessage = error.data?.message || 'Failed to update password. Please try again.';
            setFormError(errorMessage);
            showErrorToast(errorMessage);
            setResetSuccessful(false);
        } finally {
            hideLoading();
        }
    };

    return (
        <div className='flex min-h-screen'>
            {/* Carousel Section */}
            <div className='relative flex-1 hidden lg:block'>
                {carouselImages.map((img, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentSlide === index ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        <img src={img} className="w-full h-screen object-cover" loading='lazy' alt={`Slide ${index + 1}`} />
                        <div className="absolute inset-x-0 bottom-0 p-10 text-white bg-gradient-to-t from-black/75 to-transparent">
                            <h5 className='text-2xl font-semibold mb-2'>{carouselTexts[index].heading}</h5>
                            <p>{carouselTexts[index].text}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Form Container */}
            <div className="flex flex-1 items-center justify-center p-4 lg:bg-transparent lg:p-0">
                <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                    {/* Conditional Rendering based on state */}
                    {loading ? (
                        <div className="text-center">
                            <Loading type='dots' size='sm' message='Verifying link...' />
                        </div>
                    ) : isValidLink ? (
                        resetSuccessful ? (
                            <div className="text-center p-4">
                                <div className="flex justify-center mb-3">
                                    <FaCheckCircle size={40} className='text-green-500' />
                                </div>
                                <h4 className="text-green-500 my-3 text-xl font-bold">Password Changed Successfully!</h4>
                                <p className="text-gray-600">Your password has been updated. You can now log in with your new password.</p>
                                <Button
                                    variant='solid'
                                    size='sm'
                                    label='Go to Login'
                                    className='mt-4 w-full'
                                    onClick={() => navigate('/login')}
                                />
                            </div>
                        ) : (
                            <div>
                                <Formik
                                    initialValues={{ newPassword: '', confirmPassword: '' }}
                                    validationSchema={resetPasswordValidationSchema}
                                    onSubmit={handleResetSubmit}
                                >
                                    {() => (
                                        <Form className="p-4">
                                            <h3 className="text-center text-2xl font-bold mb-4">Reset Password</h3>
                                            <div className="text-center text-red-500 mb-3">
                                                {formError && <p>{formError}</p>}
                                            </div>
                                            <div className="text-center mb-3">
                                                {isValidLink === true && !formError ? (
                                                    <p className='text-green-500'>{validSuccessMsg}</p>
                                                ) : (
                                                    ''
                                                )}
                                            </div>
                                            <div className="mb-3">
                                                <label className="block text-gray-700 font-semibold mb-1">
                                                    New Password
                                                    <span className="relative inline-block ml-2 group cursor-pointer text-gray-400 d-none">
                                                        <FaInfoCircle size={14} className='mb-1' />
                                                        <div className="absolute left-1/2 -top-full -mt-2 transform -translate-x-1/2 p-2 w-56 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 before:content-[''] before:absolute before:left-1/2 before:top-full before:-mt-2 before:transform before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-gray-800">
                                                            Your password must contain at least one lowercase letter (a-z), one uppercase letter (A-Z), one number (0-9), and one special character (@$!%*?&), and be 8-25 characters long.
                                                        </div>
                                                    </span>
                                                </label>
                                                <div className="relative">
                                                    <Field
                                                        type={showPassword ? 'text' : 'password'}
                                                        name="newPassword"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-3 focus:ring-violet-200"
                                                        placeholder="Enter new password"
                                                    />
                                                    <span className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500" onClick={() => setShowPassword(prev => !prev)}>
                                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                    </span>
                                                </div>
                                                <ErrorMessage name="newPassword" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-gray-700 font-semibold mb-1">Confirm Password</label>
                                                <div className="relative">
                                                    <Field
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        name="confirmPassword"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-3 focus:ring-violet-300"
                                                        placeholder="Confirm new password"
                                                    />
                                                    <span className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500" onClick={() => setShowConfirmPassword(prev => !prev)}>
                                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                                    </span>
                                                </div>
                                                <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>
                                            <Button
                                                type='submit'
                                                variant='solid'
                                                size='sm'
                                                label='Reset Password'
                                                className='w-full mt-4'
                                            />
                                        </Form>
                                    )}
                                </Formik>
                            </div>
                        )
                    ) : (
                        <div className="text-center p-4">
                            <img src={linkExpired} alt="Link Expired" className='max-w-[300px] mx-auto' />
                            <h4 className="text-red-500 my-3 text-lg font-bold">{formError}</h4>
                            <Button
                                variant='solid'
                                size='sm'
                                label='Back to Login'
                                className='mt-4 w-full'
                                onClick={() => navigate('/login')}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}