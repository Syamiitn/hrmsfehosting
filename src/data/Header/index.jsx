import React, { useState, useRef } from 'react';
import Avatar from '@components/common/Avatar';
import PopoverContainer from "@components/common/PopoverContainer";
import { THEME_COLORS } from '@config/component.config';
import { useAuth } from '@context/AuthContext';
import { useLoading } from '@context/LoadingContext';
import { useTheme } from '@context/ThemeContext';
import Loading from '@components/common/Loading';
import { useApi } from '@hooks/useApi';
import { useModal } from '@context/GlobalModalContext';
import Button from '@components/common/Button';

// icons
import { Bell, Menu, Sun, Moon, LogOut, CircleAlert } from 'lucide-react';

import './index.css';

export default function Header({ onMenuClick }) {

    const [openNotif, setOpenNotif] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);
    const [isLoading, setIsLoading] = useState(false)

    // consume theme context
    const { themeMode, toggleThemeMode, changeTheme } = useTheme();
    const { user, logout } = useAuth();
    const { showLoading, hideLoading } = useLoading()

    // loading & apis
    const { openModal, closeModal } = useModal();

    // popovers
    const notifRef = useRef(null);
    const profileRef = useRef(null);


    // close one popover when opening the other
    const toggleNotif = () => {
        setOpenProfile(false);
        setOpenNotif(prev => !prev);
    };

    const toggleProfile = () => {
        setOpenNotif(false);
        setOpenProfile(prev => !prev);
    };

    // Handle logout
    const handleLogout = () => {
        openModal(
            <LogoutModal
                onClose={closeModal}
                onLogout={performLogout}
                isLoading={isLoading}
            />,
            { title: 'Logout', size: 'sm' }
        );
    };

    const performLogout = async (deviceType) => {
        try {
            setIsLoading(true);
            showLoading({
                type: 'spinner',
                size: 'lg',
                message: 'Logging Out...',
                fullscreen: true
            });

            await logout(deviceType);  // pass "single" or "all"

            hideLoading();
            closeModal();

            navigate('/login', { replace: true });
        } catch (err) {
            console.error(err);
            hideLoading();
            setIsLoading(false);
        }
    };


    return (
        <div className='layout-header'>
            {/* Logo Container */}
            <div className="d-flex align-items-center gap-3">
                <div className="logo-container">
                    <h1>SOGO</h1>
                </div>
                <div className="client-name d-none d-lg-block">
                    <h5>Tetriq Solutions</h5>
                </div>
            </div>

            {/* Search */}
            <div className="search-container d-none d-lg-block">
                <input type="search" className='seach-input' placeholder='Search...' />
            </div>

            {/* Profile + Notifications */}
            <div className="d-flex align-items-center gap-2 pe-3">

                {/* Notifications */}
                <div className="d-none d-lg-block" onClick={toggleNotif} ref={notifRef}>
                    <div className='notifications-container' role='button'>
                        <Bell className='icon' />
                        <span className="indecator"></span>
                    </div>
                </div>

                {/* Notification Popover */}
                <PopoverContainer open={openNotif} onClose={() => setOpenNotif(false)} anchorRef={notifRef}>
                    <div className="notif-popover">
                        <h4>Notifications</h4>
                        <div className="notif-item">No new notifications</div>
                    </div>
                </PopoverContainer>

                {/* Profile */}
                <div role='button' className="profile container d-none d-lg-block" onClick={toggleProfile} ref={profileRef}>
                    <div className='d-flex align-items-center gap-2'>
                        <Avatar
                            firstName={user?.firstName || 'First Name'}
                            lastName={user?.lastName || 'Last Name'}
                            imgUrl={user?.profilePicUrl}
                            size={40}
                        />
                        <div>
                            <h5>{user?.firstName || 'First Name'} {user?.lastName || 'Last Name'}</h5>
                            <p className="p2">{user?.jobTitle || 'Job Title'}</p>
                        </div>
                    </div>
                </div>

                {/* Profile Popover */}
                <PopoverContainer open={openProfile} onClose={() => setOpenProfile(false)} anchorRef={profileRef}>
                    <div className="profile-popover">
                        {/* <ul className="colors-container">
                            {['purple', 'blue', 'green', 'orange', 'red'].map(item => (
                                <li className={`box box-${item}`} key={item}></li>
                            ))}
                        </ul> */}
                        {/* Theme controls */}

                        {/* Logout button */}
                        <button className="logout-option" onClick={handleLogout}>
                            <LogOut className='icon' /> Logout
                        </button>

                        <hr />
                        <div className="colors-container">
                            {THEME_COLORS.map((color) => (
                                <div
                                    key={color}
                                    className={`box box-${color}`}
                                    onClick={() => changeTheme(color)}
                                    role='button'
                                />
                            ))}
                        </div>
                        <hr />
                        <div className="d-flex justify-content-center align-items-center gap-3">
                            <Sun className='sun' />
                            <label className="sogo-switch">
                                <input type="checkbox" onChange={toggleThemeMode} checked={themeMode === 'dark'} />
                                <span className="sogo-switch-track">
                                    <span className="sogo-switch-thumb"></span>
                                </span>
                            </label>
                            <Moon className='moon' />
                        </div>
                    </div>
                </PopoverContainer>

                {/* Mobile Menu */}
                <div className="menu-container d-block d-lg-none">
                    <Menu className='icon' size={36} role='button' onClick={onMenuClick} />
                </div>
            </div>
        </div>
    );
}

// Logout modal 
const LogoutModal = ({ onClose, onLogout, isLoading }) => {
    return (
        <div className="logout-container">
            <div className="logout-modal-card">

                <CircleAlert className='icon' />

                <h3 className="logout-title">Confirm Logout</h3>

                <p className="text-center p3">
                    Do you want to logout from the current device or all devices?
                </p>

                <hr />

                <div className="logout-actions">
                    {isLoading ? (
                        <div className="d-flex gap-2 align-items-center">
                            <Loading type='spinner' size='sm' />
                            <p className="p3">Logging Out...</p>
                        </div>
                    ) : (
                        <>
                            <Button
                                variant='solid'
                                size='sm'
                                label='Current Device'
                                radius={5}
                                onClick={() => onLogout('single')}
                            />

                            <Button
                                variant='solid'
                                size='sm'
                                label='All Devices'
                                radius={5}
                                onClick={() => onLogout('all')}
                            />

                            <Button
                                variant='outline'
                                size='sm'
                                label='Cancel'
                                radius={5}
                                onClick={onClose}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
