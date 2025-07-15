import React from 'react';
import { Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DeviceEnrollment from './pages/DeviceEnrollment';
import IntentTokens from './pages/IntentTokens';
import CapsuleAccess from './pages/CapsuleAccess';
import SecurityEvents from './pages/SecurityEvents';
import AdminPanel from './pages/AdminPanel';

// Import Layer Pages
import CADSPage from './pages/layers/CADS';
import MSESPage from './pages/layers/MSES';
import SHELPage from './pages/layers/SHEL';
import ILECGPage from './pages/layers/ILECG';
import QVDMPage from './pages/layers/QVDM';
import TRDNPage from './pages/layers/TRDN';
import ADCFPage from './pages/layers/ADCF';

const routes = [
  <Route path="/login" element={<Login />} key="login" />,
  <Route path="/register" element={<Register />} key="register" />,
  <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} key="dashboard" />,
  <Route path="/devices" element={<PrivateRoute><DeviceEnrollment /></PrivateRoute>} key="devices" />,
  <Route path="/intents" element={<PrivateRoute><IntentTokens /></PrivateRoute>} key="intents" />,
  <Route path="/capsules" element={<PrivateRoute><CapsuleAccess /></PrivateRoute>} key="capsules" />,
  <Route path="/events" element={<PrivateRoute><SecurityEvents /></PrivateRoute>} key="events" />,
  <Route path="/admin" element={<PrivateRoute admin><AdminPanel /></PrivateRoute>} key="admin" />,
  
  // U-ARS 7 Layer Routes
  <Route path="/layers/cads" element={<PrivateRoute><CADSPage /></PrivateRoute>} key="cads" />,
  <Route path="/layers/mses" element={<PrivateRoute><MSESPage /></PrivateRoute>} key="mses" />,
  <Route path="/layers/shel" element={<PrivateRoute><SHELPage /></PrivateRoute>} key="shel" />,
  <Route path="/layers/ilecg" element={<PrivateRoute><ILECGPage /></PrivateRoute>} key="ilecg" />,
  <Route path="/layers/qvdm" element={<PrivateRoute><QVDMPage /></PrivateRoute>} key="qvdm" />,
  <Route path="/layers/trdn" element={<PrivateRoute><TRDNPage /></PrivateRoute>} key="trdn" />,
  <Route path="/layers/adcf" element={<PrivateRoute><ADCFPage /></PrivateRoute>} key="adcf" />,
  
  <Route path="*" element={<Login />} key="default" />
];

export default routes;
