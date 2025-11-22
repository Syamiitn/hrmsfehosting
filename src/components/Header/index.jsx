import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    MdMenu,
    MdPersonOutline,
    MdVpnKey,
    MdPowerSettingsNew,
    MdSearch,
    MdNotificationsNone,
    MdSettings
} from 'react-icons/md';
import { CiWarning } from 'react-icons/ci';

import RoleGate from '@components/RoleGate';
import { useAuth } from '@context/AuthContext';
import { useLoading } from '@context/LoadingContext';
import Avatar from '@components/common/Avatar';
import Button from '@components/common/Button';
import { useTheme } from '@context/ThemeContext';
import { THEME_COLORS } from '@config/component.config';
import './index.css';

export default function Header({ setShowSidebar, notifications = [] }) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [isRendered, setIsRendered] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [showNotif, setShowNotif] = useState(false);

    const dropdownRef = useRef(null);
    const notifRef = useRef(null);
    const searchInputRef = useRef(null);
    const navigate = useNavigate();

    const { showLoading, hideLoading } = useLoading();
    const { logout, user } = useAuth();

    // consume theme context
    const { themeMode, toggleThemeMode, changeTheme } = useTheme();

    // Close menus on outside click
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
                setTimeout(() => setIsRendered(false), 200);
            }
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotif(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // Focus floating search when opened
    useEffect(() => {
        if (showMobileSearch && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 0);
        }
    }, [showMobileSearch]);

    const toggleProfileDropdown = () => {
        if (showDropdown) {
            setShowDropdown(false);
            setTimeout(() => setIsRendered(false), 200);
        } else {
            setIsRendered(true);
            setShowDropdown(true);
        }
    };

    const handleLogout = async (device) => {
        showLoading({ type: 'spinner', size: 'lg', message: 'Logging Out', fullscreen: true });
        await logout(device);
        hideLoading();
        setShowLogoutModal(false);
        navigate('/login', { replace: true });
    };

    const onSearchSubmit = (e) => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get('q')?.toString().trim();
        console.log('Search query:', q);
        setShowMobileSearch(false);
    };

    const unseenCount = notifications.filter(n => n.unread).length;

    return (
        <header className="header px-3 py-1 mt-1">
            {/* Left: toggle (mobile) + client brand */}
            <div className="left-cluster d-flex align-items-center gap-2">
                <button
                    className="toggle-btn d-md-block d-lg-none btn text-light outline-none me-1"
                    onClick={() => setShowSidebar((prev) => !prev)}
                    aria-label="Toggle sidebar"
                >
                    <MdMenu size={24} />
                </button>

                <div className="brand-pill d-none d-lg-block">
                    <span className="brand-name">Tetriq&nbsp;Solutions</span>
                </div>
            </div>

            {/* Center: global search (visible ≥576px) */}
            <form className="global-search d-none d-sm-block ms-2 me-2" onSubmit={onSearchSubmit} role="search">
                <MdSearch className="search-icon" aria-hidden />
                <input
                    className="search-input focus:outline-2 outline-violet-200"
                    type="search"
                    name="q"
                    placeholder="Search across the app…"
                    aria-label="Global search"
                />
            </form>

            {/* Right: search (mobile), bell, profile */}
            <div className="right-cluster">
                {/* Search trigger (xs only) */}
                <button
                    type="button"
                    className="icon-btn d-sm-none"
                    aria-label="Open search"
                    onClick={() => setShowMobileSearch(true)}
                >
                    <MdSearch size={20} />
                </button>

                {/* Notifications */}
                <div className="position-relative notif-wrapper" ref={notifRef}>
                    <button
                        type="button"
                        className="icon-btn"
                        aria-label="Notifications"
                        onClick={() => setShowNotif(prev => !prev)}
                    >
                        <MdNotificationsNone size={22} />
                        {unseenCount > 0 && <span className="notif-badge">{unseenCount}</span>}
                    </button>

                    {showNotif && (
                        <div className="notif-menu">
                            <div className="notif-header">
                                <h5>Notifications</h5>
                            </div>
                            <div className="notif-body">
                                {notifications.length === 0 ? (
                                    <div className="notif-empty">No notifications</div>
                                ) : (
                                    notifications.map(n => (
                                        <div className={`notif-item ${n.unread ? 'unread' : ''}`} key={n.id}>
                                            <div className="notif-title">{n.title}</div>
                                            {n.body && <div className="notif-text">{n.body}</div>}
                                            {n.time && <div className="notif-time">{n.time}</div>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="position-relative" ref={dropdownRef}>
                    <div className="profile-container d-flex align-items-center cursor-pointer" onClick={toggleProfileDropdown}>
                        <Avatar firstName={user?.firstName || 'First Name'} lastName={user?.lastName || 'Last Name'} imgUrl={user?.profilePicUrl || null} size={40} />
                        <div className="profile-info ms-2">
                            <h6 className="mb-0">{user?.firstName || 'First Name'} {user?.lastName || 'Last Name'}</h6>
                            <small className='designation' style={{ color: 'var(--gray-500)' }}>{user?.jobTitle || 'job title'}</small>
                        </div>
                    </div>

                    {isRendered && (
                        <div className={`dropdown-menu-box shadow-lg ${showDropdown ? 'fade-in' : 'fade-out'}`}>
                            <ul className="list-unstyled mb-2">
                                <li className="dropdown-item">
                                    <MdPersonOutline size={20} className="icon" /> View profile
                                </li>
                                <li className="dropdown-item">
                                    <MdVpnKey size={20} className="icon" /> Change Password
                                </li>
                                {/* New Global Settings item with Link */}
                                <RoleGate allow={['admin']}>
                                    <li className="dropdown-item">
                                        <Link to="/admin/globalsettings"
                                            onClick={() => setIsRendered(false)}
                                            className="d-flex align-items-center text-decoration-none text-dark">
                                            <MdSettings size={20} className="icon" />
                                            <span className="ms-2">Global Settings</span>
                                        </Link>
                                    </li>
                                </RoleGate>
                                <li className="dropdown-item" onClick={() => setShowLogoutModal(true)}>
                                    <MdPowerSettingsNew size={20} className="icon" /> Logout
                                </li>
                            </ul>
                            <hr />
                            {/* Theme controls */}
                            <div className="theme-boxs-container">
                                {THEME_COLORS.map((color) => (
                                    <div
                                        key={color}
                                        className={`theme-box bg-theme-${color}`}
                                        onClick={() => changeTheme(color)}
                                    />
                                ))}
                            </div>
                            <div className="text-center pb-2">
                                <small className="me-2">Light</small>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={themeMode === 'dark'}
                                        onChange={toggleThemeMode}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <small className="ms-2">Dark</small>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating mobile search */}
            {showMobileSearch && (
                <div className="mobile-search-overlay" onClick={() => setShowMobileSearch(false)}>
                    <form
                        className="mobile-search-box"
                        onSubmit={onSearchSubmit}
                        onClick={(e) => e.stopPropagation()}
                        role="search"
                    >
                        <MdSearch className="search-icon" aria-hidden />
                        <input
                            ref={searchInputRef}
                            className="search-input"
                            type="search"
                            name="q"
                            placeholder="Search…"
                            aria-label="Global search"
                        />
                        <Button type="submit" variant="solid" size="sm" label="Go" />
                    </form>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="modal-backdrop">
                    <div className="modal-box">
                        <div className="d-flex justify-content-center">
                            <CiWarning size={80} className="text-danger" />
                        </div>
                        <h3 className="fw-bold mt-3">Confirm Logout</h3>
                        <p className='p3'>Do you want to logout from the current device or all devices?</p>
                        <div className="d-flex justify-content-center gap-2 mt-3">
                            <Button type="button" variant="solid" label="Current Device" size="sm" onClick={() => handleLogout('single')} />
                            <Button type="button" variant="solid" label="All Devices" size="sm" onClick={() => handleLogout('all')} />
                            <Button type="button" variant="outline" label="Cancel" size="sm" onClick={() => setShowLogoutModal(false)} />
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
