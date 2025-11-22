import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '@context/AuthContext'
import { ThemeProvider } from '@context/ThemeContext'
import { LoadingProvider } from '@context/LoadingContext'
import { ModalProvider } from '@context/GlobalModalContext'
import { OffCanvasProvider } from '@context/GlobalOffCanvasContext'
import GlobalTooltip from '@components/common/GlobalTooltip'
import { ToastContainer } from 'react-toastify'; //toastify container declaration
import 'react-toastify/dist/ReactToastify.css'; // react toastify css
import 'bootstrap/dist/css/bootstrap.min.css' //bootstrap css
import "react-datepicker/dist/react-datepicker.css"; //react date picker
import "react-calendar/dist/Calendar.css"; //react calendar
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
        <ModalProvider>
          <OffCanvasProvider>
            <ThemeProvider>
              <LoadingProvider>
                <App />
                <ToastContainer position="top-right" autoClose={3000} />
                <GlobalTooltip /> {/* Global Tool Tip */}
              </LoadingProvider>
            </ThemeProvider>
          </OffCanvasProvider>
        </ModalProvider>
    </AuthProvider>
  </StrictMode>,
)
